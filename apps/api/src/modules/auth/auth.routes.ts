import type { RequestHandler, Router } from "express";
import { Router as createRouter } from "express";
import { asyncHandler } from "../../core/http.js";
import { createInMemoryRateLimiter } from "../../core/rate-limit.js";
import type { AuthController } from "./auth.controller.js";

export const createAuthRouter = (
  authController: AuthController,
  authMiddleware: RequestHandler,
): Router => {
  const router = createRouter();

  const registerLimiter = createInMemoryRateLimiter({
    keyPrefix: "auth_register",
    maxRequests: 8,
    windowMs: 60 * 60 * 1000,
    keyExtractor: (req) => req.ip || req.socket?.remoteAddress || "unknown",
    message: "Demasiados registros en poco tiempo. Intenta nuevamente mas tarde.",
  });

  const loginLimiter = createInMemoryRateLimiter({
    keyPrefix: "auth_login",
    maxRequests: 15,
    windowMs: 10 * 60 * 1000,
    keyExtractor: (req) => {
      const email = String(req.body?.email || "").trim().toLowerCase().slice(0, 180);
      const ip = req.ip || req.socket?.remoteAddress || "unknown";
      return `${ip}|${email || "no-email"}`;
    },
    message: "Demasiados intentos de login. Espera unos minutos antes de reintentar.",
  });

  const googleLimiter = createInMemoryRateLimiter({
    keyPrefix: "auth_google",
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
    keyExtractor: (req) => req.ip || req.socket?.remoteAddress || "unknown",
    message: "Demasiados intentos con Google. Espera unos minutos antes de reintentar.",
  });

  router.post("/register", registerLimiter, asyncHandler(async (req, res) => authController.register(req, res)));
  router.post("/login", loginLimiter, asyncHandler(async (req, res) => authController.login(req, res)));
  router.post("/google", googleLimiter, asyncHandler(async (req, res) => authController.loginWithGoogle(req, res)));

  router.get("/me", authMiddleware, asyncHandler(async (req, res) => authController.me(req, res)));
  router.post("/logout", authMiddleware, asyncHandler(async (req, res) => authController.logout(req, res)));
  router.get("/users", authMiddleware, asyncHandler(async (req, res) => authController.listWorkspaceUsers(req, res)));
  router.post(
    "/users",
    authMiddleware,
    asyncHandler(async (req, res) => authController.createWorkspaceUser(req, res)),
  );

  return router;
};
