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

  public createLead = (req: Request, res: Response): void => {
    const workspaceId = getWorkspaceId(res);
    const lead = this.leadsService.createLead(workspaceId, req.body);
    res.status(201).json({ lead });
  };

  public listLeads = (_req: Request, res: Response): void => {
    const workspaceId = getWorkspaceId(res);
    const leads = this.leadsService.listLeads(workspaceId);
    res.status(200).json({ leads });
  };

  public updateLeadStage = (req: Request, res: Response): void => {
    const leadId = req.params.leadId;
    if (!leadId) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "leadId requerido",
      });
    }

    const workspaceId = getWorkspaceId(res);
    const lead = this.leadsService.updateLeadStage(workspaceId, leadId, req.body);
    res.status(200).json({ lead });
  };

  public addLeadNote = (req: Request, res: Response): void => {
    const leadId = req.params.leadId;
    if (!leadId) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "leadId requerido",
      });
    }

    const workspaceId = getWorkspaceId(res);
    const lead = this.leadsService.addLeadNote(workspaceId, leadId, req.body);
    res.status(200).json({ lead });
  };
}
