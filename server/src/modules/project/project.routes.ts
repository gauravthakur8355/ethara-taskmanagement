import { Router } from "express";
import { projectController } from "./project.controller";
import { validate } from "../../middleware/validate.middleware";
import { validateQuery } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/error.middleware";
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  listProjectsQuerySchema,
} from "./project.validation";

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

const router = Router();

// every project route requires auth — no exeptions
router.use(authenticate as any);

// ─── Project CRUD ───
router.post(
  "/",
  validate(createProjectSchema),
  asyncHandler(projectController.create as any)
);

router.get(
  "/",
  validateQuery(listProjectsQuerySchema),
  asyncHandler(projectController.findAll as any)
);

router.get(
  "/:id",
  asyncHandler(projectController.findById as any)
);

router.patch(
  "/:id",
  validate(updateProjectSchema),
  asyncHandler(projectController.update as any)
);

router.delete(
  "/:id",
  asyncHandler(projectController.delete as any)
);

// ─── Member Management ───
// nested under the project route becuase members belong to a project
router.post(
  "/:id/members",
  validate(addMemberSchema),
  asyncHandler(projectController.addMember as any)
);

router.delete(
  "/:id/members/:userId",
  asyncHandler(projectController.removeMember as any)
);

export default router;
