import type { Request, Response } from "express";
import type { AuthService } from "./auth.service.js";
import { extractBearerToken } from "./auth.middleware.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = (req: Request, res: Response): void => {
    const auth = this.authService.registerOwner(req.body);
    res.status(201).json(auth);
  };

  public login = (req: Request, res: Response): void => {
    const auth = this.authService.login(req.body);
    res.status(200).json(auth);
  };

  public me = (req: Request, res: Response): void => {
    const token = extractBearerToken(req);
    const auth = this.authService.getAuthContext(token);
    res.status(200).json({
      user: auth.user,
      workspace: auth.workspace,
      sessionToken: auth.sessionToken,
    });
  };

  public logout = (req: Request, res: Response): void => {
    const token = extractBearerToken(req);
    this.authService.logout(token);
    res.status(200).json({ ok: true });
  };

  public createWorkspaceUser = (req: Request, res: Response): void => {
    const token = extractBearerToken(req);
    const user = this.authService.createWorkspaceUser(token, req.body);
    res.status(201).json({ user });
  };

  public listWorkspaceUsers = (req: Request, res: Response): void => {
    const token = extractBearerToken(req);
    const users = this.authService.listWorkspaceUsers(token);
    res.status(200).json({ users });
  };
}

