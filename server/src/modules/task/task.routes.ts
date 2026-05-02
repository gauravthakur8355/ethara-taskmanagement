import { Router } from "express";
import { taskController } from "./task.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/error.middleware";
import { createTaskSchema, updateTaskSchema } from "./task.validation";

const router = Router();

// All task routes require authentication
router.use(authenticate as any);

router.post("/", validate(createTaskSchema), asyncHandler(taskController.create as any));
router.get("/:id", asyncHandler(taskController.findById as any));
router.patch("/:id", validate(updateTaskSchema), asyncHandler(taskController.update as any));
router.delete("/:id", asyncHandler(taskController.delete as any));

export default router;
