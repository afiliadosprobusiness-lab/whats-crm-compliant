import type { RequestHandler, Router } from "express";
import { Router as createRouter } from "express";
import { asyncHandler } from "../../core/http.js";
import type { BillingController } from "./billing.controller.js";

export const createBillingRouter = (
  billingController: BillingController,
  authMiddleware: RequestHandler,
): Router => {
  const router = createRouter();

  router.use(authMiddleware);
  router.get("/subscription", asyncHandler(async (req, res) => billingController.getSubscription(req, res)));
  router.post("/renew", asyncHandler(async (req, res) => billingController.renewSubscription(req, res)));

  return router;
};

