import type { RequestHandler, Router } from "express";
import { Router as createRouter } from "express";
import { asyncHandler } from "../../core/http.js";
import type { AuthController } from "./auth.controller.js";

export const createAuthRouter = (
  authController: AuthController,
  authMiddleware: RequestHandler,
): Router => {
  const router = createRouter();

  router.post("/register", asyncHandler(async (req, res) => authController.register(req, res)));
  router.post("/login", asyncHandler(async (req, res) => authController.login(req, res)));
  router.post("/google", asyncHandler(async (req, res) => authController.loginWithGoogle(req, res)));

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
