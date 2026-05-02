import { Request, Response } from "express";
import { authService } from "./auth.service";
import { sendSuccess } from "../../shared/utils/response";
import { AuthenticatedRequest } from "../../shared/types";

/** Auth Controller — thin HTTP adapter. Extracts, delegates, responds. */
export const authController = {
  /** POST /api/auth/register */
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);
    sendSuccess(res, result, "Account created successfully! Welcome aboard", 201);
  },

  /** POST /api/auth/login */
  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    sendSuccess(res, result, "Logged in successfully");
  },

  /** POST /api/auth/refresh */
  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    sendSuccess(res, result, "Tokens refreshed successfully");
  },

  /** GET /api/auth/me — requires authentication */
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = await authService.getMe(req.user!.userId);
    sendSuccess(res, user, "User profile retrieved");
  },
};
