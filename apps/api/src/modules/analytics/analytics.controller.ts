import type { Request, Response } from "express";
import { AppError } from "../../core/errors.js";
import type { AnalyticsService } from "./analytics.service.js";

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

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  public getProductivity = async (_req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const productivity = await this.analyticsService.getProductivity(workspaceId);
    res.status(200).json({ productivity });
  };
}
