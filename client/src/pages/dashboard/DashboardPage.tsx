import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardApi, type DashboardStats } from "@/services/dashboard.service";
import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// Dashboard Page — real stats from the API
//
// shows:
// 1. stat cards (total tasks, projects, completed, my tasks)
// 2. tasks by status breakdown
// 3. tasks per user leaderboard
// 4. overdue tasks list
//
// all data is scoped to projects the user belongs to
// ══════════════════════════════════════════════════════════════

const statusBarColors: Record<string, string> = {
  TODO: "bg-zinc-400",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-amber-500",
  DONE: "bg-emerald-500",
};

const statusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardApi.getStats();
        setStats(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-72 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
      <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        Welcome back, {user?.name?.split(" ")[0]} 👋
      </h1>
      <p className="text-sm text-zinc-500 mb-8">
        Here's what's happening across your projects.
      </p>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            title: "Total Projects",
            value: stats?.totalProjects ?? 0,
            icon: FolderKanban,
            color: "from-violet-500 to-purple-600",
          },
          {
            title: "Total Tasks",
            value: stats?.totalTasks ?? 0,
            icon: ListTodo,
            color: "from-blue-500 to-cyan-500",
          },
          {
            title: "Completed",
            value: stats?.completedTasks ?? 0,
            icon: CheckCircle2,
            color: "from-emerald-500 to-green-500",
          },
          {
            title: "My Open Tasks",
            value: stats?.myTasks ?? 0,
            icon: Clock,
            color: "from-amber-500 to-orange-500",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-500">{card.title}</p>
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}
              >
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Bottom Grid: Status Breakdown + Tasks Per User ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* tasks by status */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-zinc-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Tasks by Status
            </h3>
          </div>

          {stats && stats.totalTasks > 0 ? (
            <div className="space-y-4">
              {/* stacked bar */}
              <div className="flex h-3 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {(Object.entries(stats.tasksByStatus) as [string, number][]).map(
                  ([status, count]) => {
                    const pct = (count / stats.totalTasks) * 100;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={status}
                        className={`${statusBarColors[status]} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                        title={`${statusLabels[status]}: ${count}`}
                      />
                    );
                  }
                )}
              </div>

              {/* legend */}
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(stats.tasksByStatus) as [string, number][]).map(
                  ([status, count]) => (
                    <div key={status} className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${statusBarColors[status]}`}
                      />
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {statusLabels[status]}
                      </span>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 ml-auto">
                        {count}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-8">
              No tasks yet — create a project and add some tasks!
            </p>
          )}
        </div>

        {/* tasks per user */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Users className="h-4 w-4 text-zinc-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Tasks Per User
            </h3>
          </div>

          {stats && stats.tasksPerUser.length > 0 ? (
            <div className="space-y-3">
              {stats.tasksPerUser
                .sort((a, b) => b.taskCount - a.taskCount)
                .map((entry) => {
                  const maxCount = Math.max(
                    ...stats.tasksPerUser.map((u) => u.taskCount)
                  );
                  return (
                    <div key={entry.user.id} className="flex items-center gap-3">
                      <Avatar
                        name={entry.user.name}
                        src={entry.user.avatar}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {entry.user.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                              style={{
                                width: `${(entry.taskCount / maxCount) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-zinc-500 w-6 text-right">
                            {entry.taskCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-8">
              No task assignments yet
            </p>
          )}
        </div>
      </div>

      {/* ─── Overdue Tasks ─── */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Overdue Tasks
          </h3>
          {stats && stats.overdueTasks.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {stats.overdueTasks.length}
            </Badge>
          )}
        </div>

        {stats && stats.overdueTasks.length > 0 ? (
          <div className="space-y-2">
            {stats.overdueTasks.map((task) => (
              <Link
                key={task.id}
                to={`/projects/${task.project.id}`}
                className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-zinc-100 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {task.assignedTo && (
                    <Avatar
                      name={task.assignedTo.name}
                      src={task.assignedTo.avatar}
                      size="sm"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-zinc-400">{task.project.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="destructive" className="text-[10px]">
                    Due{" "}
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400 text-center py-6">
            🎉 No overdue tasks — you're on track!
          </p>
        )}
      </div>

      {/* quick action link */}
      <div className="mt-8">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-4 text-sm text-zinc-500 hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <FolderKanban className="h-4 w-4" />
          Go to Projects →
        </Link>
      </div>
    </div>
  );
}
