import { z } from "zod";

export const userRoles = ["owner", "agent"] as const;
export const subscriptionStatuses = ["active", "past_due", "canceled"] as const;
export const authProviders = ["password", "google"] as const;

export type UserRole = (typeof userRoles)[number];
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];
export type AuthProvider = (typeof authProviders)[number];

export type Workspace = {
  id: string;
  companyName: string;
  planMonthlyPricePen: number;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  lastPaymentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider?: AuthProvider;
  googleUid?: string | null;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  token: string;
  userId: string;
  workspaceId: string;
  createdAt: string;
  expiresAt: string;
};

export type PaymentRecord = {
  id: string;
  workspaceId: string;
  amountPen: number;
  months: number;
  paidAt: string;
};

export const registerSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(180),
  password: z.string().min(6).max(100),
});

export const googleLoginSchema = z.object({
  idToken: z.string().trim().min(10).max(8192),
  companyName: z.string().trim().min(2).max(120).optional(),
});

export const createWorkspaceUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  password: z.string().min(6).max(100),
  role: z.enum(userRoles).default("agent"),
});
