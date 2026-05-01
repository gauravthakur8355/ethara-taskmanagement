"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("./task.controller");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const task_validation_1 = require("./task.validation");
// ──────────────────────────────────────────────
// Task Routes — /api/tasks/*
//
// all routes require authentiction
// project-level access is checked in the servce layer
//
// note: listing tasks by project is mounted at
// /api/projects/:projectId/tasks in app.ts
// but single-task CRUD is at /api/tasks/:id
// this is a common REST pattern — keeps URLs cleaner
// and avoids wierdly long nested routes
// ──────────────────────────────────────────────
const router = (0, express_1.Router)();
// all task routes need auth
router.use(auth_middleware_1.authenticate);
// create a new task
router.post("/", (0, validate_middleware_1.validate)(task_validation_1.createTaskSchema), (0, error_middleware_1.asyncHandler)(task_controller_1.taskController.create));
// get a single task by ID
router.get("/:id", (0, error_middleware_1.asyncHandler)(task_controller_1.taskController.findById));
// update a task
router.patch("/:id", (0, validate_middleware_1.validate)(task_validation_1.updateTaskSchema), (0, error_middleware_1.asyncHandler)(task_controller_1.taskController.update));
// delete a task — destructve, handle with care
router.delete("/:id", (0, error_middleware_1.asyncHandler)(task_controller_1.taskController.delete));
exports.default = router;
//# sourceMappingURL=task.routes.js.map