import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.header("x-request-id") ?? `req_${randomUUID()}`;
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};

