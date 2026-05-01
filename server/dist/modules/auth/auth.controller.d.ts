import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../shared/types";
export declare const authController: {
    /**
     * POST /api/auth/register
     * creates a new user acount and returns tokens
     * body is alredy validated by the validate middleware at this point
     */
    register(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/auth/login
     * authentictes user and returns tokens
     */
    login(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/auth/refresh
     * refreshes the access token using a valide refresh token
     */
    refreshToken(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/auth/me
     * returns the curently authenticated users profile
     * requires: authenticate middleware
     */
    getMe(req: AuthenticatedRequest, res: Response): Promise<void>;
};
//# sourceMappingURL=auth.controller.d.ts.map