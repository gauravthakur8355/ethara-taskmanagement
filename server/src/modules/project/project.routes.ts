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

const router = Router();

// All project routes require authentication
router.use(authenticate as any);

// Project CRUD
router.post("/", validate(createProjectSchema), asyncHandler(projectController.create as any));
router.get("/", validateQuery(listProjectsQuerySchema), asyncHandler(projectController.findAll as any));
router.get("/:id", asyncHandler(projectController.findById as any));
router.patch("/:id", validate(updateProjectSchema), asyncHandler(projectController.update as any));
router.delete("/:id", asyncHandler(projectController.delete as any));

// Member management
router.post("/:id/members", validate(addMemberSchema), asyncHandler(projectController.addMember as any));
router.delete("/:id/members/:userId", asyncHandler(projectController.removeMember as any));

export default router;
