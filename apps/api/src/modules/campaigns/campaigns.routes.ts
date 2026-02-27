import { Router } from "express";
import { asyncHandler } from "../../core/http.js";
import type { CampaignsController } from "./campaigns.controller.js";

export const createCampaignsRouter = (campaignsController: CampaignsController): Router => {
  const router = Router();

  router.get("/", asyncHandler(async (req, res) => campaignsController.listCampaigns(req, res)));
  router.post("/", asyncHandler(async (req, res) => campaignsController.createCampaign(req, res)));
  router.post("/:campaignId/send", asyncHandler(async (req, res) => campaignsController.sendCampaign(req, res)));

  return router;
};

