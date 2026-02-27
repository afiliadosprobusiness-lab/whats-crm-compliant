import { getFirebaseDb } from "../../infrastructure/firebase-admin.js";
import type { Template } from "./templates.types.js";

const COLLECTION = "templates";

export class TemplatesRepository {
  private readonly db = getFirebaseDb();

  public async create(template: Template): Promise<Template> {
    await this.db.collection(COLLECTION).doc(template.id).set(template);
    return template;
  }

  public async list(workspaceId: string): Promise<Template[]> {
    const querySnap = await this.db.collection(COLLECTION).where("workspaceId", "==", workspaceId).get();
    return querySnap.docs
      .map((doc) => doc.data() as Template)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public async findById(workspaceId: string, templateId: string): Promise<Template | null> {
    const snap = await this.db.collection(COLLECTION).doc(templateId).get();
    if (!snap.exists) {
      return null;
    }

    const template = snap.data() as Template;
    return template.workspaceId === workspaceId ? template : null;
  }
}

