import type { Reminder } from "./reminders.types.js";

export class RemindersRepository {
  private readonly reminders = new Map<string, Reminder>();

  public create(reminder: Reminder): Reminder {
    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  public list(workspaceId: string): Reminder[] {
    return Array.from(this.reminders.values())
      .filter((reminder) => reminder.workspaceId === workspaceId)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }
}
