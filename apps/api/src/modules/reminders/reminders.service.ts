import { AppError } from "../../core/errors.js";
import { createId } from "../../core/id.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AuditActor } from "../audit/audit.types.js";
import type { LeadsRepository } from "../leads/leads.repository.js";
import type { RemindersRepository } from "./reminders.repository.js";
import type { Reminder } from "./reminders.types.js";
import { createReminderSchema } from "./reminders.types.js";

export class RemindersService {
  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly leadsRepository: LeadsRepository,
    private readonly auditService: AuditService,
  ) {}

  public async createReminder(workspaceId: string, actor: AuditActor | null, input: unknown): Promise<Reminder> {
    const payload = createReminderSchema.parse(input);
    const lead = await this.leadsRepository.findById(workspaceId, payload.leadId);
    if (!lead) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado para recordatorio",
      });
    }

    const now = new Date().toISOString();
    const reminder = await this.remindersRepository.create({
      id: createId("rem"),
      workspaceId,
      leadId: payload.leadId,
      note: payload.note,
      dueAt: payload.dueAt,
      status: "pending",
      completedAt: null,
      completedByUserId: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.safeAudit(workspaceId, actor, {
      scope: "reminder",
      action: "created",
      entityType: "reminder",
      entityId: reminder.id,
      summary: `Recordatorio creado para lead ${lead.name}`,
      details: {
        leadId: reminder.leadId,
        dueAt: reminder.dueAt,
      },
    });

    return reminder;
  }

  public async listReminders(workspaceId: string): Promise<Reminder[]> {
    return this.remindersRepository.list(workspaceId);
  }

  public async completeReminder(
    workspaceId: string,
    actor: AuditActor | null,
    reminderId: string,
  ): Promise<Reminder> {
    const reminder = await this.remindersRepository.findById(workspaceId, reminderId);
    if (!reminder) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Recordatorio no encontrado",
      });
    }

    if (reminder.status === "done") {
      return reminder;
    }

    const now = new Date().toISOString();
    const completed = await this.remindersRepository.updateReminder(workspaceId, reminderId, {
      status: "done",
      completedAt: now,
      completedByUserId: actor?.userId ?? null,
    });

    if (!completed) {
      throw new AppError({
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "No se pudo completar recordatorio",
      });
    }

    await this.safeAudit(workspaceId, actor, {
      scope: "reminder",
      action: "completed",
      entityType: "reminder",
      entityId: completed.id,
      summary: "Recordatorio marcado como completado",
      details: {
        leadId: completed.leadId,
        dueAt: completed.dueAt,
        completedAt: completed.completedAt,
      },
    });

    return completed;
  }

  private async safeAudit(
    workspaceId: string,
    actor: AuditActor | null,
    input: {
      scope: "reminder";
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
