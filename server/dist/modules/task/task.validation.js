"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTasksQuerySchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
// ──────────────────────────────────────────────
// Task validation schemas
//
// tasks are the core of the app so these schemas are
// a bit more complex than the others
// spent way too long debating wether "IN_PROGRESS" should
// have an underscore or not... it does. fight me.
// ──────────────────────────────────────────────
// valid enum values — defind here so we can reuse in mutliple schemas
const taskStatusValues = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const priorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"];
// creating a new task
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z
        .string({ required_error: "Task tittle is required" })
        .min(1, "Task title canot be empty — give it a name at least")
        .max(300, "Title is too long, this isnt an essay")
        .trim(),
    description: zod_1.z
        .string()
        .max(5000, "Description cant exceed 5000 chars — be consise")
        .optional()
        .nullable(),
    status: zod_1.z
        .enum(taskStatusValues, {
        errorMap: () => ({
            message: `Status must be one of: ${taskStatusValues.join(", ")}`,
        }),
    })
        .default("TODO"),
    priority: zod_1.z
        .enum(priorityValues, {
        errorMap: () => ({
            message: `Priorty must be one of: ${priorityValues.join(", ")}`,
        }),
    })
        .default("MEDIUM"),
    dueDate: zod_1.z
        .string()
        .datetime({ message: "Due date must be a valide ISO 8601 date string" })
        .optional()
        .nullable(),
    assignedToId: zod_1.z
        .string()
        .uuid("Assigned user ID must be a valide UUID")
        .optional()
        .nullable(),
    projectId: zod_1.z
        .string({ required_error: "Project ID is requried — tasks must belong to a project" })
        .uuid("Project ID must be a valide UUID"),
});
// updating a task — all feilds optional (partial update pattern)
// this way the frontend can send just { status: "DONE" } without
// having to resend the entier task object
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(1, "Title canot be empty")
        .max(300, "Title too long bruh")
        .trim()
        .optional(),
    description: zod_1.z.string().max(5000).optional().nullable(),
    status: zod_1.z
        .enum(taskStatusValues, {
        errorMap: () => ({
            message: `Status must be one of: ${taskStatusValues.join(", ")}`,
        }),
    })
        .optional(),
    priority: zod_1.z
        .enum(priorityValues, {
        errorMap: () => ({
            message: `Priority must be one of: ${priorityValues.join(", ")}`,
        }),
    })
        .optional(),
    dueDate: zod_1.z.string().datetime().optional().nullable(),
    assignedToId: zod_1.z.string().uuid().optional().nullable(),
    position: zod_1.z.number().int().min(0).optional(),
});
// query params for listing/filtring tasks
// this is a chonky schema becuase tasks have lots of filterable feilds
exports.listTasksQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.enum(taskStatusValues).optional(),
    priority: zod_1.z.enum(priorityValues).optional(),
    assignedToId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z
        .enum(["createdAt", "updatedAt", "dueDate", "priority", "position"])
        .default("position"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("asc"),
});
//# sourceMappingURL=task.validation.js.map