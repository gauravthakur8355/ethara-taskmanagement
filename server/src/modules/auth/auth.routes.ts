import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/error.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "./auth.validation";

const router = Router();

// Public routes
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(authController.register)
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(authController.login)
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  asyncHandler(authController.refreshToken)
);

// Protected routes
router.get(
  "/me",
  authenticate,
  asyncHandler(authController.getMe as any)
);

export default router;
