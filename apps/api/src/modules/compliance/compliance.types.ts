import { z } from "zod";
import type { AuditLog } from "../audit/audit.types.js";

export const manualAssistActions = [
  "copilot_reply",
  "copilot_summary",
  "copilot_next",
  "copilot_insert",
  "copilot_handoff",
] as const;

export type ManualAssistAction = (typeof manualAssistActions)[number];

export type ManualAssistUsageRecord = {
  id: string;
  workspaceId: string;
  userId: string;
  action: ManualAssistAction;
  minuteBucket: string;
  workspaceUserMinuteKey: string;
  context: string | null;
  createdAt: string;
};

export const manualAssistSchema = z.object({
  action: z.enum(manualAssistActions),
  context: z.string().trim().min(2).max(80).optional(),
});

export type ComplianceTrustCenter = {
  compliantMode: "on";
  optInCoverage: {
    totalLeads: number;
    optedInLeads: number;
    percentage: number;
  };
  campaignDailyQuota: {
    maxPerDay: number;
    sentToday: number;
    remaining: number;
    usagePercentage: number;
  };
  antiSpamRisk: {
    score: number;
    level: "low" | "medium" | "high";
    reasons: string[];
  };
  recentAuditLogs: AuditLog[];
  evaluatedAt: string;
};

export type ManualAssistUsageResponse = {
  action: ManualAssistAction;
  limitPerMinute: number;
  usedInCurrentMinute: number;
  remainingInCurrentMinute: number;
  minuteBucket: string;
  resetAt: string;
};

export type ComplianceMessagingMode = {
  configuredMode: "crm_manual" | "cloud_api";
  resolvedMode: "crm_manual" | "cloud_api";
  provider: "dry_run" | "whatsapp_cloud_api";
  dryRun: boolean;
  cloudApiCredentials: {
    accessTokenPresent: boolean;
    phoneNumberIdPresent: boolean;
    valid: boolean;
  };
  reason: string;
  evaluatedAt: string;
};
