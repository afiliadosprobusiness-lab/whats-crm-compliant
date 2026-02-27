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

  public registerOwner(input: unknown): AuthResponse {
    const payload = registerSchema.parse(input);
    const existingUser = this.authRepository.findUserByEmail(payload.email);
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

    this.authRepository.createWorkspace(workspace);

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

    this.authRepository.createUser(user);
    const session = this.createSession(user.id, workspace.id);

    return {
      token: session.token,
      user: toPublicUser(user),
      workspace,
    };
  }

  public login(input: unknown): AuthResponse {
    const payload = loginSchema.parse(input);
    const user = this.authRepository.findUserByEmail(payload.email);
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

    const workspace = this.authRepository.findWorkspaceById(user.workspaceId);
    if (!workspace) {
      throw new AppError({
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "Workspace de usuario no encontrado",
      });
    }

    const session = this.createSession(user.id, workspace.id);
    return {
      token: session.token,
      user: toPublicUser(user),
      workspace,
    };
  }

  public getAuthContext(token: string): AuthContext {
    const session = this.authRepository.findSession(token);
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
      this.authRepository.deleteSession(token);
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHORIZED",
        message: "Sesion expirada",
      });
    }

    const user = this.authRepository.findUserById(session.userId);
    const workspace = this.authRepository.findWorkspaceById(session.workspaceId);
    if (!user || !workspace) {
      this.authRepository.deleteSession(token);
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

  public logout(token: string): void {
    this.authRepository.deleteSession(token);
  }

  public createWorkspaceUser(actorToken: string, input: unknown): PublicUser {
    const actor = this.getAuthContext(actorToken);
    if (actor.user.role !== "owner") {
      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message: "Solo el owner puede crear usuarios",
      });
    }

    const payload = createWorkspaceUserSchema.parse(input);
    const existing = this.authRepository.findUserByEmail(payload.email);
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

    this.authRepository.createUser(user);
    return toPublicUser(user);
  }

  public listWorkspaceUsers(actorToken: string): PublicUser[] {
    const actor = this.getAuthContext(actorToken);
    return this.authRepository.listUsersByWorkspace(actor.workspace.id).map(toPublicUser);
  }

  private createSession(userId: string, workspaceId: string): Session {
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

