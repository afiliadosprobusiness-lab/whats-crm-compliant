import { getFirebaseDb } from "../../infrastructure/firebase-admin.js";
import type { Campaign } from "./campaigns.types.js";

const COLLECTION = "campaigns";

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
}

