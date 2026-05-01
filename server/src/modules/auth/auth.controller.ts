import { Request, Response } from "express";
import { authService } from "./auth.service";
import { sendSuccess } from "../../shared/utils/response";
import { AuthenticatedRequest } from "../../shared/types";

// ══════════════════════════════════════════════════════════════
// Auth Controller — the HTTP adapter layer
//
// these are intentionaly thin — they only do three things:
// 1. extract data from the reqest
// 2. call the approriate service method
// 3. send the respone
//
// NO buisness logic here. if you find yourself writing an if-else
// in a controller, stop and move that logic to the service layer.
// i cannot stress this enoguh — fat controllers are the root of all evil
// ══════════════════════════════════════════════════════════════

export const authController = {
  /**
   * POST /api/auth/register
   * creates a new user acount and returns tokens
   * body is alredy validated by the validate middleware at this point
   */
  async register(req: Request, res: Response): Promise<void> {
    // req.body is clean and typed thanks to Zod validaton middleware
    const result = await authService.register(req.body);

    sendSuccess(res, result, "Account created succesfully! Welcome aboard 🎉", 201);
  },

  /**
   * POST /api/auth/login
   * authentictes user and returns tokens
   */
  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);

    sendSuccess(res, result, "Logged in succesfully");
  },

  /**
   * POST /api/auth/refresh
   * refreshes the access token using a valide refresh token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);

    sendSuccess(res, result, "Tokens refreshd successfully");
  },

  /**
   * GET /api/auth/me
   * returns the curently authenticated users profile
   * requires: authenticate middleware
   */
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    // req.user is set by the authenticate midleware
    // if we get here, we know its definded (middleware guarentees it)
    const user = await authService.getMe(req.user!.userId);

    sendSuccess(res, user, "User profle retrieved");
  },
};
