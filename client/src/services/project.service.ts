import { api } from "@/lib/api";
import type { User } from "./auth.service";

// ──────────────────────────────────────────────
// Project API service — all project-related API calls
// keeps API layer seprate from componets
// ──────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: Pick<User, "id" | "name" | "email">;
  _count: { tasks: number; members?: number };
}

export interface ProjectMember {
  id: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  userId: string;
  user: Pick<User, "id" | "name" | "email"> & { avatar?: string | null };
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface AddMemberPayload {
  userId: string;
  role?: "ADMIN" | "MEMBER";
}

export const projectApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const { data } = await api.get("/projects", { params });
    return data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: ProjectDetail }> => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },

  create: async (payload: CreateProjectPayload) => {
    const { data } = await api.post("/projects", payload);
    return data;
  },

  update: async (id: string, payload: Partial<CreateProjectPayload & { isArchived: boolean }>) => {
    const { data } = await api.patch(`/projects/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  },

  addMember: async (projectId: string, payload: AddMemberPayload) => {
    const { data } = await api.post(`/projects/${projectId}/members`, payload);
    return data;
  },

  removeMember: async (projectId: string, userId: string) => {
    const { data } = await api.delete(`/projects/${projectId}/members/${userId}`);
    return data;
  },
};
