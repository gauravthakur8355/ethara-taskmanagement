"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const auth_validation_1 = require("./auth.validation");
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
const router = (0, express_1.Router)();
// public routes — no auth required
router.post("/register", (0, validate_middleware_1.validate)(auth_validation_1.registerSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.authController.register));
router.post("/login", (0, validate_middleware_1.validate)(auth_validation_1.loginSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.authController.login));
router.post("/refresh", (0, validate_middleware_1.validate)(auth_validation_1.refreshTokenSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.authController.refreshToken));
// protected routes — must be logged in
router.get("/me", auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(auth_controller_1.authController.getMe) // the "as any" here is becuase of the AuthenticatedRequest type mismatch... not ideal but works
);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map