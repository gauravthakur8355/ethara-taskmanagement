import { z } from "zod";

const taskStatusValues = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
const priorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

// Create task schema
export const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Task title is required" })
    .min(1, "Task title cannot be empty")
    .max(300, "Title must be under 300 characters")
    .trim(),

  description: z
    .string()
    .max(5000, "Description must be under 5000 characters")
    .optional()
    .nullable(),

  status: z
    .enum(taskStatusValues, {
      errorMap: () => ({
        message: `Status must be one of: ${taskStatusValues.join(", ")}`,
      }),
    })
    .default("TODO"),

  priority: z
    .enum(priorityValues, {
      errorMap: () => ({
        message: `Priority must be one of: ${priorityValues.join(", ")}`,
      }),
    })
    .default("MEDIUM"),

  dueDate: z
    .string()
    .datetime({ message: "Due date must be a valid ISO 8601 date string" })
    .optional()
    .nullable(),

  assignedToId: z
    .string()
    .uuid("Assigned user ID must be a valid UUID")
    .optional()
    .nullable(),

  projectId: z
    .string({ required_error: "Project ID is required" })
    .uuid("Project ID must be a valid UUID"),
});

// Partial update schema
export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(300).trim().optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z
    .enum(taskStatusValues, {
      errorMap: () => ({
        message: `Status must be one of: ${taskStatusValues.join(", ")}`,
      }),
    })
    .optional(),
  priority: z
    .enum(priorityValues, {
      errorMap: () => ({
        message: `Priority must be one of: ${priorityValues.join(", ")}`,
      }),
    })
    .optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  position: z.number().int().min(0).optional(),
});

// Query params for task listing
export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(priorityValues).optional(),
  assignedToId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "dueDate", "priority", "position"])
    .default("position"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
