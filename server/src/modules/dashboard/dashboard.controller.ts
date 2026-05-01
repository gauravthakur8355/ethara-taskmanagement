import { Response } from "express";
import { dashboardService } from "./dashboard.service";
import { sendSuccess } from "../../shared/utils/response";
import { AuthenticatedRequest } from "../../shared/types";

// dashboard controller — just one endpoint for now
// returns all the stats the frontend needs for the dashbaord page
export const dashboardController = {
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const stats = await dashboardService.getStats(req.user!.userId);
    sendSuccess(res, stats, "Dashboard stats retreived");
  },
};
