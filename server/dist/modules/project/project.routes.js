"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_controller_1 = require("./project.controller");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const validate_middleware_2 = require("../../middleware/validate.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const project_validation_1 = require("./project.validation");
// ──────────────────────────────────────────────
// Project Routes — /api/projects/*
//
// ALL routes here require authenticaton (the router.use at the top)
// project-level permisions (admin vs member) are handled in the service layer
//
// route hierarcy:
//   /api/projects           — CRUD on projects
//   /api/projects/:id/members  — manage project memebers
// ──────────────────────────────────────────────
const router = (0, express_1.Router)();
// every project route requires auth — no exeptions
router.use(auth_middleware_1.authenticate);
// ─── Project CRUD ───
router.post("/", (0, validate_middleware_1.validate)(project_validation_1.createProjectSchema), (0, error_middleware_1.asyncHandler)(project_controller_1.projectController.create));
router.get("/", (0, validate_middleware_2.validateQuery)(project_validation_1.listProjectsQuerySchema), (0, error_middleware_1.asyncHandler)(project_controller_1.projectController.findAll));
router.get("/:id", (0, error_middleware_1.asyncHandler)(project_controller_1.projectController.findById));
router.patch("/:id", (0, validate_middleware_1.validate)(project_validation_1.updateProjectSchema), (0, error_middleware_1.asyncHandler)(project_controller_1.projectController.update));
router.delete("/:id", (0, error_middleware_1.asyncHandler)(project_controller_1.projectController.delete));
// ─── Member Management ───
// nested under the project route becuase members belong to a project
router.post("/:id/members", (0, validate_middleware_1.validate)(project_validation_1.addMemberSchema), (0, error_middleware_1.asyncHandler)(project_controller_1.projectController.addMember));
router.delete("/:id/members/:userId", (0, error_middleware_1.asyncHandler)(project_controller_1.projectController.removeMember));
exports.default = router;
//# sourceMappingURL=project.routes.js.map