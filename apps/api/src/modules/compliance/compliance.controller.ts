import type { Request, Response } from "express";
import { AppError } from "../../core/errors.js";
import type { ComplianceService } from "./compliance.service.js";

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

export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  public getTrustCenter = async (_req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const trustCenter = await this.complianceService.getTrustCenter(workspaceId);
    res.status(200).json({ trustCenter });
  };

  public registerManualAssist = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const actor = getActor(res);
    const usage = await this.complianceService.registerManualAssist(workspaceId, actor, req.body);
    res.status(200).json({ usage });
  };

  public getMessagingMode = async (_req: Request, res: Response): Promise<void> => {
    const mode = this.complianceService.getMessagingMode();
    res.status(200).json({ mode });
  };
}
