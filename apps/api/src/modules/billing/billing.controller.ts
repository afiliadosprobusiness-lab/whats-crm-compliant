import type { Request, Response } from "express";
import { AppError } from "../../core/errors.js";
import type { AuthContext } from "../auth/auth.service.js";
import type { BillingService } from "./billing.service.js";

const getAuthContext = (res: Response): AuthContext => {
  const auth = res.locals.auth as AuthContext | undefined;
  if (!auth) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "No autenticado",
    });
  }
  return auth;
};

export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  public getSubscription = (_req: Request, res: Response): void => {
    const auth = getAuthContext(res);
    const subscription = this.billingService.getSubscription(auth.workspace.id);
    res.status(200).json({ subscription });
  };

  public renewSubscription = (req: Request, res: Response): void => {
    const auth = getAuthContext(res);
    if (auth.user.role !== "owner") {
      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message: "Solo owner puede renovar suscripcion",
      });
    }

    const result = this.billingService.renewSubscription(auth.workspace.id, req.body);
    res.status(200).json(result);
  };
}

