import { AppError } from "../../core/errors.js";
import { createId } from "../../core/id.js";
import type { LeadsRepository } from "./leads.repository.js";
import type { Lead } from "./leads.types.js";
import { addLeadNoteSchema, createLeadSchema, updateLeadSchema, updateLeadStageSchema } from "./leads.types.js";

export class LeadsService {
  constructor(private readonly leadsRepository: LeadsRepository) {}

  public async createLead(workspaceId: string, input: unknown): Promise<Lead> {
    const payload = createLeadSchema.parse(input);
    const existing = await this.leadsRepository.findByPhone(workspaceId, payload.phoneE164);
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

  public async listLeads(workspaceId: string): Promise<Lead[]> {
    return this.leadsRepository.list(workspaceId);
  }

  public async upsertLeadByPhone(workspaceId: string, input: unknown): Promise<Lead> {
    const payload = createLeadSchema.parse(input);
    const existing = await this.leadsRepository.findByPhone(workspaceId, payload.phoneE164);
    if (!existing) {
      return this.createLead(workspaceId, payload);
    }

    const updated = await this.leadsRepository.updateLead(workspaceId, existing.id, {
      name: payload.name,
      stage: payload.stage,
      consentStatus: payload.consentStatus,
      consentSource: payload.consentSource,
      tags: this.normalizeTags(payload.tags),
    });

    if (!updated) {
      throw new AppError({
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "No se pudo actualizar lead existente",
      });
    }

    return updated;
  }

  public async updateLead(workspaceId: string, leadId: string, input: unknown): Promise<Lead> {
    const payload = updateLeadSchema.parse(input);
    const updated = await this.leadsRepository.updateLead(workspaceId, leadId, {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.stage ? { stage: payload.stage } : {}),
      ...(payload.consentStatus ? { consentStatus: payload.consentStatus } : {}),
      ...(payload.consentSource ? { consentSource: payload.consentSource } : {}),
      ...(payload.tags ? { tags: this.normalizeTags(payload.tags) } : {}),
    });

    if (!updated) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado",
      });
    }

    return updated;
  }

  public async updateLeadStage(workspaceId: string, leadId: string, input: unknown): Promise<Lead> {
    const payload = updateLeadStageSchema.parse(input);
    const updated = await this.leadsRepository.updateStage(workspaceId, leadId, payload.stage);
    if (!updated) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado",
      });
    }

    return updated;
  }

  public async addLeadNote(workspaceId: string, leadId: string, input: unknown): Promise<Lead> {
    const payload = addLeadNoteSchema.parse(input);
    const updated = await this.leadsRepository.addNote(workspaceId, leadId, payload.note);
    if (!updated) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado",
      });
    }

    return updated;
  }

  private normalizeTags(tags: string[]): string[] {
    const unique = Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)));
    return unique.slice(0, 8);
  }
}
