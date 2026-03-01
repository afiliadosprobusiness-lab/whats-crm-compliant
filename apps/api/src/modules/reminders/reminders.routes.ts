import { Router } from "express";
import { asyncHandler } from "../../core/http.js";
import type { RemindersController } from "./reminders.controller.js";

export const createRemindersRouter = (remindersController: RemindersController): Router => {
  const router = Router();

  router.get("/", asyncHandler(async (req, res) => remindersController.listReminders(req, res)));
  router.post("/", asyncHandler(async (req, res) => remindersController.createReminder(req, res)));
  router.patch(
    "/:reminderId/complete",
    asyncHandler(async (req, res) => remindersController.completeReminder(req, res)),
  );

  return router;
};
