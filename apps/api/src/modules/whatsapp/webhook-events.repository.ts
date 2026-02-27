import { getFirebaseDb } from "../../infrastructure/firebase-admin.js";

export type WebhookEvent = {
  id: string;
  receivedAt: string;
  payload: unknown;
};

const COLLECTION = "whatsapp_webhook_events";

export class WebhookEventsRepository {
  private readonly db = getFirebaseDb();

  public async create(event: WebhookEvent): Promise<WebhookEvent> {
    await this.db.collection(COLLECTION).doc(event.id).set(event);
    return event;
  }

  public async listRecent(limitCount = 100): Promise<WebhookEvent[]> {
    const querySnap = await this.db.collection(COLLECTION).limit(limitCount).get();
    return querySnap.docs
      .map((doc) => doc.data() as WebhookEvent)
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
      .slice(0, limitCount);
  }
}

