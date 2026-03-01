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

export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  public preflightCampaignDraft = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const actor = getActor(res);
    const preflight = await this.campaignsService.preflightDraftCampaign(workspaceId, actor, req.body);
    res.status(200).json({ preflight });
  };

  public createCampaign = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const actor = getActor(res);
    const campaign = await this.campaignsService.createCampaign(workspaceId, actor, req.body);
    res.status(201).json({ campaign });
  };

  public listCampaigns = async (_req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const campaigns = await this.campaignsService.listCampaigns(workspaceId);
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
    const actor = getActor(res);
    const { campaign, results } = await this.campaignsService.sendCampaign(workspaceId, actor, campaignId);
    res.status(200).json({ campaign, results });
  };

  public preflightCampaign = async (req: Request, res: Response): Promise<void> => {
    const campaignId = req.params.campaignId;
    if (!campaignId) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "campaignId requerido",
      });
    }

    const workspaceId = getWorkspaceId(res);
    const actor = getActor(res);
    const preflight = await this.campaignsService.preflightCampaign(workspaceId, actor, campaignId);
    res.status(200).json({ preflight });
  };
}
