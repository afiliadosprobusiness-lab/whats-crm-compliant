import type { Request, Response } from "express";
import { AppError } from "../../core/errors.js";
import type { CampaignsService } from "./campaigns.service.js";

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

export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  public createCampaign = (req: Request, res: Response): void => {
    const workspaceId = getWorkspaceId(res);
    const campaign = this.campaignsService.createCampaign(workspaceId, req.body);
    res.status(201).json({ campaign });
  };

  public listCampaigns = (_req: Request, res: Response): void => {
    const workspaceId = getWorkspaceId(res);
    const campaigns = this.campaignsService.listCampaigns(workspaceId);
    res.status(200).json({ campaigns });
  };

  public sendCampaign = async (req: Request, res: Response): Promise<void> => {
    const campaignId = req.params.campaignId;
    if (!campaignId) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "campaignId requerido",
      });
    }

    const workspaceId = getWorkspaceId(res);
    const { campaign, results } = await this.campaignsService.sendCampaign(workspaceId, campaignId);
    res.status(200).json({ campaign, results });
  };
}
