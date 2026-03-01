import { createId } from "../../core/id.js";
import type { AuditRepository } from "./audit.repository.js";
import type { AuditActor, AuditLog, CreateAuditLogInput } from "./audit.types.js";

export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  public async log(workspaceId: string, actor: AuditActor | null, input: CreateAuditLogInput): Promise<void> {
    const log: AuditLog = {
      id: createId("audit"),
      workspaceId,
      actorUserId: actor?.userId ?? null,
      actorUserRole: actor?.role ?? null,
      scope: input.scope,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
      details: input.details ?? null,
      createdAt: new Date().toISOString(),
    };

    await this.auditRepository.create(log);
  }

  public async listRecent(workspaceId: string, limit = 20): Promise<AuditLog[]> {
    const safeLimit = Math.min(100, Math.max(1, limit));
    const logs = await this.auditRepository.listByWorkspace(workspaceId);
    return logs.slice(0, safeLimit);
  }
}
