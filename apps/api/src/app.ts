import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Router } from "express";
import { z } from "zod";
import { loadEnv } from "./config/env.js";
import { addDays } from "./core/time.js";
import { errorHandler, notFoundHandler } from "./core/error-middleware.js";
import { AppError } from "./core/errors.js";
import { requestIdMiddleware } from "./core/request-id.js";
import { asyncHandler } from "./core/http.js";
import { AuditRepository } from "./modules/audit/audit.repository.js";
import { AuditService } from "./modules/audit/audit.service.js";
import { AnalyticsController } from "./modules/analytics/analytics.controller.js";
import { createAnalyticsRouter } from "./modules/analytics/analytics.routes.js";
import { AnalyticsService } from "./modules/analytics/analytics.service.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { createAuthMiddleware, subscriptionGuardMiddleware } from "./modules/auth/auth.middleware.js";
import { AuthRepository } from "./modules/auth/auth.repository.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { BillingController } from "./modules/billing/billing.controller.js";
import { createBillingRouter } from "./modules/billing/billing.routes.js";
import { BillingService } from "./modules/billing/billing.service.js";
import { createCampaignsRouter } from "./modules/campaigns/campaigns.routes.js";
import { CampaignsController } from "./modules/campaigns/campaigns.controller.js";
import { CampaignsRepository } from "./modules/campaigns/campaigns.repository.js";
import { CampaignsService } from "./modules/campaigns/campaigns.service.js";
import { ComplianceController } from "./modules/compliance/compliance.controller.js";
import { ComplianceRepository } from "./modules/compliance/compliance.repository.js";
import { createComplianceRouter } from "./modules/compliance/compliance.routes.js";
import { ComplianceService } from "./modules/compliance/compliance.service.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { LeadsController } from "./modules/leads/leads.controller.js";
import { LeadsRepository } from "./modules/leads/leads.repository.js";
import { createLeadsRouter } from "./modules/leads/leads.routes.js";
import { LeadsService } from "./modules/leads/leads.service.js";
import { RemindersController } from "./modules/reminders/reminders.controller.js";
import { RemindersRepository } from "./modules/reminders/reminders.repository.js";
import { createRemindersRouter } from "./modules/reminders/reminders.routes.js";
import { RemindersService } from "./modules/reminders/reminders.service.js";
import { TemplatesController } from "./modules/templates/templates.controller.js";
import { TemplatesRepository } from "./modules/templates/templates.repository.js";
import { createTemplatesRouter } from "./modules/templates/templates.routes.js";
import { TemplatesService } from "./modules/templates/templates.service.js";
import { WebhooksController } from "./modules/whatsapp/webhooks.controller.js";
import { WebhookEventsRepository } from "./modules/whatsapp/webhook-events.repository.js";
import { createWebhooksRouter } from "./modules/whatsapp/webhooks.routes.js";
import { WhatsAppService } from "./modules/whatsapp/whatsapp.service.js";

export const createApp = () => {
  const env = loadEnv();
  const allowedWebOrigins = env.appOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const isAllowedOrigin = (origin: string | undefined): boolean => {
    if (!origin) {
      return true;
    }

    if (origin.startsWith("chrome-extension://")) {
      return true;
    }

    if (origin === "https://web.whatsapp.com") {
      return true;
    }

    return allowedWebOrigins.includes(origin);
  };

  const authRepository = new AuthRepository();
  const leadsRepository = new LeadsRepository();
  const templatesRepository = new TemplatesRepository();
  const campaignsRepository = new CampaignsRepository();
  const remindersRepository = new RemindersRepository();
  const webhookEventsRepository = new WebhookEventsRepository();
  const auditRepository = new AuditRepository();
  const complianceRepository = new ComplianceRepository();

  const authService = new AuthService(authRepository, env);
  const authMiddleware = createAuthMiddleware(authService);
  const whatsappService = new WhatsAppService(env, webhookEventsRepository);
  const billingService = new BillingService(authRepository, env);
  const auditService = new AuditService(auditRepository);
  const leadsService = new LeadsService(leadsRepository, auditService, authRepository);
  const analyticsService = new AnalyticsService(leadsRepository, authRepository, campaignsRepository);
  const templatesService = new TemplatesService(templatesRepository);
  const campaignsService = new CampaignsService(
    campaignsRepository,
    leadsRepository,
    templatesRepository,
    whatsappService,
    env,
    auditService,
  );
  const remindersService = new RemindersService(remindersRepository, leadsRepository, auditService);
  const complianceService = new ComplianceService(
    complianceRepository,
    leadsRepository,
    campaignsRepository,
    auditService,
    env,
  );

  const authController = new AuthController(authService);
  const billingController = new BillingController(billingService);
  const leadsController = new LeadsController(leadsService);
  const templatesController = new TemplatesController(templatesService);
  const campaignsController = new CampaignsController(campaignsService);
  const remindersController = new RemindersController(remindersService);
  const complianceController = new ComplianceController(complianceService);
  const analyticsController = new AnalyticsController(analyticsService);
  const webhooksController = new WebhooksController(whatsappService);

  const app = express();
  app.disable("x-powered-by");
  const helmetAny = helmet as any;
  const helmetFactory =
    typeof helmetAny === "function"
      ? helmetAny
      : typeof helmetAny?.default === "function"
        ? helmetAny.default
        : null;
  if (helmetFactory) {
    app.use(helmetFactory());
  }
  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin));
      },
      credentials: false,
    }),
  );
  app.use(requestIdMiddleware);
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", createHealthRouter());
  app.use("/api/v1/auth", createAuthRouter(authController, authMiddleware));
  app.use("/api/v1/billing", createBillingRouter(billingController, authMiddleware));

  const adminSyncSchema = z.object({
    email: z.string().trim().email().max(180),
    enabled: z.boolean(),
    months: z.number().int().min(1).max(12).optional(),
  });
  const adminStatusBatchSchema = z.object({
    emails: z.array(z.string().trim().email().max(180)).min(1).max(100),
  });
  const adminRouter = Router();
  adminRouter.post(
    "/sync-subscription",
    asyncHandler(async (req, res) => {
      if (!env.adminSyncKey) {
        throw new AppError({
          statusCode: 503,
          code: "INTERNAL_ERROR",
          message: "ADMIN_SYNC_KEY no configurado",
        });
      }

      const syncKey = String(req.header("x-admin-sync-key") || "").trim();
      if (!syncKey || syncKey !== env.adminSyncKey) {
        throw new AppError({
          statusCode: 401,
          code: "UNAUTHORIZED",
          message: "x-admin-sync-key invalido",
        });
      }

      const payload = adminSyncSchema.parse(req.body);
      const user = await authRepository.findUserByEmail(payload.email);
      if (!user) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Usuario CRM Extension no encontrado para ese email",
        });
      }

      const workspace = await authRepository.findWorkspaceById(user.workspaceId);
      if (!workspace) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Workspace no encontrado",
        });
      }

      const nowIso = new Date().toISOString();
      const months = payload.months ?? 1;
      let patch;
      if (payload.enabled) {
        const currentEndTime = new Date(workspace.currentPeriodEnd).getTime();
        const baseIso = currentEndTime > Date.now() ? workspace.currentPeriodEnd : nowIso;
        const extensionDays = env.billingPeriodDays * months;
        patch = {
          subscriptionStatus: "active" as const,
          currentPeriodStart: nowIso,
          currentPeriodEnd: addDays(baseIso, extensionDays),
          lastPaymentAt: nowIso,
        };
      } else {
        patch = {
          subscriptionStatus: "past_due" as const,
          currentPeriodEnd: new Date(Date.now() - 60 * 1000).toISOString(),
        };
      }

      const updated = await authRepository.updateWorkspace(workspace.id, patch);
      if (!updated) {
        throw new AppError({
          statusCode: 500,
          code: "INTERNAL_ERROR",
          message: "No se pudo sincronizar suscripcion",
        });
      }

      const isInPeriod = new Date(updated.currentPeriodEnd).getTime() > Date.now();
      res.status(200).json({
        ok: true,
        email: user.email,
        userId: user.id,
        workspaceId: updated.id,
        subscription: {
          subscriptionStatus: updated.subscriptionStatus,
          currentPeriodStart: updated.currentPeriodStart,
          currentPeriodEnd: updated.currentPeriodEnd,
          canUseCrm: updated.subscriptionStatus === "active" && isInPeriod,
        },
      });
    }),
  );
  adminRouter.post(
    "/subscriptions-by-email",
    asyncHandler(async (req, res) => {
      if (!env.adminSyncKey) {
        throw new AppError({
          statusCode: 503,
          code: "INTERNAL_ERROR",
          message: "ADMIN_SYNC_KEY no configurado",
        });
      }

      const syncKey = String(req.header("x-admin-sync-key") || "").trim();
      if (!syncKey || syncKey !== env.adminSyncKey) {
        throw new AppError({
          statusCode: 401,
          code: "UNAUTHORIZED",
          message: "x-admin-sync-key invalido",
        });
      }

      const payload = adminStatusBatchSchema.parse(req.body);
      const nowMs = Date.now();
      const uniqueEmails = Array.from(new Set(payload.emails.map((email) => email.toLowerCase())));

      const results = await Promise.all(
        uniqueEmails.map(async (email) => {
          const user = await authRepository.findUserByEmail(email);
          if (!user) {
            return {
              email,
              found: false,
              userId: null,
              workspaceId: null,
              subscriptionStatus: null,
              currentPeriodEnd: null,
              canUseCrm: false,
            };
          }

          const workspace = await authRepository.findWorkspaceById(user.workspaceId);
          if (!workspace) {
            return {
              email,
              found: false,
              userId: user.id,
              workspaceId: user.workspaceId,
              subscriptionStatus: null,
              currentPeriodEnd: null,
              canUseCrm: false,
            };
          }

          const isInPeriod = new Date(workspace.currentPeriodEnd).getTime() > nowMs;
          return {
            email,
            found: true,
            userId: user.id,
            workspaceId: workspace.id,
            subscriptionStatus: workspace.subscriptionStatus,
            currentPeriodEnd: workspace.currentPeriodEnd,
            canUseCrm: workspace.subscriptionStatus === "active" && isInPeriod,
          };
        }),
      );

      res.status(200).json({ results });
    }),
  );
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/webhooks", createWebhooksRouter(webhooksController));

  const crmRouter = Router();
  crmRouter.use(authMiddleware);
  crmRouter.use(subscriptionGuardMiddleware);
  crmRouter.use("/leads", createLeadsRouter(leadsController));
  crmRouter.use("/templates", createTemplatesRouter(templatesController));
  crmRouter.use("/campaigns", createCampaignsRouter(campaignsController));
  crmRouter.use("/reminders", createRemindersRouter(remindersController));
  crmRouter.use("/compliance", createComplianceRouter(complianceController));
  crmRouter.use("/analytics", createAnalyticsRouter(analyticsController));
  app.use("/api/v1", crmRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, env };
};
