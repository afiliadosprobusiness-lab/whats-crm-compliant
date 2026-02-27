import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../core/errors.js";
import type { AuthService } from "./auth.service.js";

const getBearerToken = (req: Request): string | null => {
  const header = req.header("authorization");
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
};

export const createAuthMiddleware = (authService: AuthService) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = getBearerToken(req);
    if (!token) {
      next(
        new AppError({
          statusCode: 401,
          code: "UNAUTHORIZED",
          message: "Token Bearer requerido",
        }),
      );
      return;
    }

    try {
      const context = authService.getAuthContext(token);
      res.locals.auth = context;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const subscriptionGuardMiddleware = (_req: Request, res: Response, next: NextFunction): void => {
  const auth = res.locals.auth as { workspace?: { subscriptionStatus: string; currentPeriodEnd: string } } | undefined;
  if (!auth?.workspace) {
    next(
      new AppError({
        statusCode: 401,
        code: "UNAUTHORIZED",
        message: "No autenticado",
      }),
    );
    return;
  }

  const isActive = auth.workspace.subscriptionStatus === "active";
  const isInPeriod = new Date(auth.workspace.currentPeriodEnd).getTime() > Date.now();
  if (!isActive || !isInPeriod) {
    next(
      new AppError({
        statusCode: 402,
        code: "PAYMENT_REQUIRED",
        message: "Suscripcion vencida. Renueva para continuar.",
      }),
    );
    return;
  }

  next();
};

export const extractBearerToken = (req: Request): string => {
  const token = getBearerToken(req);
  if (!token) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Token Bearer requerido",
    });
  }

  return token;
};

