import type { Request } from "express";
import type { NextFunction, RequestHandler, Response } from "express";
import { AppError } from "./errors.js";

type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
  keyExtractor?: (req: Request) => string;
  message?: string;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export const createInMemoryRateLimiter = (options: RateLimitOptions): RequestHandler => {
  const buckets = new Map<string, RateLimitBucket>();
  const {
    maxRequests,
    windowMs,
    keyPrefix,
    keyExtractor,
    message = "Demasiados intentos. Espera un momento antes de volver a intentar.",
  } = options;

  const cleanup = (nowMs: number) => {
    if (buckets.size < 1000) {
      return;
    }
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= nowMs) {
        buckets.delete(key);
      }
    }
  };

  return (req: Request, _res: Response, next: NextFunction) => {
    const nowMs = Date.now();
    cleanup(nowMs);

    const identity = String(
      keyExtractor
        ? keyExtractor(req)
        : req.ip || req.socket?.remoteAddress || "unknown",
    ).trim().toLowerCase() || "unknown";
    const key = `${keyPrefix}:${identity}`;

    const existing = buckets.get(key);
    const bucket =
      !existing || existing.resetAt <= nowMs
        ? { count: 0, resetAt: nowMs + windowMs }
        : existing;

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > maxRequests) {
      next(
        new AppError({
          statusCode: 429,
          code: "RATE_LIMITED",
          message,
          details: {
            retryAfterMs: Math.max(0, bucket.resetAt - nowMs),
            windowMs,
            maxRequests,
          },
        }),
      );
      return;
    }

    next();
  };
};
