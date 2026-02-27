import { Router } from "express";
import { asyncHandler } from "../../core/http.js";
import type { TemplatesController } from "./templates.controller.js";

export const createTemplatesRouter = (templatesController: TemplatesController): Router => {
  const router = Router();

  router.get("/", asyncHandler(async (req, res) => templatesController.listTemplates(req, res)));
  router.post("/", asyncHandler(async (req, res) => templatesController.createTemplate(req, res)));

  return router;
};

