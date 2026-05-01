import { z } from "zod";
export declare const createProjectSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | null | undefined;
}, {
    name: string;
    description?: string | null | undefined;
}>;
export declare const updateProjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isArchived: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | null | undefined;
    isArchived?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | null | undefined;
    isArchived?: boolean | undefined;
}>;
export declare const addMemberSchema: z.ZodObject<{
    userId: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["ADMIN", "MEMBER"]>>;
}, "strip", z.ZodTypeAny, {
    role: "ADMIN" | "MEMBER";
    userId: string;
}, {
    userId: string;
    role?: "ADMIN" | "MEMBER" | undefined;
}>;
export declare const updateMemberRoleSchema: z.ZodObject<{
    role: z.ZodEnum<["ADMIN", "MEMBER"]>;
}, "strip", z.ZodTypeAny, {
    role: "ADMIN" | "MEMBER";
}, {
    role: "ADMIN" | "MEMBER";
}>;
export declare const listProjectsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    isArchived: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    search?: string | undefined;
    isArchived?: boolean | undefined;
}, {
    limit?: number | undefined;
    search?: string | undefined;
    isArchived?: string | undefined;
    page?: number | undefined;
}>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
//# sourceMappingURL=project.validation.d.ts.map