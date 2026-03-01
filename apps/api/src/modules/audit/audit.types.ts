export const auditScopes = ["lead", "campaign", "reminder", "compliance", "system"] as const;

export type AuditScope = (typeof auditScopes)[number];

export type AuditDetails = Record<string, unknown>;

export type AuditActor = {
  userId: string;
  role: string;
};

export type AuditLog = {
  id: string;
  workspaceId: string;
  actorUserId: string | null;
  actorUserRole: string | null;
  scope: AuditScope;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  details: AuditDetails | null;
  createdAt: string;
};

export type CreateAuditLogInput = {
  scope: AuditScope;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  details?: AuditDetails | null;
};
