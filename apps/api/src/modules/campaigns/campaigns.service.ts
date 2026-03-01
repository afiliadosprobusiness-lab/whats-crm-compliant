import type { EnvConfig } from "../../config/env.js";
import { AppError } from "../../core/errors.js";
import { createId } from "../../core/id.js";
import { sleep } from "../../core/sleep.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AuditActor } from "../audit/audit.types.js";
import type { LeadsRepository } from "../leads/leads.repository.js";
import { isLeadOptedIn } from "../leads/leads.types.js";
import type { Template } from "../templates/templates.types.js";
import type { TemplatesRepository } from "../templates/templates.repository.js";
import type { WhatsAppService } from "../whatsapp/whatsapp.service.js";
import type { Campaign, CampaignPreflight, CampaignSendResult } from "./campaigns.types.js";
import { createCampaignSchema } from "./campaigns.types.js";
import type { CampaignsRepository } from "./campaigns.repository.js";

export class CampaignsService {
  constructor(
    private readonly campaignsRepository: CampaignsRepository,
    private readonly leadsRepository: LeadsRepository,
    private readonly templatesRepository: TemplatesRepository,
    private readonly whatsappService: WhatsAppService,
    private readonly env: EnvConfig,
    private readonly auditService: AuditService,
  ) {}

  public async createCampaign(workspaceId: string, actor: AuditActor | null, input: unknown): Promise<Campaign> {
    const payload = createCampaignSchema.parse(input);
    const template = await this.templatesRepository.findById(workspaceId, payload.templateId);
    if (!template) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Template no encontrado",
      });
    }

    const leads = await this.leadsRepository.findManyByIds(workspaceId, payload.recipientLeadIds);
    if (leads.length !== payload.recipientLeadIds.length) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Hay lead IDs invalidos",
      });
    }

    const now = new Date().toISOString();
    const campaign = await this.campaignsRepository.create({
      id: createId("cmp"),
      workspaceId,
      name: payload.name,
      templateId: payload.templateId,
      recipientLeadIds: payload.recipientLeadIds,
      status: "draft",
      sentCount: 0,
      failedCount: 0,
      createdAt: now,
      updatedAt: now,
      lastRunAt: null,
    });

    await this.safeAudit(workspaceId, actor, {
      scope: "campaign",
      action: "created",
      entityType: "campaign",
      entityId: campaign.id,
      summary: `Campana creada: ${campaign.name}`,
      details: {
        recipients: campaign.recipientLeadIds.length,
        templateId: campaign.templateId,
      },
    });

    return campaign;
  }

  public async listCampaigns(workspaceId: string): Promise<Campaign[]> {
    return this.campaignsRepository.list(workspaceId);
  }

  public async preflightDraftCampaign(
    workspaceId: string,
    actor: AuditActor | null,
    input: unknown,
  ): Promise<CampaignPreflight> {
    const payload = createCampaignSchema.parse(input);
    const template = await this.templatesRepository.findById(workspaceId, payload.templateId);
    if (!template) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Template no encontrado",
      });
    }

    const draftCampaign: Campaign = {
      id: "draft_preflight",
      workspaceId,
      name: payload.name,
      templateId: payload.templateId,
      recipientLeadIds: payload.recipientLeadIds,
      status: "draft",
      sentCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRunAt: null,
    };

    const preflight = await this.evaluateCampaignCompliance(workspaceId, draftCampaign);
    await this.safeAudit(workspaceId, actor, {
      scope: "campaign",
      action: "preflight_checked",
      entityType: "campaign",
      entityId: null,
      summary: `Preflight de borrador: ${payload.name}`,
      details: {
        canSend: preflight.canSend,
        blockers: preflight.blockers,
        riskScore: preflight.risk.score,
        recipients: payload.recipientLeadIds.length,
      },
    });

    return preflight;
  }

  public async preflightCampaign(
    workspaceId: string,
    actor: AuditActor | null,
    campaignId: string,
  ): Promise<CampaignPreflight> {
    const campaign = await this.campaignsRepository.findById(workspaceId, campaignId);
    if (!campaign) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Campana no encontrada",
      });
    }

    const preflight = await this.evaluateCampaignCompliance(workspaceId, campaign);
    await this.safeAudit(workspaceId, actor, {
      scope: "campaign",
      action: "preflight_checked",
      entityType: "campaign",
      entityId: campaign.id,
      summary: `Preflight de campana ${campaign.name}`,
      details: {
        canSend: preflight.canSend,
        blockers: preflight.blockers,
        riskScore: preflight.risk.score,
        nonOptedInPercentage: preflight.nonOptedInPercentage,
      },
    });

    return preflight;
  }

  public async sendCampaign(
    workspaceId: string,
    actor: AuditActor | null,
    campaignId: string,
  ): Promise<{ campaign: Campaign; results: CampaignSendResult[] }> {
    const campaign = await this.campaignsRepository.findById(workspaceId, campaignId);
    if (!campaign) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Campana no encontrada",
      });
    }

    if (campaign.status === "sending") {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message: "La campana ya esta enviandose",
      });
    }

    const preflight = await this.evaluateCampaignCompliance(workspaceId, campaign);
    if (!preflight.canSend) {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message: "Campana bloqueada por preflight de cumplimiento",
        details: {
          preflight,
        },
      });
    }

    const template = await this.templatesRepository.findById(workspaceId, campaign.templateId);
    if (!template) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Template asociado no encontrado",
      });
    }

    const leadRecords = await this.leadsRepository.findManyByIds(workspaceId, campaign.recipientLeadIds);
    const leadById = new Map(leadRecords.map((lead) => [lead.id, lead]));
    const optedInRecipientCount = preflight.optedInRecipients;

    const sentToday = preflight.dailyQuota.sentToday;
    const remainingDailyQuota = preflight.dailyQuota.remaining;
    if (optedInRecipientCount > remainingDailyQuota) {
      throw new AppError({
        statusCode: 429,
        code: "RATE_LIMITED",
        message: "Limite diario de envios alcanzado para este workspace",
        details: {
          maxCampaignMessagesPerDay: this.env.maxCampaignMessagesPerDay,
          sentToday,
          remainingDailyQuota,
          attemptedOptedInRecipients: optedInRecipientCount,
        },
      });
    }

    const nowIso = new Date().toISOString();
    await this.campaignsRepository.update(workspaceId, campaignId, {
      status: "sending",
      lastRunAt: nowIso,
    });

    const results: CampaignSendResult[] = [];
    let sentCount = 0;
    let failedCount = 0;

    const minWaitMs = Math.max(150, Math.floor(60_000 / this.env.maxCampaignMessagesPerMinute));

    for (let i = 0; i < campaign.recipientLeadIds.length; i += 1) {
      const leadId = campaign.recipientLeadIds[i];
      if (!leadId) {
        failedCount += 1;
        results.push({
          leadId: "unknown",
          phoneE164: "",
          status: "failed",
          provider: "dry_run",
          messageId: null,
          error: "Lead ID invalido",
        });
        continue;
      }

      const lead = leadById.get(leadId);
      const sentAt = new Date().toISOString();

      if (!lead) {
        failedCount += 1;
        const result: CampaignSendResult = {
          leadId,
          phoneE164: "",
          status: "failed",
          provider: "dry_run",
          messageId: null,
          error: "Lead no encontrado",
        };
        results.push(result);
        await this.campaignsRepository.createOutboundLog({
          id: createId("out"),
          workspaceId,
          workspaceDayKey: `${workspaceId}_${this.getDayKeyUtc(sentAt)}`,
          campaignId,
          leadId,
          phoneE164: "",
          status: result.status,
          provider: result.provider,
          messageId: result.messageId,
          error: result.error,
          sentAt,
        });
      } else if (!isLeadOptedIn(lead)) {
        failedCount += 1;
        const result: CampaignSendResult = {
          leadId: lead.id,
          phoneE164: lead.phoneE164,
          status: "failed",
          provider: "dry_run",
          messageId: null,
          error: "Lead sin consentimiento opted_in",
        };
        results.push(result);
        await this.campaignsRepository.createOutboundLog({
          id: createId("out"),
          workspaceId,
          workspaceDayKey: `${workspaceId}_${this.getDayKeyUtc(sentAt)}`,
          campaignId,
          leadId: result.leadId,
          phoneE164: result.phoneE164,
          status: result.status,
          provider: result.provider,
          messageId: result.messageId,
          error: result.error,
          sentAt,
        });
      } else {
        const text = this.interpolate(template, lead.name);
        const sendResult = await this.whatsappService.sendTextMessage(lead.phoneE164, text);
        if (sendResult.status === "sent") {
          sentCount += 1;
        } else {
          failedCount += 1;
        }

        const result: CampaignSendResult = {
          leadId: lead.id,
          phoneE164: lead.phoneE164,
          status: sendResult.status,
          provider: sendResult.provider,
          messageId: sendResult.messageId,
          error: sendResult.error,
        };
        results.push(result);
        await this.campaignsRepository.createOutboundLog({
          id: createId("out"),
          workspaceId,
          workspaceDayKey: `${workspaceId}_${this.getDayKeyUtc(sentAt)}`,
          campaignId,
          leadId: result.leadId,
          phoneE164: result.phoneE164,
          status: result.status,
          provider: result.provider,
          messageId: result.messageId,
          error: result.error,
          sentAt,
        });
      }

      if (i < campaign.recipientLeadIds.length - 1) {
        await sleep(minWaitMs);
      }
    }

    const finalStatus = failedCount > 0 ? "sent_with_errors" : "sent";
    const updated = await this.campaignsRepository.update(workspaceId, campaignId, {
      status: finalStatus,
      sentCount,
      failedCount,
      lastRunAt: new Date().toISOString(),
    });

    if (!updated) {
      throw new AppError({
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "No se pudo actualizar estado de campana",
      });
    }

    await this.safeAudit(workspaceId, actor, {
      scope: "campaign",
      action: "sent",
      entityType: "campaign",
      entityId: updated.id,
      summary: `Campana ejecutada: ${updated.name}`,
      details: {
        finalStatus,
        sentCount,
        failedCount,
      },
    });

    return { campaign: updated, results };
  }

  private async evaluateCampaignCompliance(workspaceId: string, campaign: Campaign): Promise<CampaignPreflight> {
    const leadRecords = await this.leadsRepository.findManyByIds(workspaceId, campaign.recipientLeadIds);
    const leadById = new Map(leadRecords.map((lead) => [lead.id, lead]));

    const totalRecipients = campaign.recipientLeadIds.length;
    let optedInRecipients = 0;
    let missingRecipients = 0;
    let nonOptedInRecipients = 0;

    campaign.recipientLeadIds.forEach((leadId) => {
      if (!leadId) {
        missingRecipients += 1;
        nonOptedInRecipients += 1;
        return;
      }

      const lead = leadById.get(leadId);
      if (!lead) {
        missingRecipients += 1;
        nonOptedInRecipients += 1;
        return;
      }

      if (isLeadOptedIn(lead)) {
        optedInRecipients += 1;
      } else {
        nonOptedInRecipients += 1;
      }
    });

    const nonOptedInPercentage =
      totalRecipients > 0 ? Number(((nonOptedInRecipients / totalRecipients) * 100).toFixed(2)) : 0;
    const nowIso = new Date().toISOString();
    const dayKey = this.getDayKeyUtc(nowIso);
    const sentToday = await this.campaignsRepository.countSentMessagesForDay(workspaceId, dayKey);
    const remaining = Math.max(0, this.env.maxCampaignMessagesPerDay - sentToday);
    const withinQuota = optedInRecipients <= remaining;
    const exceedsNonOptInThreshold = nonOptedInPercentage > this.env.maxCampaignNonOptInPercent;

    const blockers: string[] = [];
    if (missingRecipients > 0) {
      blockers.push(`Hay ${missingRecipients} destinatario(s) invalidos o inexistentes.`);
    }
    if (optedInRecipients === 0) {
      blockers.push("No hay destinatarios con consentimiento opted_in.");
    }
    if (exceedsNonOptInThreshold) {
      blockers.push(
        `El ${nonOptedInPercentage}% del lote no tiene opt-in (max ${this.env.maxCampaignNonOptInPercent}%).`,
      );
    }
    if (!withinQuota) {
      blockers.push(
        `Cuota diaria insuficiente. Restantes: ${remaining}, requeridos con opt-in: ${optedInRecipients}.`,
      );
    }

    const riskReasons: string[] = [];
    if (nonOptedInPercentage > 0) {
      if (exceedsNonOptInThreshold) {
        riskReasons.push("Porcentaje de no consentidos por encima del umbral permitido.");
      } else {
        riskReasons.push("Existen destinatarios sin opt-in en el lote.");
      }
    }
    if (missingRecipients > 0) {
      riskReasons.push("Hay destinatarios inexistentes o eliminados en la seleccion.");
    }
    if (!withinQuota) {
      riskReasons.push("La cuota diaria de mensajes esta cerca o por encima del limite.");
    }
    if (optedInRecipients === 0) {
      riskReasons.push("No existen contactos con consentimiento valido para enviar.");
    }

    let riskScore = 0;
    if (exceedsNonOptInThreshold) {
      riskScore += 55;
    } else if (nonOptedInPercentage >= 10) {
      riskScore += 30;
    } else if (nonOptedInPercentage > 0) {
      riskScore += 15;
    }
    if (missingRecipients > 0) {
      riskScore += 20;
    }
    if (!withinQuota) {
      riskScore += 30;
    }
    if (optedInRecipients === 0) {
      riskScore += 40;
    }
    riskScore = Math.min(100, riskScore);

    const recommendations = blockers.length
      ? [
          "Filtra solo leads con consentimiento registrado.",
          "Corrige destinatarios invalidos antes de reenviar.",
          "Reduce el lote o espera la renovacion de cuota diaria.",
        ]
      : ["Lote listo para envio compliant."];

    return {
      campaignId: campaign.id,
      totalRecipients,
      optedInRecipients,
      missingRecipients,
      nonOptedInRecipients,
      nonOptedInPercentage,
      nonOptedInThresholdPercentage: this.env.maxCampaignNonOptInPercent,
      dailyQuota: {
        maxPerDay: this.env.maxCampaignMessagesPerDay,
        sentToday,
        remaining,
        attemptedOptedInRecipients: optedInRecipients,
        withinQuota,
      },
      risk: {
        score: riskScore,
        level: this.toRiskLevel(riskScore),
        reasons: riskReasons,
      },
      blockers,
      recommendations,
      canSend: blockers.length === 0,
      evaluatedAt: nowIso,
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

  private getDayKeyUtc(isoDate: string): string {
    return isoDate.slice(0, 10);
  }

  private interpolate(template: Template, leadName: string): string {
    return template.body.replaceAll("{{name}}", leadName);
  }

  private async safeAudit(
    workspaceId: string,
    actor: AuditActor | null,
    input: {
      scope: "campaign";
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
