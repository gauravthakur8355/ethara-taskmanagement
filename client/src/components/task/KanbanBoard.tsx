import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskCard from "@/components/task/TaskCard";
import type { Task, TaskStatus } from "@/services/task.service";
import { statusLabels } from "@/services/task.service";

// ──────────────────────────────────────────────
// Kanban Board — the main task visualization
//
// 4 columns: To Do → In Progress → In Review → Done
// each column shows tasks filtered by status
// the "+" button on each column lets you create a task
// with that status pre-selected (nice UX touch)
//
// drag-and-drop would be nice but thats a v2 feature
// for now, status changes happen via the task detail modal
// ──────────────────────────────────────────────

const columns: { status: TaskStatus; emoji: string; colorClass: string }[] = [
  { status: "TODO", emoji: "📋", colorClass: "border-t-zinc-400" },
  { status: "IN_PROGRESS", emoji: "🔄", colorClass: "border-t-blue-500" },
  { status: "IN_REVIEW", emoji: "👀", colorClass: "border-t-amber-500" },
  { status: "DONE", emoji: "✅", colorClass: "border-t-emerald-500" },
];

interface KanbanBoardProps {
  tasks: Task[];
  onCreateTask: (defaultStatus: TaskStatus) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  isAdmin: boolean;
}

export default function KanbanBoard({ tasks, onCreateTask, isAdmin }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[500px]">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className={`flex flex-col rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 border-t-4 ${col.colorClass}`}
          >
            {/* column header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span>{col.emoji}</span>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {statusLabels[col.status]}
                </span>
                <span className="text-xs text-zinc-400 bg-zinc-200 dark:bg-zinc-700 rounded-full px-2 py-0.5">
                  {columnTasks.length}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onCreateTask(col.status)}
                title={`Add task to ${statusLabels[col.status]}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* task list */}
            <div className="flex-1 px-3 pb-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)]">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                  <p className="text-xs">No tasks</p>
                </div>
              ) : (
                columnTasks
                  .sort((a, b) => a.position - b.position)
                  .map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
