import { z } from "zod";

// Create project
export const createProjectSchema = z.object({
  name: z
    .string({ required_error: "Project name is required" })
    .min(2, "Project name must be at least 2 characters")
    .max(200, "Project name must be under 200 characters")
    .trim(),

  description: z
    .string()
    .max(2000, "Description must be under 2000 characters")
    .optional()
    .nullable(),
});

// Partial update
export const updateProjectSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  description: z.string().max(2000).optional().nullable(),
  isArchived: z.boolean().optional(),
});

// Add member to project
export const addMemberSchema = z.object({
  userId: z
    .string({ required_error: "User ID is required" })
    .uuid("Invalid user ID format"),

  role: z
    .enum(["ADMIN", "MEMBER"], {
      errorMap: () => ({ message: "Role must be either ADMIN or MEMBER" }),
    })
    .default("MEMBER"),
});

// Update member role
export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"], {
    errorMap: () => ({ message: "Role must be either ADMIN or MEMBER" }),
  }),
});

// Query params for project listing
export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  isArchived: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
