import type { EnvConfig } from "../../config/env.js";
import { AppError } from "../../core/errors.js";
import { createId } from "../../core/id.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AuditActor } from "../audit/audit.types.js";
import type { CampaignsRepository } from "../campaigns/campaigns.repository.js";
import type { LeadsRepository } from "../leads/leads.repository.js";
import { isLeadOptedIn } from "../leads/leads.types.js";
import type {
  ComplianceMessagingMode,
  ComplianceTrustCenter,
  ManualAssistUsageResponse,
  ManualAssistUsageRecord,
} from "./compliance.types.js";
import { manualAssistSchema } from "./compliance.types.js";
import type { ComplianceRepository } from "./compliance.repository.js";

export class ComplianceService {
  constructor(
    private readonly complianceRepository: ComplianceRepository,
    private readonly leadsRepository: LeadsRepository,
    private readonly campaignsRepository: CampaignsRepository,
    private readonly auditService: AuditService,
    private readonly env: EnvConfig,
  ) {}

  public async getTrustCenter(workspaceId: string): Promise<ComplianceTrustCenter> {
    const leads = await this.leadsRepository.list(workspaceId);
    const totalLeads = leads.length;
    const optedInLeads = leads.reduce((acc, lead) => (isLeadOptedIn(lead) ? acc + 1 : acc), 0);
    const optInPercentage = totalLeads > 0 ? Number(((optedInLeads / totalLeads) * 100).toFixed(2)) : 0;

    const nowIso = new Date().toISOString();
    const dayKey = nowIso.slice(0, 10);
    const sentToday = await this.campaignsRepository.countSentMessagesForDay(workspaceId, dayKey);
    const remaining = Math.max(0, this.env.maxCampaignMessagesPerDay - sentToday);
    const usagePercentage = Number(((sentToday / this.env.maxCampaignMessagesPerDay) * 100).toFixed(2));

    const riskReasons: string[] = [];
    let riskScore = 0;

    if (totalLeads === 0) {
      riskReasons.push("No hay leads cargados para medir cobertura de consentimiento.");
      riskScore += 20;
    } else if (optInPercentage < 60) {
      riskReasons.push("Cobertura de opt-in baja (<60%).");
      riskScore += 55;
    } else if (optInPercentage < 80) {
      riskReasons.push("Cobertura de opt-in media (<80%).");
      riskScore += 30;
    }

    if (usagePercentage >= 90) {
      riskReasons.push("Uso diario de campanas por encima de 90%.");
      riskScore += 30;
    } else if (usagePercentage >= 70) {
      riskReasons.push("Uso diario de campanas por encima de 70%.");
      riskScore += 15;
    }

    if (remaining === 0) {
      riskReasons.push("Cuota diaria agotada.");
      riskScore += 25;
    }

    riskScore = Math.min(100, riskScore);
    const recentAuditLogs = await this.auditService.listRecent(workspaceId, 15);

    return {
      compliantMode: "on",
      optInCoverage: {
        totalLeads,
        optedInLeads,
        percentage: optInPercentage,
      },
      campaignDailyQuota: {
        maxPerDay: this.env.maxCampaignMessagesPerDay,
        sentToday,
        remaining,
        usagePercentage,
      },
      antiSpamRisk: {
        score: riskScore,
        level: this.toRiskLevel(riskScore),
        reasons: riskReasons,
      },
      recentAuditLogs,
      evaluatedAt: nowIso,
    };
  }

  public getMessagingMode(): ComplianceMessagingMode {
    const hasAccessToken = Boolean(this.env.whatsappAccessToken.trim());
    const hasPhoneNumberId = Boolean(this.env.whatsappPhoneNumberId.trim());
    const hasValidCloudCredentials = hasAccessToken && hasPhoneNumberId;
    const configuredMode = this.env.crmMessagingMode;
    const resolvedMode =
      configuredMode === "cloud_api" && hasValidCloudCredentials ? "cloud_api" : "crm_manual";
    const provider = resolvedMode === "cloud_api" ? "whatsapp_cloud_api" : "dry_run";

    let reason = "Modo CRM Manual: operacion asistida en WhatsApp Web, sin auto-envio.";
    if (configuredMode === "cloud_api" && hasValidCloudCredentials) {
      reason = "Modo Cloud API activo: credenciales presentes para envios oficiales.";
    } else if (configuredMode === "cloud_api" && !hasValidCloudCredentials) {
      reason = "Cloud API configurado pero sin credenciales completas; fallback a dry_run.";
    }

    return {
      configuredMode,
      resolvedMode,
      provider,
      dryRun: provider === "dry_run",
      cloudApiCredentials: {
        accessTokenPresent: hasAccessToken,
        phoneNumberIdPresent: hasPhoneNumberId,
        valid: hasValidCloudCredentials,
      },
      reason,
      evaluatedAt: new Date().toISOString(),
    };
  }

  public async registerManualAssist(
    workspaceId: string,
    actor: AuditActor,
    input: unknown,
  ): Promise<ManualAssistUsageResponse> {
    const payload = manualAssistSchema.parse(input);
    const now = new Date();
    const nowIso = now.toISOString();
    const minuteBucket = nowIso.slice(0, 16);
    const usedInCurrentMinute = await this.complianceRepository.countManualAssistForMinute(
      workspaceId,
      actor.userId,
      minuteBucket,
    );
    if (usedInCurrentMinute >= this.env.maxManualAssistActionsPerMinute) {
      throw new AppError({
        statusCode: 429,
        code: "RATE_LIMITED",
        message: "Limite por minuto excedido para acciones asistidas",
        details: {
          limitPerMinute: this.env.maxManualAssistActionsPerMinute,
          usedInCurrentMinute,
          minuteBucket,
        },
      });
    }

    const record: ManualAssistUsageRecord = {
      id: createId("cusage"),
      workspaceId,
      userId: actor.userId,
      action: payload.action,
      minuteBucket,
      workspaceUserMinuteKey: `${workspaceId}_${actor.userId}_${minuteBucket}`,
      context: payload.context ?? null,
      createdAt: nowIso,
    };
    await this.complianceRepository.createManualAssistUsage(record);

    const usedAfter = usedInCurrentMinute + 1;
    const remaining = Math.max(0, this.env.maxManualAssistActionsPerMinute - usedAfter);
    const resetAt = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes() + 1,
      0,
      0,
    )).toISOString();

    await this.safeAudit(workspaceId, actor, {
      scope: "compliance",
      action: "manual_assist_registered",
      entityType: "manual_assist",
      entityId: record.id,
      summary: `Uso de asistente manual: ${payload.action}`,
      details: {
        action: payload.action,
        limitPerMinute: this.env.maxManualAssistActionsPerMinute,
        usedInCurrentMinute: usedAfter,
        context: payload.context ?? null,
      },
    });

    return {
      action: payload.action,
      limitPerMinute: this.env.maxManualAssistActionsPerMinute,
      usedInCurrentMinute: usedAfter,
      remainingInCurrentMinute: remaining,
      minuteBucket,
      resetAt,
    };
  }

  private toRiskLevel(score: number): "low" | "medium" | "high" {
    if (score <= 30) {
      return "low";
    }
    if (score <= 65) {
      return "medium";
    }
    return "high";
  }

  private async safeAudit(
    workspaceId: string,
    actor: AuditActor | null,
    input: {
      scope: "compliance";
      action: string;
      entityType: string;
      entityId?: string | null;
      summary: string;
      details?: Record<string, unknown>;
    },
  ): Promise<void> {
    try {
      await this.auditService.log(workspaceId, actor, input);
    } catch (_error) {
      // Avoid blocking CRM flows when audit log persistence is unavailable.
    }
  }
}
