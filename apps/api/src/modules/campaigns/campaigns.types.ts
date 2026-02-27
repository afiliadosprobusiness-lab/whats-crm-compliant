import { z } from "zod";
import type { SendMessageResult } from "../whatsapp/whatsapp.service.js";

export type CampaignStatus = "draft" | "sending" | "sent" | "sent_with_errors";

export type Campaign = {
  id: string;
  workspaceId: string;
  name: string;
  templateId: string;
  recipientLeadIds: string[];
  status: CampaignStatus;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
};

export type CampaignSendResult = {
  leadId: string;
  phoneE164: string;
  status: SendMessageResult["status"];
  provider: SendMessageResult["provider"];
  messageId: string | null;
  error: string | null;
};

export type OutboundMessageLog = {
  id: string;
  workspaceId: string;
  workspaceDayKey: string;
  campaignId: string;
  leadId: string;
  phoneE164: string;
  status: SendMessageResult["status"];
  provider: SendMessageResult["provider"];
  messageId: string | null;
  error: string | null;
  sentAt: string;
};

export const createCampaignSchema = z.object({
  name: z.string().trim().min(2).max(120),
  templateId: z.string().trim().min(1),
  recipientLeadIds: z.array(z.string().trim().min(1)).min(1).max(1000),
});
