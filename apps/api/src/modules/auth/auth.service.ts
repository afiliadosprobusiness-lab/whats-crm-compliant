import { addDays } from "../../core/time.js";
import type { EnvConfig } from "../../config/env.js";
import { AppError } from "../../core/errors.js";
import { createId } from "../../core/id.js";
import type { AuthRepository } from "./auth.repository.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  createWorkspaceUserSchema,
  loginSchema,
  registerSchema,
  type Session,
  type User,
  type Workspace,
} from "./auth.types.js";

type PublicUser = Omit<User, "passwordHash" | "passwordSalt">;

export type AuthContext = {
  user: PublicUser;
  workspace: Workspace;
  sessionToken: string;
};

type AuthResponse = {
  token: string;
  user: PublicUser;
  workspace: Workspace;
};

const toPublicUser = (user: User): PublicUser => {
  // Remove credential material before sending data to client.
  const { passwordHash, passwordSalt, ...publicUser } = user;
  void passwordHash;
  void passwordSalt;
  return publicUser;
};

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly env: EnvConfig,
  ) {}

  public async registerOwner(input: unknown): Promise<AuthResponse> {
    const payload = registerSchema.parse(input);
    const existingUser = await this.authRepository.findUserByEmail(payload.email);
    if (existingUser) {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message: "El correo ya esta registrado",
      });
    }

    const now = new Date().toISOString();
    const workspace: Workspace = {
      id: createId("ws"),
      companyName: payload.companyName,
      planMonthlyPricePen: this.env.planMonthlyPricePen,
      subscriptionStatus: "active",
      currentPeriodStart: now,
      currentPeriodEnd: addDays(now, this.env.billingPeriodDays),
      lastPaymentAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await this.authRepository.createWorkspace(workspace);

    const password = hashPassword(payload.password);
    const user: User = {
      id: createId("usr"),
      workspaceId: workspace.id,
      name: payload.name,
      email: payload.email.toLowerCase(),
      role: "owner",
      passwordSalt: password.salt,
      passwordHash: password.hash,
      createdAt: now,
      updatedAt: now,
    };

    await this.authRepository.createUser(user);
    const session = await this.createSession(user.id, workspace.id);

    return {
      token: session.token,
      user: toPublicUser(user),
      workspace,
    };
  }

  public async login(input: unknown): Promise<AuthResponse> {
    const payload = loginSchema.parse(input);
    const user = await this.authRepository.findUserByEmail(payload.email);
    if (!user) {
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHORIZED",
        message: "Credenciales invalidas",
      });
    }

    const isPasswordValid = verifyPassword(payload.password, user.passwordSalt, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHORIZED",
        message: "Credenciales invalidas",
      });
    }

    const workspace = await this.authRepository.findWorkspaceById(user.workspaceId);
    if (!workspace) {
      throw new AppError({
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "Workspace de usuario no encontrado",
      });
    }

    const session = await this.createSession(user.id, workspace.id);
    return {
      token: session.token,
      user: toPublicUser(user),
      workspace,
    };
  }

  public async getAuthContext(token: string): Promise<AuthContext> {
    const session = await this.authRepository.findSession(token);
    if (!session) {
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHORIZED",
        message: "Sesion invalida",
      });
    }

    const nowTime = Date.now();
    const expiresAtTime = new Date(session.expiresAt).getTime();
    if (expiresAtTime <= nowTime) {
      await this.authRepository.deleteSession(token);
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHORIZED",
        message: "Sesion expirada",
      });
    }

    const user = await this.authRepository.findUserById(session.userId);
    const workspace = await this.authRepository.findWorkspaceById(session.workspaceId);
    if (!user || !workspace) {
      await this.authRepository.deleteSession(token);
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHORIZED",
        message: "Sesion invalida",
      });
    }

    return {
      user: toPublicUser(user),
      workspace,
      sessionToken: token,
    };
  }

  public async logout(token: string): Promise<void> {
    await this.authRepository.deleteSession(token);
  }

  public async createWorkspaceUser(actorToken: string, input: unknown): Promise<PublicUser> {
    const actor = await this.getAuthContext(actorToken);
    if (actor.user.role !== "owner") {
      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message: "Solo el owner puede crear usuarios",
      });
    }

    const payload = createWorkspaceUserSchema.parse(input);
    const existing = await this.authRepository.findUserByEmail(payload.email);
    if (existing) {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message: "El correo ya esta registrado",
      });
    }

    const now = new Date().toISOString();
    const password = hashPassword(payload.password);
    const user: User = {
      id: createId("usr"),
      workspaceId: actor.workspace.id,
      name: payload.name,
      email: payload.email.toLowerCase(),
      role: payload.role,
      passwordSalt: password.salt,
      passwordHash: password.hash,
      createdAt: now,
      updatedAt: now,
    };

    await this.authRepository.createUser(user);
    return toPublicUser(user);
  }

  public async listWorkspaceUsers(actorToken: string): Promise<PublicUser[]> {
    const actor = await this.getAuthContext(actorToken);
    const users = await this.authRepository.listUsersByWorkspace(actor.workspace.id);
    return users.map(toPublicUser);
  }

  private async createSession(userId: string, workspaceId: string): Promise<Session> {
    const now = new Date().toISOString();
    return this.authRepository.createSession({
      token: createId("sess"),
      userId,
      workspaceId,
      createdAt: now,
      expiresAt: addDays(now, this.env.sessionTtlDays),
    });
  }
}
