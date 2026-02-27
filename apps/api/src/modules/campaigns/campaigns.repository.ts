import type { Campaign } from "./campaigns.types.js";

export class CampaignsRepository {
  private readonly campaigns = new Map<string, Campaign>();

  public create(campaign: Campaign): Campaign {
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  public list(workspaceId: string): Campaign[] {
    return Array.from(this.campaigns.values())
      .filter((campaign) => campaign.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public findById(workspaceId: string, campaignId: string): Campaign | null {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign || campaign.workspaceId !== workspaceId) {
      return null;
    }

    return campaign;
  }

  public update(workspaceId: string, campaignId: string, patch: Partial<Campaign>): Campaign | null {
    const current = this.findById(workspaceId, campaignId);
    if (!current) {
      return null;
    }

    const updated: Campaign = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    this.campaigns.set(campaignId, updated);
    return updated;
  }
}
