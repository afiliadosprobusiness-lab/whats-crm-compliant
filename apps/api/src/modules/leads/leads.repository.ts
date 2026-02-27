import type { Lead, LeadStage } from "./leads.types.js";

export class LeadsRepository {
  private readonly leads = new Map<string, Lead>();

  public create(lead: Lead): Lead {
    this.leads.set(lead.id, lead);
    return lead;
  }

  public list(workspaceId: string): Lead[] {
    return Array.from(this.leads.values())
      .filter((lead) => lead.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public findById(workspaceId: string, leadId: string): Lead | null {
    const lead = this.leads.get(leadId);
    if (!lead || lead.workspaceId !== workspaceId) {
      return null;
    }

    return lead;
  }

  public findByPhone(workspaceId: string, phoneE164: string): Lead | null {
    return (
      Array.from(this.leads.values()).find(
        (lead) => lead.workspaceId === workspaceId && lead.phoneE164 === phoneE164,
      ) ?? null
    );
  }

  public updateStage(workspaceId: string, leadId: string, stage: LeadStage): Lead | null {
    const lead = this.findById(workspaceId, leadId);
    if (!lead) {
      return null;
    }

    const updated: Lead = {
      ...lead,
      stage,
      updatedAt: new Date().toISOString(),
    };

    this.leads.set(leadId, updated);
    return updated;
  }

  public addNote(workspaceId: string, leadId: string, note: string): Lead | null {
    const lead = this.findById(workspaceId, leadId);
    if (!lead) {
      return null;
    }

    const updated: Lead = {
      ...lead,
      notes: [...lead.notes, note],
      updatedAt: new Date().toISOString(),
    };

    this.leads.set(leadId, updated);
    return updated;
  }

  public findManyByIds(workspaceId: string, leadIds: string[]): Lead[] {
    return leadIds
      .map((leadId) => this.findById(workspaceId, leadId))
      .filter((lead): lead is Lead => lead !== null);
  }
}
