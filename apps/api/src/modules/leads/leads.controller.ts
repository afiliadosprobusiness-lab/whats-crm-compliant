import type { Request, Response } from "express";
import { AppError } from "../../core/errors.js";
import type { LeadsService } from "./leads.service.js";

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

export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  public createLead = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const lead = await this.leadsService.createLead(workspaceId, req.body);
    res.status(201).json({ lead });
  };

  public upsertLeadByPhone = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const lead = await this.leadsService.upsertLeadByPhone(workspaceId, req.body);
    res.status(200).json({ lead });
  };

  public listLeads = async (_req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const leads = await this.leadsService.listLeads(workspaceId);
    res.status(200).json({ leads });
  };

  public updateLeadStage = async (req: Request, res: Response): Promise<void> => {
    const leadId = req.params.leadId;
    if (!leadId) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "leadId requerido",
      });
    }

    const workspaceId = getWorkspaceId(res);
    const lead = await this.leadsService.updateLeadStage(workspaceId, leadId, req.body);
    res.status(200).json({ lead });
  };

  public patchLead = async (req: Request, res: Response): Promise<void> => {
    const leadId = req.params.leadId;
    if (!leadId) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "leadId requerido",
      });
    }

    const workspaceId = getWorkspaceId(res);
    const lead = await this.leadsService.updateLead(workspaceId, leadId, req.body);
    res.status(200).json({ lead });
  };

  public addLeadNote = async (req: Request, res: Response): Promise<void> => {
    const leadId = req.params.leadId;
    if (!leadId) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "leadId requerido",
      });
    }

    const workspaceId = getWorkspaceId(res);
    const lead = await this.leadsService.addLeadNote(workspaceId, leadId, req.body);
    res.status(200).json({ lead });
  };
}
