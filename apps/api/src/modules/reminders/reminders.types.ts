import { z } from "zod";

export type Reminder = {
  id: string;
  workspaceId: string;
  leadId: string;
  note: string;
  dueAt: string;
  status: "pending" | "done";
  createdAt: string;
  updatedAt: string;
};

export const createReminderSchema = z.object({
  leadId: z.string().trim().min(1),
  note: z.string().trim().min(2).max(200),
  dueAt: z.string().datetime(),
});
