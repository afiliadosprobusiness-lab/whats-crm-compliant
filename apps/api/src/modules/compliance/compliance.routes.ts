import { Router } from "express";
import { asyncHandler } from "../../core/http.js";
import type { ComplianceController } from "./compliance.controller.js";

export const createComplianceRouter = (complianceController: ComplianceController): Router => {
  const router = Router();

  router.get(
    "/trust-center",
    asyncHandler(async (req, res) => complianceController.getTrustCenter(req, res)),
  );
  router.get(
    "/messaging-mode",
    asyncHandler(async (req, res) => complianceController.getMessagingMode(req, res)),
  );
  router.post(
    "/manual-assist",
    asyncHandler(async (req, res) => complianceController.registerManualAssist(req, res)),
  );

  return router;
};
