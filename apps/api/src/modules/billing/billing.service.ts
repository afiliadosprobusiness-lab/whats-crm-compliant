import type { EnvConfig } from "../../config/env.js";
import { addDays } from "../../core/time.js";
import { AppError } from "../../core/errors.js";
import { createId } from "../../core/id.js";
import type { AuthRepository } from "../auth/auth.repository.js";
import { renewSubscriptionSchema } from "./billing.types.js";

export class BillingService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly env: EnvConfig,
  ) {}

  public getSubscription(workspaceId: string) {
    const workspace = this.authRepository.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Workspace no encontrado",
      });
    }

    const payments = this.authRepository.listPaymentsByWorkspace(workspaceId);
    const isInPeriod = new Date(workspace.currentPeriodEnd).getTime() > Date.now();

    return {
      workspaceId: workspace.id,
      companyName: workspace.companyName,
      planMonthlyPricePen: workspace.planMonthlyPricePen,
      subscriptionStatus: workspace.subscriptionStatus,
      currentPeriodStart: workspace.currentPeriodStart,
      currentPeriodEnd: workspace.currentPeriodEnd,
      lastPaymentAt: workspace.lastPaymentAt,
      canUseCrm: workspace.subscriptionStatus === "active" && isInPeriod,
      recommendedMonthlyChargePen: this.env.planMonthlyPricePen,
      recentPayments: payments.slice(0, 6),
    };
  }

  public renewSubscription(workspaceId: string, input: unknown) {
    const workspace = this.authRepository.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Workspace no encontrado",
      });
    }

    const payload = renewSubscriptionSchema.parse(input);
    const minimumAmountPen = workspace.planMonthlyPricePen * payload.months;
    if (payload.amountPen < minimumAmountPen) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: `Monto insuficiente. Minimo esperado: S/${minimumAmountPen}`,
      });
    }

    const now = new Date().toISOString();
    const currentEndTime = new Date(workspace.currentPeriodEnd).getTime();
    const baseIso = currentEndTime > Date.now() ? workspace.currentPeriodEnd : now;
    const extensionDays = this.env.billingPeriodDays * payload.months;

    const updated = this.authRepository.updateWorkspace(workspaceId, {
      subscriptionStatus: "active",
      currentPeriodStart: now,
      currentPeriodEnd: addDays(baseIso, extensionDays),
      lastPaymentAt: now,
    });

    if (!updated) {
      throw new AppError({
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "No se pudo actualizar suscripcion",
      });
    }

    const payment = this.authRepository.addPayment({
      id: createId("pay"),
      workspaceId,
      amountPen: payload.amountPen,
      months: payload.months,
      paidAt: now,
    });

    return {
      workspace: updated,
      payment,
    };
  }
}

