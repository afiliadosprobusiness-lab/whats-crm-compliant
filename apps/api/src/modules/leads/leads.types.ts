import { z } from "zod";

export const leadStages = ["new", "contacted", "qualified", "won", "lost"] as const;
export const consentStatuses = ["opted_in", "opted_out", "pending"] as const;

export type LeadStage = (typeof leadStages)[number];
export type ConsentStatus = (typeof consentStatuses)[number];

export type Lead = {
  id: string;
  workspaceId: string;
  name: string;
  phoneE164: string;
  stage: LeadStage;
  consentStatus: ConsentStatus;
  consentSource: string;
  tags: string[];
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

export const createLeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phoneE164: z.string().regex(/^\+[1-9]\d{7,14}$/, "Formato E.164 invalido"),
  consentStatus: z.enum(consentStatuses),
  consentSource: z.string().trim().min(2).max(80),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  stage: z.enum(leadStages).default("new"),
});

export const updateLeadStageSchema = z.object({
  stage: z.enum(leadStages),
});

export const addLeadNoteSchema = z.object({
  note: z.string().trim().min(1).max(500),
});
