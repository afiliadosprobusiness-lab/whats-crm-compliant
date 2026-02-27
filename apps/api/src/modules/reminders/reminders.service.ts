import { AppError } from "../../core/errors.js";
import { createId } from "../../core/id.js";
import type { LeadsRepository } from "../leads/leads.repository.js";
import type { RemindersRepository } from "./reminders.repository.js";
import type { Reminder } from "./reminders.types.js";
import { createReminderSchema } from "./reminders.types.js";

export class RemindersService {
  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly leadsRepository: LeadsRepository,
  ) {}

  public createReminder(workspaceId: string, input: unknown): Reminder {
    const payload = createReminderSchema.parse(input);
    const lead = this.leadsRepository.findById(workspaceId, payload.leadId);
    if (!lead) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Lead no encontrado para recordatorio",
      });
    }

    const now = new Date().toISOString();
    return this.remindersRepository.create({
      id: createId("rem"),
      workspaceId,
      leadId: payload.leadId,
      note: payload.note,
      dueAt: payload.dueAt,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  }

  public listReminders(workspaceId: string): Reminder[] {
    return this.remindersRepository.list(workspaceId);
  }
}
