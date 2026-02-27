import { getFirebaseDb } from "../../infrastructure/firebase-admin.js";
import type { PaymentRecord, Session, User, Workspace } from "./auth.types.js";

const COLLECTIONS = {
  users: "users",
  workspaces: "workspaces",
  sessions: "sessions",
  payments: "payments",
} as const;

export class AuthRepository {
  private readonly db = getFirebaseDb();

  public async createWorkspace(workspace: Workspace): Promise<Workspace> {
    await this.db.collection(COLLECTIONS.workspaces).doc(workspace.id).set(workspace);
    return workspace;
  }

  public async findWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    const snap = await this.db.collection(COLLECTIONS.workspaces).doc(workspaceId).get();
    if (!snap.exists) {
      return null;
    }

    return snap.data() as Workspace;
  }

  public async updateWorkspace(workspaceId: string, patch: Partial<Workspace>): Promise<Workspace | null> {
    const current = await this.findWorkspaceById(workspaceId);
    if (!current) {
      return null;
    }

    const updated: Workspace = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await this.db.collection(COLLECTIONS.workspaces).doc(workspaceId).set(updated);
    return updated;
  }

  public async createUser(user: User): Promise<User> {
    await this.db.collection(COLLECTIONS.users).doc(user.id).set(user);
    return user;
  }

  public async updateUser(userId: string, patch: Partial<User>): Promise<User | null> {
    const current = await this.findUserById(userId);
    if (!current) {
      return null;
    }

    const updated: User = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await this.db.collection(COLLECTIONS.users).doc(userId).set(updated);
    return updated;
  }

  public async findUserById(userId: string): Promise<User | null> {
    const snap = await this.db.collection(COLLECTIONS.users).doc(userId).get();
    if (!snap.exists) {
      return null;
    }

    return snap.data() as User;
  }

  public async findUserByEmail(email: string): Promise<User | null> {
    const lowerEmail = email.toLowerCase();
    const querySnap = await this.db
      .collection(COLLECTIONS.users)
      .where("email", "==", lowerEmail)
      .limit(1)
      .get();

    if (querySnap.empty) {
      return null;
    }

    return querySnap.docs[0]!.data() as User;
  }

  public async listUsersByWorkspace(workspaceId: string): Promise<User[]> {
    const querySnap = await this.db.collection(COLLECTIONS.users).where("workspaceId", "==", workspaceId).get();
    return querySnap.docs
      .map((doc) => doc.data() as User)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  public async createSession(session: Session): Promise<Session> {
    await this.db.collection(COLLECTIONS.sessions).doc(session.token).set(session);
    return session;
  }

  public async findSession(token: string): Promise<Session | null> {
    const snap = await this.db.collection(COLLECTIONS.sessions).doc(token).get();
    if (!snap.exists) {
      return null;
    }

    return snap.data() as Session;
  }

  public async deleteSession(token: string): Promise<void> {
    await this.db.collection(COLLECTIONS.sessions).doc(token).delete();
  }

  public async addPayment(payment: PaymentRecord): Promise<PaymentRecord> {
    await this.db.collection(COLLECTIONS.payments).doc(payment.id).set(payment);
    return payment;
  }

  public async listPaymentsByWorkspace(workspaceId: string): Promise<PaymentRecord[]> {
    const querySnap = await this.db
      .collection(COLLECTIONS.payments)
      .where("workspaceId", "==", workspaceId)
      .limit(100)
      .get();

    return querySnap.docs
      .map((doc) => doc.data() as PaymentRecord)
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  }
}
