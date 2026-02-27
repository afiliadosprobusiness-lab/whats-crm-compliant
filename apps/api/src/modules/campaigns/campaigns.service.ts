import type { EnvConfig } from "../../config/env.js";
import { AppError } from "../../core/errors.js";
import { createId } from "../../core/id.js";
import { sleep } from "../../core/sleep.js";
import type { LeadsRepository } from "../leads/leads.repository.js";
import type { Template } from "../templates/templates.types.js";
import type { TemplatesRepository } from "../templates/templates.repository.js";
import type { WhatsAppService } from "../whatsapp/whatsapp.service.js";
import type { Campaign, CampaignSendResult } from "./campaigns.types.js";
import { createCampaignSchema } from "./campaigns.types.js";
import type { CampaignsRepository } from "./campaigns.repository.js";

export class CampaignsService {
  constructor(
    private readonly campaignsRepository: CampaignsRepository,
    private readonly leadsRepository: LeadsRepository,
    private readonly templatesRepository: TemplatesRepository,
    private readonly whatsappService: WhatsAppService,
    private readonly env: EnvConfig,
  ) {}

  public async createCampaign(workspaceId: string, input: unknown): Promise<Campaign> {
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
    return this.campaignsRepository.create({
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
  }

  public async listCampaigns(workspaceId: string): Promise<Campaign[]> {
    return this.campaignsRepository.list(workspaceId);
  }

  public async sendCampaign(
    workspaceId: string,
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
    const optedInRecipientCount = campaign.recipientLeadIds.reduce((acc, leadId) => {
      const lead = leadId ? leadById.get(leadId) : null;
      return lead && lead.consentStatus === "opted_in" ? acc + 1 : acc;
    }, 0);

    const nowIso = new Date().toISOString();
    const dayKey = this.getDayKeyUtc(nowIso);
    const sentToday = await this.campaignsRepository.countSentMessagesForDay(workspaceId, dayKey);
    const remainingDailyQuota = Math.max(0, this.env.maxCampaignMessagesPerDay - sentToday);
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
      } else if (lead.consentStatus !== "opted_in") {
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

    return { campaign: updated, results };
  }

  private getDayKeyUtc(isoDate: string): string {
    return isoDate.slice(0, 10);
  }

  private interpolate(template: Template, leadName: string): string {
    return template.body.replaceAll("{{name}}", leadName);
  }
}
