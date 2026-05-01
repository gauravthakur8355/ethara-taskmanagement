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

// ──────────────────────────────────────────────
// Auth Routes — /api/auth/*
//
// note the pattern here:
// 1. validate middleware runs first (rejects bad data early)
// 2. asyncHandler wraps the controller (catches async errors)
// 3. authenticate middleware on protected routes (JWT check)
//
// no buisness logic in the routes file — just wiring things togther
// think of it like a switchbord operator connecting calls
// ──────────────────────────────────────────────

const router = Router();

// public routes — no auth required
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

// protected routes — must be logged in
router.get(
  "/me",
  authenticate,
  asyncHandler(authController.getMe as any) // the "as any" here is becuase of the AuthenticatedRequest type mismatch... not ideal but works
);

export default router;
