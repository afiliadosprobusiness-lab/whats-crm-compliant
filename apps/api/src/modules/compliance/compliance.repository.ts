import { getFirebaseDb } from "../../infrastructure/firebase-admin.js";
import type { ManualAssistUsageRecord } from "./compliance.types.js";

const MANUAL_ASSIST_COLLECTION = "compliance_usage";

export class ComplianceRepository {
  private readonly db = getFirebaseDb();

  public async createManualAssistUsage(record: ManualAssistUsageRecord): Promise<ManualAssistUsageRecord> {
    await this.db.collection(MANUAL_ASSIST_COLLECTION).doc(record.id).set(record);
    return record;
  }

  public async countManualAssistForMinute(
    workspaceId: string,
    userId: string,
    minuteBucket: string,
  ): Promise<number> {
    const workspaceUserMinuteKey = `${workspaceId}_${userId}_${minuteBucket}`;
    const querySnap = await this.db
      .collection(MANUAL_ASSIST_COLLECTION)
      .where("workspaceUserMinuteKey", "==", workspaceUserMinuteKey)
      .get();

    return querySnap.size;
  }
}
