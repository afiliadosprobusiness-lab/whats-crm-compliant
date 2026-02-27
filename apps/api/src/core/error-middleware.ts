import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, isAppError } from "./errors.js";

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(
    new AppError({
      message: "Ruta no encontrada",
      statusCode: 404,
      code: "NOT_FOUND",
    }),
  );
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Payload invalido",
        details: error.flatten(),
      },
      requestId: res.locals.requestId ?? null,
    });
    return;
  }

  if (isAppError(error)) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
      },
      requestId: res.locals.requestId ?? null,
    });
    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Error interno",
      details: null,
    },
    requestId: res.locals.requestId ?? null,
  });
};

