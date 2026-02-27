import { Router } from "express";
import { asyncHandler } from "../../core/http.js";
import type { LeadsController } from "./leads.controller.js";

export const createLeadsRouter = (leadsController: LeadsController): Router => {
  const router = Router();

  router.get("/", asyncHandler(async (req, res) => leadsController.listLeads(req, res)));
  router.post("/", asyncHandler(async (req, res) => leadsController.createLead(req, res)));
  router.post("/upsert", asyncHandler(async (req, res) => leadsController.upsertLeadByPhone(req, res)));
  router.patch("/:leadId", asyncHandler(async (req, res) => leadsController.patchLead(req, res)));
  router.patch("/:leadId/stage", asyncHandler(async (req, res) => leadsController.updateLeadStage(req, res)));
  router.post("/:leadId/notes", asyncHandler(async (req, res) => leadsController.addLeadNote(req, res)));

  return router;
};
