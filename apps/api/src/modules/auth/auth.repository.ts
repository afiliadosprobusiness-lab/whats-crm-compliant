import type { PaymentRecord, Session, User, Workspace } from "./auth.types.js";

export class AuthRepository {
  private readonly users = new Map<string, User>();
  private readonly usersByEmail = new Map<string, string>();
  private readonly workspaces = new Map<string, Workspace>();
  private readonly sessions = new Map<string, Session>();
  private readonly payments = new Map<string, PaymentRecord[]>();

  public createWorkspace(workspace: Workspace): Workspace {
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  public findWorkspaceById(workspaceId: string): Workspace | null {
    return this.workspaces.get(workspaceId) ?? null;
  }

  public updateWorkspace(workspaceId: string, patch: Partial<Workspace>): Workspace | null {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return null;
    }

    const updated: Workspace = {
      ...workspace,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    this.workspaces.set(workspaceId, updated);
    return updated;
  }

  public createUser(user: User): User {
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email.toLowerCase(), user.id);
    return user;
  }

  public findUserById(userId: string): User | null {
    return this.users.get(userId) ?? null;
  }

  public findUserByEmail(email: string): User | null {
    const userId = this.usersByEmail.get(email.toLowerCase());
    if (!userId) {
      return null;
    }

    return this.users.get(userId) ?? null;
  }

  public listUsersByWorkspace(workspaceId: string): User[] {
    return Array.from(this.users.values())
      .filter((user) => user.workspaceId === workspaceId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  public createSession(session: Session): Session {
    this.sessions.set(session.token, session);
    return session;
  }

  public findSession(token: string): Session | null {
    return this.sessions.get(token) ?? null;
  }

  public deleteSession(token: string): void {
    this.sessions.delete(token);
  }

  public addPayment(payment: PaymentRecord): PaymentRecord {
    const current = this.payments.get(payment.workspaceId) ?? [];
    current.unshift(payment);
    this.payments.set(payment.workspaceId, current);
    return payment;
  }

  public listPaymentsByWorkspace(workspaceId: string): PaymentRecord[] {
    return this.payments.get(workspaceId) ?? [];
  }
}

