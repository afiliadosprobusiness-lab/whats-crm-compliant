import { getFirebaseDb } from "../../infrastructure/firebase-admin.js";
import type { Lead, LeadHealthEvent, LeadStage } from "./leads.types.js";

const COLLECTION = "leads";
const HEALTH_EVENTS_COLLECTION = "lead_health_events";

export class LeadsRepository {
  private readonly db = getFirebaseDb();

  public async create(lead: Lead): Promise<Lead> {
    await this.db.collection(COLLECTION).doc(lead.id).set(lead);
    return lead;
  }

  public async list(workspaceId: string): Promise<Lead[]> {
    const querySnap = await this.db.collection(COLLECTION).where("workspaceId", "==", workspaceId).get();
    return querySnap.docs
      .map((doc) => doc.data() as Lead)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public async findById(workspaceId: string, leadId: string): Promise<Lead | null> {
    const snap = await this.db.collection(COLLECTION).doc(leadId).get();
    if (!snap.exists) {
      return null;
    }

    const lead = snap.data() as Lead;
    return lead.workspaceId === workspaceId ? lead : null;
  }

  public async findByPhone(workspaceId: string, phoneE164: string): Promise<Lead | null> {
    const querySnap = await this.db
      .collection(COLLECTION)
      .where("workspaceId", "==", workspaceId)
      .where("phoneE164", "==", phoneE164)
      .limit(1)
      .get();

    if (querySnap.empty) {
      return null;
    }

    return querySnap.docs[0]!.data() as Lead;
  }

  public async updateStage(workspaceId: string, leadId: string, stage: LeadStage): Promise<Lead | null> {
    const lead = await this.findById(workspaceId, leadId);
    if (!lead) {
      return null;
    }

    const updated: Lead = {
      ...lead,
      stage,
      updatedAt: new Date().toISOString(),
    };

    await this.db.collection(COLLECTION).doc(leadId).set(updated);
    return updated;
  }

  public async updateLead(workspaceId: string, leadId: string, patch: Partial<Lead>): Promise<Lead | null> {
    const lead = await this.findById(workspaceId, leadId);
    if (!lead) {
      return null;
    }

    const updated: Lead = {
      ...lead,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await this.db.collection(COLLECTION).doc(leadId).set(updated);
    return updated;
  }

  public async addNote(workspaceId: string, leadId: string, note: string): Promise<Lead | null> {
    const lead = await this.findById(workspaceId, leadId);
    if (!lead) {
      return null;
    }

    const updated: Lead = {
      ...lead,
      notes: [...lead.notes, note],
      updatedAt: new Date().toISOString(),
    };

    await this.db.collection(COLLECTION).doc(leadId).set(updated);
    return updated;
  }

  public async findManyByIds(workspaceId: string, leadIds: string[]): Promise<Lead[]> {
    const leads = await Promise.all(leadIds.map((leadId) => this.findById(workspaceId, leadId)));
    return leads.filter((lead): lead is Lead => lead !== null);
  }

  public async createHealthEvent(event: LeadHealthEvent): Promise<LeadHealthEvent> {
    await this.db.collection(HEALTH_EVENTS_COLLECTION).doc(event.id).set(event);
    return event;
  }

  public async listHealthEventsByWorkspace(workspaceId: string): Promise<LeadHealthEvent[]> {
    const querySnap = await this.db
      .collection(HEALTH_EVENTS_COLLECTION)
      .where("workspaceId", "==", workspaceId)
      .get();

    return querySnap.docs
      .map((doc) => doc.data() as LeadHealthEvent)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
