import { z } from "zod";

export const leadStages = ["new", "contacted", "qualified", "won", "lost"] as const;
export const consentStatuses = ["opted_in", "opted_out", "pending"] as const;
export const leadHealthTemperatures = ["hot", "warm", "cold"] as const;
export const leadInboxViews = ["all", "my", "unassigned", "overdue"] as const;
export const leadHealthEventTypes = [
  "responded",
  "appointment_set",
  "manual_followup",
  "no_response_72h",
  "spam_reported",
  "won",
  "lost",
] as const;

export type LeadStage = (typeof leadStages)[number];
export type ConsentStatus = (typeof consentStatuses)[number];
export type LeadHealthTemperature = (typeof leadHealthTemperatures)[number];
export type LeadInboxView = (typeof leadInboxViews)[number];
export type LeadHealthEventType = (typeof leadHealthEventTypes)[number];

export type LeadSla = {
  firstResponseDueAt: string;
  firstResponseBreached: boolean;
  followupDueAt: string;
  followupBreached: boolean;
};

export type Lead = {
  id: string;
  workspaceId: string;
  name: string;
  phoneE164: string;
  stage: LeadStage;
  consentStatus: ConsentStatus;
  consentSource: string;
  opted_in?: boolean;
  opted_in_at?: string | null;
  opted_in_source?: string | null;
  ownerUserId?: string | null;
  assignedAt?: string | null;
  firstResponseAt?: string | null;
  lastFollowupAt?: string | null;
  healthScore?: number;
  healthTemperature?: LeadHealthTemperature;
  healthUpdatedAt?: string | null;
  latestHealthEvent?: LeadHealthEventType | null;
  sla?: LeadSla;
  tags: string[];
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

export type LeadHealthEvent = {
  id: string;
  workspaceId: string;
  leadId: string;
  event: LeadHealthEventType;
  scoreDelta: number;
  note: string | null;
  actorUserId: string | null;
  actorUserRole: string | null;
  createdAt: string;
};

export type LeadInboxCounts = {
  all: number;
  my: number;
  unassigned: number;
  overdue: number;
};

export type LeadInboxResult = {
  view: LeadInboxView;
  counts: LeadInboxCounts;
  leads: Lead[];
};

export const createLeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phoneE164: z.string().regex(/^\+[1-9]\d{7,14}$/, "Formato E.164 invalido"),
  consentStatus: z.enum(consentStatuses),
  consentSource: z.string().trim().min(2).max(80),
  ownerUserId: z.string().trim().min(1).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  stage: z.enum(leadStages).default("new"),
});

export const updateLeadStageSchema = z.object({
  stage: z.enum(leadStages),
});

export const addLeadNoteSchema = z.object({
  note: z.string().trim().min(1).max(500),
});

export const updateLeadSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    consentStatus: z.enum(consentStatuses).optional(),
    consentSource: z.string().trim().min(2).max(80).optional(),
    ownerUserId: z.string().trim().min(1).optional().nullable(),
    tags: z.array(z.string().trim().min(1).max(30)).max(8).optional(),
    stage: z.enum(leadStages).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

export const assignLeadOwnerSchema = z.object({
  ownerUserId: z.string().trim().min(1).nullable(),
});

export const registerLeadHealthEventSchema = z.object({
  event: z.enum(leadHealthEventTypes),
  note: z.string().trim().min(2).max(200).optional(),
});

export const leadInboxQuerySchema = z.object({
  view: z.enum(leadInboxViews).default("all"),
});

export const isLeadOptedIn = (lead: Pick<Lead, "consentStatus" | "opted_in">): boolean => {
  if (typeof lead.opted_in === "boolean") {
    return lead.opted_in;
  }

  return lead.consentStatus === "opted_in";
};
