import { Router } from "express";
import { asyncHandler } from "../../core/http.js";
import type { AnalyticsController } from "./analytics.controller.js";

export const createAnalyticsRouter = (analyticsController: AnalyticsController): Router => {
  const router = Router();

  router.get(
    "/productivity",
    asyncHandler(async (req, res) => analyticsController.getProductivity(req, res)),
  );

  return router;
};
