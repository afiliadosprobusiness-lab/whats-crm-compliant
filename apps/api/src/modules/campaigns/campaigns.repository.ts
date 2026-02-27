import { getFirebaseDb } from "../../infrastructure/firebase-admin.js";
import type { Campaign, OutboundMessageLog } from "./campaigns.types.js";

const COLLECTION = "campaigns";
const OUTBOUND_COLLECTION = "outbound_messages";

export class CampaignsRepository {
  private readonly db = getFirebaseDb();

  public async create(campaign: Campaign): Promise<Campaign> {
    await this.db.collection(COLLECTION).doc(campaign.id).set(campaign);
    return campaign;
  }

  public async list(workspaceId: string): Promise<Campaign[]> {
    const querySnap = await this.db.collection(COLLECTION).where("workspaceId", "==", workspaceId).get();
    return querySnap.docs
      .map((doc) => doc.data() as Campaign)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public async findById(workspaceId: string, campaignId: string): Promise<Campaign | null> {
    const snap = await this.db.collection(COLLECTION).doc(campaignId).get();
    if (!snap.exists) {
      return null;
    }

    const campaign = snap.data() as Campaign;
    return campaign.workspaceId === workspaceId ? campaign : null;
  }

  public async update(workspaceId: string, campaignId: string, patch: Partial<Campaign>): Promise<Campaign | null> {
    const current = await this.findById(workspaceId, campaignId);
    if (!current) {
      return null;
    }

    const updated: Campaign = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await this.db.collection(COLLECTION).doc(campaignId).set(updated);
    return updated;
  }

  public async createOutboundLog(log: OutboundMessageLog): Promise<void> {
    await this.db.collection(OUTBOUND_COLLECTION).doc(log.id).set(log);
  }

  public async countSentMessagesForDay(workspaceId: string, dayKey: string): Promise<number> {
    const workspaceDayKey = `${workspaceId}_${dayKey}`;
    const querySnap = await this.db
      .collection(OUTBOUND_COLLECTION)
      .where("workspaceDayKey", "==", workspaceDayKey)
      .get();

    return querySnap.docs.reduce((acc, doc) => {
      const log = doc.data() as OutboundMessageLog;
      return log.status === "sent" ? acc + 1 : acc;
    }, 0);
  }
}
