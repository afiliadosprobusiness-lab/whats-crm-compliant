import { getFirebaseDb } from "../../infrastructure/firebase-admin.js";
import type { Reminder } from "./reminders.types.js";

const COLLECTION = "reminders";

export class RemindersRepository {
  private readonly db = getFirebaseDb();

  public async create(reminder: Reminder): Promise<Reminder> {
    await this.db.collection(COLLECTION).doc(reminder.id).set(reminder);
    return reminder;
  }

  public async list(workspaceId: string): Promise<Reminder[]> {
    const querySnap = await this.db.collection(COLLECTION).where("workspaceId", "==", workspaceId).get();
    return querySnap.docs
      .map((doc) => doc.data() as Reminder)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }

  public async findById(workspaceId: string, reminderId: string): Promise<Reminder | null> {
    const snap = await this.db.collection(COLLECTION).doc(reminderId).get();
    if (!snap.exists) {
      return null;
    }

    const reminder = snap.data() as Reminder;
    return reminder.workspaceId === workspaceId ? reminder : null;
  }

  public async updateReminder(
    workspaceId: string,
    reminderId: string,
    patch: Partial<Reminder>,
  ): Promise<Reminder | null> {
    const reminder = await this.findById(workspaceId, reminderId);
    if (!reminder) {
      return null;
    }

    const updated: Reminder = {
      ...reminder,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await this.db.collection(COLLECTION).doc(reminderId).set(updated);
    return updated;
  }
}
