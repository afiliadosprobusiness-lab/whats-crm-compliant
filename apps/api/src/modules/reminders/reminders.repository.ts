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
}

