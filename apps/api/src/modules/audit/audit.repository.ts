import { getFirebaseDb } from "../../infrastructure/firebase-admin.js";
import type { AuditLog } from "./audit.types.js";

const COLLECTION = "audit_logs";

export class AuditRepository {
  private readonly db = getFirebaseDb();

  public async create(log: AuditLog): Promise<AuditLog> {
    await this.db.collection(COLLECTION).doc(log.id).set(log);
    return log;
  }

  public async listByWorkspace(workspaceId: string): Promise<AuditLog[]> {
    const querySnap = await this.db.collection(COLLECTION).where("workspaceId", "==", workspaceId).get();
    return querySnap.docs
      .map((doc) => doc.data() as AuditLog)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
