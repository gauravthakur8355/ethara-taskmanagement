import { api } from "@/lib/api";
import type { User } from "./auth.service";

// Task types and API service

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: Pick<User, "id" | "name" | "email"> & { avatar?: string | null } | null;
  createdBy: Pick<User, "id" | "name">;
  _count: { comments: number };
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedToId?: string;
  projectId: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedToId?: string | null;
  position?: number;
}

export interface TaskListParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const taskApi = {
  getByProject: async (projectId: string, params?: TaskListParams) => {
    const { data } = await api.get(`/projects/${projectId}/tasks`, { params });
    return data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: Task }> => {
    const { data } = await api.get(`/tasks/${id}`);
    return data;
  },

  create: async (payload: CreateTaskPayload) => {
    const { data } = await api.post("/tasks", payload);
    return data;
  },

  update: async (id: string, payload: UpdateTaskPayload) => {
    const { data } = await api.patch(`/tasks/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/tasks/${id}`);
    return data;
  },
};

// Display helpers

export const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  IN_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
};

export const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const priorityColors: Record<TaskPriority, string> = {
  LOW: "bg-zinc-100 text-zinc-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};
