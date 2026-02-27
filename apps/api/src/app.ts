import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Router } from "express";
import { loadEnv } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./core/error-middleware.js";
import { requestIdMiddleware } from "./core/request-id.js";
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

  const authService = new AuthService(authRepository, env);
  const authMiddleware = createAuthMiddleware(authService);
  const whatsappService = new WhatsAppService(env, webhookEventsRepository);
  const billingService = new BillingService(authRepository, env);
  const leadsService = new LeadsService(leadsRepository);
  const templatesService = new TemplatesService(templatesRepository);
  const campaignsService = new CampaignsService(
    campaignsRepository,
    leadsRepository,
    templatesRepository,
    whatsappService,
    env,
  );
  const remindersService = new RemindersService(remindersRepository, leadsRepository);

  const authController = new AuthController(authService);
  const billingController = new BillingController(billingService);
  const leadsController = new LeadsController(leadsService);
  const templatesController = new TemplatesController(templatesService);
  const campaignsController = new CampaignsController(campaignsService);
  const remindersController = new RemindersController(remindersService);
  const webhooksController = new WebhooksController(whatsappService);

  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
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

  const crmRouter = Router();
  crmRouter.use(authMiddleware);
  crmRouter.use(subscriptionGuardMiddleware);
  crmRouter.use("/leads", createLeadsRouter(leadsController));
  crmRouter.use("/templates", createTemplatesRouter(templatesController));
  crmRouter.use("/campaigns", createCampaignsRouter(campaignsController));
  crmRouter.use("/reminders", createRemindersRouter(remindersController));
  app.use("/api/v1", crmRouter);

  app.use("/api/v1/webhooks", createWebhooksRouter(webhooksController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, env };
};
