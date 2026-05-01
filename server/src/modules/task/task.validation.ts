import { z } from "zod";

// ──────────────────────────────────────────────
// Task validation schemas
//
// tasks are the core of the app so these schemas are
// a bit more complex than the others
// spent way too long debating wether "IN_PROGRESS" should
// have an underscore or not... it does. fight me.
// ──────────────────────────────────────────────

// valid enum values — defind here so we can reuse in mutliple schemas
const taskStatusValues = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
const priorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

// creating a new task
export const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Task tittle is required" })
    .min(1, "Task title canot be empty — give it a name at least")
    .max(300, "Title is too long, this isnt an essay")
    .trim(),

  description: z
    .string()
    .max(5000, "Description cant exceed 5000 chars — be consise")
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
        message: `Priorty must be one of: ${priorityValues.join(", ")}`,
      }),
    })
    .default("MEDIUM"),

  dueDate: z
    .string()
    .datetime({ message: "Due date must be a valide ISO 8601 date string" })
    .optional()
    .nullable(),

  assignedToId: z
    .string()
    .uuid("Assigned user ID must be a valide UUID")
    .optional()
    .nullable(),

  projectId: z
    .string({ required_error: "Project ID is requried — tasks must belong to a project" })
    .uuid("Project ID must be a valide UUID"),
});

// updating a task — all feilds optional (partial update pattern)
// this way the frontend can send just { status: "DONE" } without
// having to resend the entier task object
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title canot be empty")
    .max(300, "Title too long bruh")
    .trim()
    .optional(),

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

// query params for listing/filtring tasks
// this is a chonky schema becuase tasks have lots of filterable feilds
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

// type exports
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
