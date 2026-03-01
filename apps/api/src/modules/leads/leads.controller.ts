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

export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  public createLead = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const actor = getActor(res);
    const lead = await this.leadsService.createLead(workspaceId, actor, req.body);
    res.status(201).json({ lead });
  };

  public upsertLeadByPhone = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const actor = getActor(res);
    const lead = await this.leadsService.upsertLeadByPhone(workspaceId, actor, req.body);
    res.status(200).json({ lead });
  };

  public listLeads = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const actor = getActor(res);
    const view = typeof req.query.view === "string" ? req.query.view : undefined;
    const leads = await this.leadsService.listLeads(workspaceId, { actorUserId: actor.userId, view });
    res.status(200).json({ leads });
  };

  public listLeadInbox = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(res);
    const actor = getActor(res);
    const view = typeof req.query.view === "string" ? req.query.view : undefined;
    const inbox = await this.leadsService.listLeadInbox(workspaceId, actor.userId, view);
    res.status(200).json({ inbox });
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
    const actor = getActor(res);
    const lead = await this.leadsService.updateLeadStage(workspaceId, actor, leadId, req.body);
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
    const actor = getActor(res);
    const lead = await this.leadsService.updateLead(workspaceId, actor, leadId, req.body);
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
    const actor = getActor(res);
    const lead = await this.leadsService.addLeadNote(workspaceId, actor, leadId, req.body);
    res.status(200).json({ lead });
  };

  public assignLeadOwner = async (req: Request, res: Response): Promise<void> => {
    const leadId = req.params.leadId;
    if (!leadId) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "leadId requerido",
      });
    }

    const workspaceId = getWorkspaceId(res);
    const actor = getActor(res);
    const lead = await this.leadsService.assignLeadOwner(workspaceId, actor, leadId, req.body);
    res.status(200).json({ lead });
  };

  public registerLeadHealthEvent = async (req: Request, res: Response): Promise<void> => {
    const leadId = req.params.leadId;
    if (!leadId) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "leadId requerido",
      });
    }

    const workspaceId = getWorkspaceId(res);
    const actor = getActor(res);
    const lead = await this.leadsService.registerLeadHealthEvent(workspaceId, actor, leadId, req.body);
    res.status(200).json({ lead });
  };
}
