import { Router } from "express";
import { asyncHandler } from "../../core/http.js";
import { AppError } from "../../core/errors.js";
import { secureCompare } from "../../core/security.js";
import type { WebhooksController } from "./webhooks.controller.js";

export const createWebhooksRouter = (
  webhooksController: WebhooksController,
  options: { adminSyncKey: string },
): Router => {
  const router = Router();

  router.get("/whatsapp", asyncHandler(async (req, res) => webhooksController.verifyWebhook(req, res)));
  router.post("/whatsapp", asyncHandler(async (req, res) => webhooksController.receiveWebhook(req, res)));
  router.get(
    "/whatsapp/events",
    asyncHandler(async (req, res) => {
      const expectedKey = String(options.adminSyncKey || "").trim();
      if (!expectedKey) {
        throw new AppError({
          statusCode: 503,
          code: "INTERNAL_ERROR",
          message: "ADMIN_SYNC_KEY no configurado",
        });
      }

      const providedKey = String(req.header("x-admin-sync-key") || "").trim();
      if (!secureCompare(providedKey, expectedKey)) {
        throw new AppError({
          statusCode: 401,
          code: "UNAUTHORIZED",
          message: "x-admin-sync-key invalido",
        });
      }

      await webhooksController.listWebhookEvents(req, res);
    }),
  );

  return router;
};
