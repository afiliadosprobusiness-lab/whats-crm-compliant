import { Router } from "express";
import { asyncHandler } from "../../core/http.js";
import type { LeadsController } from "./leads.controller.js";

export const createLeadsRouter = (leadsController: LeadsController): Router => {
  const router = Router();

  router.get("/", asyncHandler(async (req, res) => leadsController.listLeads(req, res)));
  router.get("/inbox", asyncHandler(async (req, res) => leadsController.listLeadInbox(req, res)));
  router.post("/", asyncHandler(async (req, res) => leadsController.createLead(req, res)));
  router.post("/upsert", asyncHandler(async (req, res) => leadsController.upsertLeadByPhone(req, res)));
  router.patch("/:leadId", asyncHandler(async (req, res) => leadsController.patchLead(req, res)));
  router.patch("/:leadId/stage", asyncHandler(async (req, res) => leadsController.updateLeadStage(req, res)));
  router.patch("/:leadId/assign", asyncHandler(async (req, res) => leadsController.assignLeadOwner(req, res)));
  router.post(
    "/:leadId/health-events",
    asyncHandler(async (req, res) => leadsController.registerLeadHealthEvent(req, res)),
  );
  router.post("/:leadId/notes", asyncHandler(async (req, res) => leadsController.addLeadNote(req, res)));

  return router;
};
