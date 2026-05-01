import { z } from "zod";

// ──────────────────────────────────────────────
// Project validation schemas
// these define what data is alowed in and what gets rejectd
// think of it as a bouncer at a club but for JSON payloads lol
// ──────────────────────────────────────────────

// creating a new project — name is requried, description is optional
export const createProjectSchema = z.object({
  name: z
    .string({ required_error: "Project name is requried" })
    .min(2, "Project name must be atleast 2 characters")
    .max(200, "Project name is way too long my friend")
    .trim(),

  description: z
    .string()
    .max(2000, "Descriptin cant exceed 2000 characters")
    .optional()
    .nullable(),
});

// updating a project — everything is optonal (partial update)
// only the feilds you send get updated, the rest stay the same
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be atleast 2 characters")
    .max(200, "Comon thats way too long for a project name")
    .trim()
    .optional(),

  description: z
    .string()
    .max(2000, "Description cant exceed 2000 characters")
    .optional()
    .nullable(),

  isArchived: z.boolean().optional(),
});

// adding a member to a project
// you need their userId and what role to give them
export const addMemberSchema = z.object({
  userId: z
    .string({ required_error: "User ID is requried" })
    .uuid("Thats not a valid user ID format"),

  role: z
    .enum(["ADMIN", "MEMBER"], {
      errorMap: () => ({ message: "Role must be ether ADMIN or MEMBER" }),
    })
    .default("MEMBER"),
});

// changig a member's role within the project
export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"], {
    errorMap: () => ({ message: "Role must be ether ADMIN or MEMBER" }),
  }),
});

// query params for listing projects — with paginaton and filtering
export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  isArchived: z
    .string()
    .transform((val) => val === "true") // query params come as strings, gotta coerce manualy
    .optional(),
});

// type exports — infered from schemas so there always in sync
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
