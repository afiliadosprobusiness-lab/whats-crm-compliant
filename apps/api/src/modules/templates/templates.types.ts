import { z } from "zod";

export type Template = {
  id: string;
  workspaceId: string;
  name: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export const createTemplateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  body: z.string().trim().min(3).max(1024),
});
