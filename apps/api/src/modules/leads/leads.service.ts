import { AppError } from "../../core/errors.js";
import { createId } from "../../core/id.js";
import type { AuthRepository } from "../auth/auth.repository.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AuditActor } from "../audit/audit.types.js";
import type { LeadsRepository } from "./leads.repository.js";
import type {
  ConsentStatus,
  Lead,
  LeadHealthEvent,
  LeadHealthEventType,
  LeadHealthTemperature,
  LeadInboxCounts,
  LeadInboxResult,
  LeadInboxView,
  LeadStage,
} from "./leads.types.js";
import {
  addLeadNoteSchema,
  assignLeadOwnerSchema,
  createLeadSchema,
  leadInboxQuerySchema,
  registerLeadHealthEventSchema,
  updateLeadSchema,
  updateLeadStageSchema,
} from "./leads.types.js";

const FIRST_RESPONSE_SLA_MINUTES = 30;
const FOLLOWUP_SLA_HOURS = 72;
const DEFAULT_HEALTH_SCORE = 50;

const HEALTH_EVENT_SCORE_DELTAS: Record<LeadHealthEventType, number> = {
  responded: 20,
  appointment_set: 25,
  manual_followup: 10,
  no_response_72h: -20,
  spam_reported: -40,
  won: 30,
  lost: -25,
};

const HEALTH_EVENT_DEFAULT_NOTES: Record<LeadHealthEventType, string> = {
  responded: "Evento salud: el lead respondio.",
  appointment_set: "Evento salud: cita agendada.",
  manual_followup: "Evento salud: seguimiento manual realizado.",
  no_response_72h: "Evento salud: sin respuesta en 72h.",
  spam_reported: "Evento salud: lead reporta spam/no interesado.",
  won: "Evento salud: lead marcado como ganado.",
  lost: "Evento salud: lead marcado como perdido.",
};

export class LeadsService {
  constructor(
    private readonly leadsRepository: LeadsRepository,
    private readonly auditService: AuditService,
    private readonly authRepository: AuthRepository,
  ) {}

  public async createLead(workspaceId: string, actor: AuditActor | null, input: unknown): Promise<Lead> {
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
    const consentSnapshot = this.resolveConsentSnapshot(payload.consentStatus, payload.consentSource, null, now);
    const ownerUserId = await this.resolveOwnerUserId(workspaceId, payload.ownerUserId);

    const lead: Lead = {
      id: createId("lead"),
      workspaceId,
      name: payload.name,
      phoneE164: payload.phoneE164,
      stage: payload.stage,
      consentStatus: payload.consentStatus,
      consentSource: payload.consentSource,
      opted_in: consentSnapshot.opted_in,
      opted_in_at: consentSnapshot.opted_in_at,
      opted_in_source: consentSnapshot.opted_in_source,
      ownerUserId,
      assignedAt: ownerUserId ? now : null,
      firstResponseAt: payload.stage === "new" ? null : now,
      lastFollowupAt: null,
      healthScore: DEFAULT_HEALTH_SCORE,
      healthTemperature: this.getHealthTemperature(DEFAULT_HEALTH_SCORE),
      healthUpdatedAt: now,
      latestHealthEvent: null,
      tags: payload.tags,
      notes: [],
      createdAt: now,
      updatedAt: now,
    };

    const created = this.decorateLeadWithSla(await this.leadsRepository.create(lead));
    await this.safeAudit(workspaceId, actor, {
      scope: "lead",
      action: "created",
      entityType: "lead",
      entityId: created.id,
      summary: `Lead creado: ${created.name}`,
      details: {
        phoneE164: created.phoneE164,
        consentStatus: created.consentStatus,
        opted_in: created.opted_in ?? false,
        ownerUserId: created.ownerUserId ?? null,
      },
    });
    return created;
  }

  public async listLeads(
    workspaceId: string,
    input?: { actorUserId?: string; view?: string | undefined },
  ): Promise<Lead[]> {
    const leads = await this.listLeadsWithComputedFields(workspaceId);
    const actorUserId = input?.actorUserId ?? "";
    const view = leadInboxQuerySchema.parse({ view: input?.view }).view;
    return this.filterByInboxView(leads, view, actorUserId);
  }

  public async listLeadInbox(
    workspaceId: string,
    actorUserId: string,
    viewInput: string | undefined,
  ): Promise<LeadInboxResult> {
    const leads = await this.listLeadsWithComputedFields(workspaceId);
    const view = leadInboxQuerySchema.parse({ view: viewInput }).view;
    const counts = this.computeInboxCounts(leads, actorUserId);
    const filtered = this.filterByInboxView(leads, view, actorUserId);
    return {
      view,
      counts,
      leads: filtered,
    };
  }

  public async upsertLeadByPhone(workspaceId: string, actor: AuditActor | null, input: unknown): Promise<Lead> {
    const payload = createLeadSchema.parse(input);
    const existing = await this.leadsRepository.findByPhone(workspaceId, payload.phoneE164);
    if (!existing) {
      return this.createLead(workspaceId, actor, payload);
    }

    const now = new Date().toISOString();
    const consentSnapshot = this.resolveConsentSnapshot(payload.consentStatus, payload.consentSource, existing, now);
    const ownerUserId =
      payload.ownerUserId === undefined
        ? existing.ownerUserId ?? null
        : await this.resolveOwnerUserId(workspaceId, payload.ownerUserId);
    const lifecyclePatch = this.resolveLifecyclePatch(existing, payload.stage, now);
    const updated = await this.leadsRepository.updateLead(workspaceId, existing.id, {
      name: payload.name,
      stage: payload.stage,
      consentStatus: payload.consentStatus,
      consentSource: payload.consentSource,
      opted_in: consentSnapshot.opted_in,
      opted_in_at: consentSnapshot.opted_in_at,
      opted_in_source: consentSnapshot.opted_in_source,
      ownerUserId,
      assignedAt: ownerUserId ? existing.assignedAt ?? now : null,
      ...lifecyclePatch,
      tags: this.normalizeTags(payload.tags),
    });

    if (!updated) {
      throw new AppError({
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "No se pudo actualizar lead existente",
      });
    }

    const computed = this.decorateLeadWithSla(updated);
    await this.safeAudit(workspaceId, actor, {
      scope: "lead",
      action: "upsert_updated",
      entityType: "lead",
      entityId: computed.id,
      summary: `Lead actualizado por upsert: ${computed.name}`,
      details: {
        phoneE164: computed.phoneE164,
        consentStatus: computed.consentStatus,
        opted_in: computed.opted_in ?? false,
        ownerUserId: computed.ownerUserId ?? null,
      },
    });
    return computed;
  }

  public async updateLead(
    workspaceId: string,
    actor: AuditActor | null,
    leadId: string,
    input: unknown,
  ): Promise<Lead> {
    const payload = updateLeadSchema.parse(input);
    const existing = await this.leadsRepository.findById(workspaceId, leadId);
    if (!existing) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado",
      });
    }

    const now = new Date().toISOString();
    const nextConsentStatus = payload.consentStatus ?? existing.consentStatus;
    const nextConsentSource = payload.consentSource ?? existing.consentSource;
    const shouldRefreshConsentSnapshot =
      Boolean(payload.consentStatus || payload.consentSource) || typeof existing.opted_in !== "boolean";
    const consentPatch = shouldRefreshConsentSnapshot
      ? this.resolveConsentSnapshot(nextConsentStatus, nextConsentSource, existing, now)
      : null;

    const nextStage = payload.stage ?? existing.stage;
    const lifecyclePatch = this.resolveLifecyclePatch(existing, nextStage, now);
    const ownerUserId =
      payload.ownerUserId === undefined
        ? undefined
        : await this.resolveOwnerUserId(workspaceId, payload.ownerUserId);
    const assignedAtPatch =
      payload.ownerUserId === undefined ? undefined : ownerUserId ? existing.assignedAt ?? now : null;

    const updated = await this.leadsRepository.updateLead(workspaceId, leadId, {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.stage ? { stage: payload.stage } : {}),
      ...(payload.consentStatus || payload.consentSource
        ? {
            consentStatus: nextConsentStatus,
            consentSource: nextConsentSource,
          }
        : {}),
      ...(consentPatch
        ? {
            opted_in: consentPatch.opted_in,
            opted_in_at: consentPatch.opted_in_at,
            opted_in_source: consentPatch.opted_in_source,
          }
        : {}),
      ...(ownerUserId !== undefined ? { ownerUserId } : {}),
      ...(assignedAtPatch !== undefined ? { assignedAt: assignedAtPatch } : {}),
      ...(payload.tags ? { tags: this.normalizeTags(payload.tags) } : {}),
      ...lifecyclePatch,
    });

    if (!updated) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado",
      });
    }

    const computed = this.decorateLeadWithSla(updated);
    await this.safeAudit(workspaceId, actor, {
      scope: "lead",
      action: "patched",
      entityType: "lead",
      entityId: computed.id,
      summary: `Lead actualizado: ${computed.name}`,
      details: {
        changedFields: Object.keys(payload),
        consentStatus: computed.consentStatus,
        opted_in: computed.opted_in ?? false,
        ownerUserId: computed.ownerUserId ?? null,
      },
    });
    return computed;
  }

  public async updateLeadStage(
    workspaceId: string,
    actor: AuditActor | null,
    leadId: string,
    input: unknown,
  ): Promise<Lead> {
    const payload = updateLeadStageSchema.parse(input);
    const existing = await this.leadsRepository.findById(workspaceId, leadId);
    if (!existing) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado",
      });
    }

    const lifecyclePatch = this.resolveLifecyclePatch(existing, payload.stage, new Date().toISOString());
    const updated = await this.leadsRepository.updateLead(workspaceId, leadId, {
      stage: payload.stage,
      ...lifecyclePatch,
    });
    if (!updated) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado",
      });
    }

    const computed = this.decorateLeadWithSla(updated);
    await this.safeAudit(workspaceId, actor, {
      scope: "lead",
      action: "stage_updated",
      entityType: "lead",
      entityId: computed.id,
      summary: `Lead movido a etapa ${computed.stage}`,
      details: {
        stage: computed.stage,
      },
    });
    return computed;
  }

  public async addLeadNote(
    workspaceId: string,
    actor: AuditActor | null,
    leadId: string,
    input: unknown,
  ): Promise<Lead> {
    const payload = addLeadNoteSchema.parse(input);
    const updated = await this.leadsRepository.addNote(workspaceId, leadId, payload.note);
    if (!updated) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado",
      });
    }

    const computed = this.decorateLeadWithSla(updated);
    await this.safeAudit(workspaceId, actor, {
      scope: "lead",
      action: "note_added",
      entityType: "lead",
      entityId: computed.id,
      summary: `Nota agregada al lead ${computed.name}`,
      details: {
        notePreview: payload.note.slice(0, 120),
      },
    });
    return computed;
  }

  public async assignLeadOwner(
    workspaceId: string,
    actor: AuditActor,
    leadId: string,
    input: unknown,
  ): Promise<Lead> {
    const payload = assignLeadOwnerSchema.parse(input);
    const existing = await this.leadsRepository.findById(workspaceId, leadId);
    if (!existing) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado",
      });
    }

    const ownerUserId = await this.resolveOwnerUserId(workspaceId, payload.ownerUserId);
    const now = new Date().toISOString();
    const updated = await this.leadsRepository.updateLead(workspaceId, leadId, {
      ownerUserId,
      assignedAt: ownerUserId ? now : null,
    });
    if (!updated) {
      throw new AppError({
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "No se pudo asignar lead",
      });
    }

    const computed = this.decorateLeadWithSla(updated);
    await this.safeAudit(workspaceId, actor, {
      scope: "lead",
      action: "assigned",
      entityType: "lead",
      entityId: computed.id,
      summary: ownerUserId
        ? `Lead asignado a usuario ${ownerUserId}`
        : "Lead marcado como sin asignar",
      details: {
        ownerUserId,
      },
    });
    return computed;
  }

  public async registerLeadHealthEvent(
    workspaceId: string,
    actor: AuditActor,
    leadId: string,
    input: unknown,
  ): Promise<Lead> {
    const payload = registerLeadHealthEventSchema.parse(input);
    const existing = await this.leadsRepository.findById(workspaceId, leadId);
    if (!existing) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado",
      });
    }

    const now = new Date().toISOString();
    const currentScore = Number.isFinite(Number(existing.healthScore)) ? Number(existing.healthScore) : DEFAULT_HEALTH_SCORE;
    const delta = HEALTH_EVENT_SCORE_DELTAS[payload.event];
    const nextScore = this.clampHealthScore(currentScore + delta);
    const nextTemperature = this.getHealthTemperature(nextScore);
    const stagePatch = this.resolveStagePatchFromHealthEvent(existing.stage, payload.event);
    const lifecyclePatch = this.resolveLifecyclePatch(existing, stagePatch.stage ?? existing.stage, now);

    const updated = await this.leadsRepository.updateLead(workspaceId, leadId, {
      ...stagePatch,
      ...lifecyclePatch,
      healthScore: nextScore,
      healthTemperature: nextTemperature,
      healthUpdatedAt: now,
      latestHealthEvent: payload.event,
      lastFollowupAt:
        payload.event === "manual_followup" || payload.event === "appointment_set" ? now : lifecyclePatch.lastFollowupAt,
      firstResponseAt:
        payload.event === "responded" && !existing.firstResponseAt
          ? now
          : lifecyclePatch.firstResponseAt,
    });
    if (!updated) {
      throw new AppError({
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "No se pudo registrar evento de salud",
      });
    }

    const note = payload.note?.trim() || HEALTH_EVENT_DEFAULT_NOTES[payload.event];
    const updatedWithNote = note ? await this.leadsRepository.addNote(workspaceId, leadId, note) : updated;
    const finalLead = this.decorateLeadWithSla(updatedWithNote ?? updated);

    const healthEvent: LeadHealthEvent = {
      id: createId("lhevt"),
      workspaceId,
      leadId,
      event: payload.event,
      scoreDelta: delta,
      note: note || null,
      actorUserId: actor.userId,
      actorUserRole: actor.role,
      createdAt: now,
    };
    await this.leadsRepository.createHealthEvent(healthEvent);

    await this.safeAudit(workspaceId, actor, {
      scope: "lead",
      action: "health_event_registered",
      entityType: "lead",
      entityId: leadId,
      summary: `Evento de salud registrado: ${payload.event}`,
      details: {
        scoreDelta: delta,
        healthScore: nextScore,
        healthTemperature: nextTemperature,
      },
    });
    return finalLead;
  }

  private async listLeadsWithComputedFields(workspaceId: string): Promise<Lead[]> {
    const raw = await this.leadsRepository.list(workspaceId);
    return raw.map((lead) => this.decorateLeadWithSla(lead));
  }

  private filterByInboxView(leads: Lead[], view: LeadInboxView, actorUserId: string): Lead[] {
    if (view === "all") {
      return leads;
    }
    if (view === "my") {
      return leads.filter((lead) => (lead.ownerUserId ?? null) === actorUserId);
    }
    if (view === "unassigned") {
      return leads.filter((lead) => !lead.ownerUserId);
    }
    return leads.filter((lead) => Boolean(lead.sla?.firstResponseBreached || lead.sla?.followupBreached));
  }

  private computeInboxCounts(leads: Lead[], actorUserId: string): LeadInboxCounts {
    return {
      all: leads.length,
      my: leads.filter((lead) => (lead.ownerUserId ?? null) === actorUserId).length,
      unassigned: leads.filter((lead) => !lead.ownerUserId).length,
      overdue: leads.filter((lead) => Boolean(lead.sla?.firstResponseBreached || lead.sla?.followupBreached)).length,
    };
  }

  private decorateLeadWithSla(lead: Lead): Lead {
    const normalized = this.withLeadDefaults(lead);
    return {
      ...normalized,
      sla: this.computeSlaSnapshot(normalized),
    };
  }

  private withLeadDefaults(lead: Lead): Lead {
    const healthScore =
      typeof lead.healthScore === "number" && Number.isFinite(lead.healthScore)
        ? this.clampHealthScore(lead.healthScore)
        : DEFAULT_HEALTH_SCORE;
    return {
      ...lead,
      ownerUserId: lead.ownerUserId ?? null,
      assignedAt: lead.assignedAt ?? null,
      firstResponseAt: lead.firstResponseAt ?? null,
      lastFollowupAt: lead.lastFollowupAt ?? null,
      healthScore,
      healthTemperature: lead.healthTemperature ?? this.getHealthTemperature(healthScore),
      healthUpdatedAt: lead.healthUpdatedAt ?? lead.updatedAt,
      latestHealthEvent: lead.latestHealthEvent ?? null,
    };
  }

  private computeSlaSnapshot(lead: Lead): Lead["sla"] {
    const createdAtMs = this.safeDateMs(lead.createdAt) ?? Date.now();
    const firstResponseDueAtMs = createdAtMs + FIRST_RESPONSE_SLA_MINUTES * 60 * 1000;
    const firstResponseBreached =
      lead.stage === "new" &&
      !lead.firstResponseAt &&
      Date.now() > firstResponseDueAtMs;

    const followupAnchorMs =
      this.safeDateMs(lead.lastFollowupAt) ??
      this.safeDateMs(lead.firstResponseAt) ??
      createdAtMs;
    const followupDueAtMs = followupAnchorMs + FOLLOWUP_SLA_HOURS * 60 * 60 * 1000;
    const followupBreached =
      (lead.stage === "contacted" || lead.stage === "qualified") &&
      Date.now() > followupDueAtMs;

    return {
      firstResponseDueAt: new Date(firstResponseDueAtMs).toISOString(),
      firstResponseBreached,
      followupDueAt: new Date(followupDueAtMs).toISOString(),
      followupBreached,
    };
  }

  private resolveLifecyclePatch(
    existing: Lead,
    nextStage: LeadStage,
    nowIso: string,
  ): Pick<Lead, "firstResponseAt" | "lastFollowupAt"> {
    const firstResponseAt = existing.firstResponseAt ?? null;
    const lastFollowupAt = existing.lastFollowupAt ?? null;

    if (nextStage !== "new" && !firstResponseAt) {
      return {
        firstResponseAt: nowIso,
        lastFollowupAt,
      };
    }

    return {
      firstResponseAt,
      lastFollowupAt,
    };
  }

  private resolveStagePatchFromHealthEvent(
    currentStage: LeadStage,
    event: LeadHealthEventType,
  ): { stage?: LeadStage } {
    if (event === "won") {
      return { stage: "won" };
    }
    if (event === "lost") {
      return { stage: "lost" };
    }
    if (event === "responded" && currentStage === "new") {
      return { stage: "contacted" };
    }
    if (event === "appointment_set" && (currentStage === "new" || currentStage === "contacted")) {
      return { stage: "qualified" };
    }
    return {};
  }

  private async resolveOwnerUserId(
    workspaceId: string,
    ownerUserId: string | null | undefined,
  ): Promise<string | null> {
    if (ownerUserId === undefined || ownerUserId === null) {
      return null;
    }

    const normalized = ownerUserId.trim();
    if (!normalized) {
      return null;
    }

    const user = await this.authRepository.findUserById(normalized);
    if (!user || user.workspaceId !== workspaceId) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "ownerUserId no pertenece al workspace",
      });
    }

    return user.id;
  }

  private resolveConsentSnapshot(
    consentStatus: ConsentStatus,
    consentSource: string,
    existing: Lead | null,
    nowIso: string,
  ): { opted_in: boolean; opted_in_at: string | null; opted_in_source: string | null } {
    if (consentStatus !== "opted_in") {
      return {
        opted_in: false,
        opted_in_at: null,
        opted_in_source: null,
      };
    }

    return {
      opted_in: true,
      opted_in_at:
        existing?.opted_in && existing.opted_in_at && existing.opted_in_at.trim()
          ? existing.opted_in_at
          : nowIso,
      opted_in_source: consentSource,
    };
  }

  private normalizeTags(tags: string[]): string[] {
    const unique = Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)));
    return unique.slice(0, 8);
  }

  private clampHealthScore(score: number): number {
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private getHealthTemperature(score: number): LeadHealthTemperature {
    if (score >= 70) {
      return "hot";
    }
    if (score >= 40) {
      return "warm";
    }
    return "cold";
  }

  private safeDateMs(input: string | null | undefined): number | null {
    if (!input) {
      return null;
    }
    const ms = new Date(input).getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  private async safeAudit(
    workspaceId: string,
    actor: AuditActor | null,
    input: {
      scope: "lead";
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
