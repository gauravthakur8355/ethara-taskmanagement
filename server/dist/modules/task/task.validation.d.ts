import { z } from "zod";
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]>>;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    assignedToId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    projectId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    title: string;
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    description?: string | null | undefined;
    dueDate?: string | null | undefined;
    assignedToId?: string | null | undefined;
}, {
    projectId: string;
    title: string;
    description?: string | null | undefined;
    status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dueDate?: string | null | undefined;
    assignedToId?: string | null | undefined;
}>;
export declare const updateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    assignedToId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    position: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description?: string | null | undefined;
    title?: string | undefined;
    status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dueDate?: string | null | undefined;
    position?: number | undefined;
    assignedToId?: string | null | undefined;
}, {
    description?: string | null | undefined;
    title?: string | undefined;
    status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dueDate?: string | null | undefined;
    position?: number | undefined;
    assignedToId?: string | null | undefined;
}>;
export declare const listTasksQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    assignedToId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "updatedAt", "dueDate", "priority", "position"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortBy: "createdAt" | "updatedAt" | "priority" | "dueDate" | "position";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assignedToId?: string | undefined;
}, {
    limit?: number | undefined;
    search?: string | undefined;
    status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assignedToId?: string | undefined;
    page?: number | undefined;
    sortBy?: "createdAt" | "updatedAt" | "priority" | "dueDate" | "position" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
//# sourceMappingURL=task.validation.d.ts.map