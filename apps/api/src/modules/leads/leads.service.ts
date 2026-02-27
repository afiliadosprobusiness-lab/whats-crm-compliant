import { AppError } from "../../core/errors.js";
import { createId } from "../../core/id.js";
import type { LeadsRepository } from "./leads.repository.js";
import type { Lead } from "./leads.types.js";
import { addLeadNoteSchema, createLeadSchema, updateLeadStageSchema } from "./leads.types.js";

export class LeadsService {
  constructor(private readonly leadsRepository: LeadsRepository) {}

  public createLead(workspaceId: string, input: unknown): Lead {
    const payload = createLeadSchema.parse(input);
    const existing = this.leadsRepository.findByPhone(workspaceId, payload.phoneE164);
    if (existing) {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message: "Ya existe un lead con ese telefono",
      });
    }

    const now = new Date().toISOString();
    const lead: Lead = {
      id: createId("lead"),
      workspaceId,
      name: payload.name,
      phoneE164: payload.phoneE164,
      stage: payload.stage,
      consentStatus: payload.consentStatus,
      consentSource: payload.consentSource,
      tags: payload.tags,
      notes: [],
      createdAt: now,
      updatedAt: now,
    };

    return this.leadsRepository.create(lead);
  }

  public listLeads(workspaceId: string): Lead[] {
    return this.leadsRepository.list(workspaceId);
  }

  public updateLeadStage(workspaceId: string, leadId: string, input: unknown): Lead {
    const payload = updateLeadStageSchema.parse(input);
    const updated = this.leadsRepository.updateStage(workspaceId, leadId, payload.stage);
    if (!updated) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado",
      });
    }

    return updated;
  }

  public addLeadNote(workspaceId: string, leadId: string, input: unknown): Lead {
    const payload = addLeadNoteSchema.parse(input);
    const updated = this.leadsRepository.addNote(workspaceId, leadId, payload.note);
    if (!updated) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado",
      });
    }

    return updated;
  }
}
