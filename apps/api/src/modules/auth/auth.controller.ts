import type { Request, Response } from "express";
import type { AuthService } from "./auth.service.js";
import { extractBearerToken } from "./auth.middleware.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = async (req: Request, res: Response): Promise<void> => {
    const auth = await this.authService.registerOwner(req.body);
    res.status(201).json(auth);
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    const auth = await this.authService.login(req.body);
    res.status(200).json(auth);
  };

  public loginWithGoogle = async (req: Request, res: Response): Promise<void> => {
    const auth = await this.authService.loginWithGoogle(req.body);
    res.status(200).json(auth);
  };

  public me = async (req: Request, res: Response): Promise<void> => {
    const token = extractBearerToken(req);
    const auth = await this.authService.getAuthContext(token);
    res.status(200).json({
      user: auth.user,
      workspace: auth.workspace,
      sessionToken: auth.sessionToken,
    });
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    const token = extractBearerToken(req);
    await this.authService.logout(token);
    res.status(200).json({ ok: true });
  };

  public createWorkspaceUser = async (req: Request, res: Response): Promise<void> => {
    const token = extractBearerToken(req);
    const user = await this.authService.createWorkspaceUser(token, req.body);
    res.status(201).json({ user });
  };

  public listWorkspaceUsers = async (req: Request, res: Response): Promise<void> => {
    const token = extractBearerToken(req);
    const users = await this.authService.listWorkspaceUsers(token);
    res.status(200).json({ users });
  };
}
