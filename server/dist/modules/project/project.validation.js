"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProjectsQuerySchema = exports.updateMemberRoleSchema = exports.addMemberSchema = exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
// ──────────────────────────────────────────────
// Project validation schemas
// these define what data is alowed in and what gets rejectd
// think of it as a bouncer at a club but for JSON payloads lol
// ──────────────────────────────────────────────
// creating a new project — name is requried, description is optional
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: "Project name is requried" })
        .min(2, "Project name must be atleast 2 characters")
        .max(200, "Project name is way too long my friend")
        .trim(),
    description: zod_1.z
        .string()
        .max(2000, "Descriptin cant exceed 2000 characters")
        .optional()
        .nullable(),
});
// updating a project — everything is optonal (partial update)
// only the feilds you send get updated, the rest stay the same
exports.updateProjectSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, "Project name must be atleast 2 characters")
        .max(200, "Comon thats way too long for a project name")
        .trim()
        .optional(),
    description: zod_1.z
        .string()
        .max(2000, "Description cant exceed 2000 characters")
        .optional()
        .nullable(),
    isArchived: zod_1.z.boolean().optional(),
});
// adding a member to a project
// you need their userId and what role to give them
exports.addMemberSchema = zod_1.z.object({
    userId: zod_1.z
        .string({ required_error: "User ID is requried" })
        .uuid("Thats not a valid user ID format"),
    role: zod_1.z
        .enum(["ADMIN", "MEMBER"], {
        errorMap: () => ({ message: "Role must be ether ADMIN or MEMBER" }),
    })
        .default("MEMBER"),
});
// changig a member's role within the project
exports.updateMemberRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(["ADMIN", "MEMBER"], {
        errorMap: () => ({ message: "Role must be ether ADMIN or MEMBER" }),
    }),
});
// query params for listing projects — with paginaton and filtering
exports.listProjectsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    search: zod_1.z.string().optional(),
    isArchived: zod_1.z
        .string()
        .transform((val) => val === "true") // query params come as strings, gotta coerce manualy
        .optional(),
});
//# sourceMappingURL=project.validation.js.map