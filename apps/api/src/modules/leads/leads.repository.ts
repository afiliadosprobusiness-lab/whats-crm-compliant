import { getFirebaseDb } from "../../infrastructure/firebase-admin.js";
import type { Lead, LeadStage } from "./leads.types.js";

const COLLECTION = "leads";

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
}

