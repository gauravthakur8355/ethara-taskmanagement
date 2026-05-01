import { Router } from "express";
import { taskController } from "./task.controller";
import { validate } from "../../middleware/validate.middleware";
import { validateQuery } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/error.middleware";
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} from "./task.validation";

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

const router = Router();

// all task routes need auth
router.use(authenticate as any);

// create a new task
router.post(
  "/",
  validate(createTaskSchema),
  asyncHandler(taskController.create as any)
);

// get a single task by ID
router.get(
  "/:id",
  asyncHandler(taskController.findById as any)
);

// update a task
router.patch(
  "/:id",
  validate(updateTaskSchema),
  asyncHandler(taskController.update as any)
);

// delete a task — destructve, handle with care
router.delete(
  "/:id",
  asyncHandler(taskController.delete as any)
);

export default router;
