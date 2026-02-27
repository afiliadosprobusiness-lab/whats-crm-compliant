import type { Request, Response } from "express";
import { AppError } from "../../core/errors.js";
import type { RemindersService } from "./reminders.service.js";

const getWorkspaceId = (res: Response): string => {
  const auth = res.locals.auth as { workspace?: { id: string } } | undefined;
  if (!auth?.workspace?.id) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "No autenticado",
    });
  }

  return auth.workspace.id;
};

export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  public createReminder = (req: Request, res: Response): void => {
    const workspaceId = getWorkspaceId(res);
    const reminder = this.remindersService.createReminder(workspaceId, req.body);
    res.status(201).json({ reminder });
  };

  public listReminders = (_req: Request, res: Response): void => {
    const workspaceId = getWorkspaceId(res);
    const reminders = this.remindersService.listReminders(workspaceId);
    res.status(200).json({ reminders });
  };
}
