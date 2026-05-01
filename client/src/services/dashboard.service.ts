import { api } from "@/lib/api";

// ──────────────────────────────────────────────
// Dashboard API service — fetches aggregated stats
// ──────────────────────────────────────────────

export interface TasksByStatus {
  TODO: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  DONE: number;
}

export interface TaskPerUser {
  user: { id: string; name: string; email: string; avatar?: string | null };
  taskCount: number;
}

export interface OverdueTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
  assignedTo: { id: string; name: string; avatar?: string | null } | null;
  project: { id: string; name: string };
}

export interface DashboardStats {
  totalTasks: number;
  totalProjects: number;
  tasksByStatus: TasksByStatus;
  tasksPerUser: TaskPerUser[];
  overdueTasks: OverdueTask[];
  myTasks: number;
  completedTasks: number;
}

export const dashboardApi = {
  getStats: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    const { data } = await api.get("/dashboard/stats");
    return data;
  },
};
