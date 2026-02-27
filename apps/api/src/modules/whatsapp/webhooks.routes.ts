import { Router } from "express";
import { asyncHandler } from "../../core/http.js";
import type { WebhooksController } from "./webhooks.controller.js";

export const createWebhooksRouter = (webhooksController: WebhooksController): Router => {
  const router = Router();

  router.get("/whatsapp", asyncHandler(async (req, res) => webhooksController.verifyWebhook(req, res)));
  router.post("/whatsapp", asyncHandler(async (req, res) => webhooksController.receiveWebhook(req, res)));
  router.get("/whatsapp/events", asyncHandler(async (req, res) => webhooksController.listWebhookEvents(req, res)));

  return router;
};

