import type { Request, Response } from "express";
import { AppError } from "../../core/errors.js";
import type { TemplatesService } from "./templates.service.js";

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

export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  public createTemplate = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const template = await this.templatesService.createTemplate(workspaceId, req.body);
    res.status(201).json({ template });
  };

  public listTemplates = async (_req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const templates = await this.templatesService.listTemplates(workspaceId);
    res.status(200).json({ templates });
  };
}
