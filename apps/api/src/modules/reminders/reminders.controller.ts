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

const getActor = (res: Response): { userId: string; role: string } => {
  const auth = res.locals.auth as { user?: { id: string; role: string } } | undefined;
  if (!auth?.user?.id || !auth.user.role) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "No autenticado",
    });
  }

  return {
    userId: auth.user.id,
    role: auth.user.role,
  };
};

export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  public createReminder = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const actor = getActor(res);
    const reminder = await this.remindersService.createReminder(workspaceId, actor, req.body);
    res.status(201).json({ reminder });
  };

  public listReminders = async (_req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const reminders = await this.remindersService.listReminders(workspaceId);
    res.status(200).json({ reminders });
  };

  public completeReminder = async (req: Request, res: Response): Promise<void> => {
    const reminderId = req.params.reminderId;
    if (!reminderId) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "reminderId requerido",
      });
    }

    const workspaceId = getWorkspaceId(res);
    const actor = getActor(res);
    const reminder = await this.remindersService.completeReminder(workspaceId, actor, reminderId);
    res.status(200).json({ reminder });
  };
}
