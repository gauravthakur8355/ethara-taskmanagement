import { Router } from "express";
import { dashboardController } from "./dashboard.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/error.middleware";

// dashboard routes — just one GET endpoint
// returns aggregated stats for the current users workspace
const router = Router();

router.use(authenticate as any);

router.get(
  "/stats",
  asyncHandler(dashboardController.getStats as any)
);

export default router;
