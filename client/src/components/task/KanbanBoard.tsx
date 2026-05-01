import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { Task, TaskStatus } from "@/services/task.service";
import {
  statusLabels,
  priorityColors,
  priorityLabels,
} from "@/services/task.service";

// ══════════════════════════════════════════════════════════════
// Kanban Board — redesigned with a horizontal scrollable layout
//
// each column is a card-style container with a colored indicator,
// task count, and vertical list of task items. the whole board
// scrolls horizontaly when columns overflow the viewport.
//
// task cards are compact with priority dot, title, optional
// description, metadata (due date, comments), and assignee avatar.
// ══════════════════════════════════════════════════════════════

const columns: {
  status: TaskStatus;
  emoji: string;
  accentColor: string;
  dotColor: string;
}[] = [
  { status: "TODO", emoji: "📋", accentColor: "border-l-zinc-400", dotColor: "bg-zinc-400" },
  { status: "IN_PROGRESS", emoji: "⚡", accentColor: "border-l-blue-500", dotColor: "bg-blue-500" },
  { status: "IN_REVIEW", emoji: "👁️", accentColor: "border-l-amber-500", dotColor: "bg-amber-500" },
  { status: "DONE", emoji: "✅", accentColor: "border-l-emerald-500", dotColor: "bg-emerald-500" },
];

interface KanbanBoardProps {
  tasks: Task[];
  onCreateTask: (defaultStatus: TaskStatus) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  isAdmin: boolean;
}

export default function KanbanBoard({
  tasks,
  onCreateTask,
}: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
      {columns.map((col) => {
        const columnTasks = tasks
          .filter((t) => t.status === col.status)
          .sort((a, b) => a.position - b.position);

        return (
          <div
            key={col.status}
            className={`flex flex-col min-w-[300px] w-[300px] shrink-0 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 border-l-4 ${col.accentColor} shadow-sm snap-start`}
          >
            {/* column header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {statusLabels[col.status]}
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-full">
                  {columnTasks.length}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                onClick={() => onCreateTask(col.status)}
                title={`Add task to ${statusLabels[col.status]}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* task list */}
            <div className="flex-1 p-2.5 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
              {columnTasks.length === 0 ? (
                <button
                  onClick={() => onCreateTask(col.status)}
                  className="w-full py-8 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-500 transition-colors cursor-pointer"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-xs">Add a task</span>
                </button>
              ) : (
                columnTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Task Item (inline component) ───
// compact card with all relevant info at a glance

function TaskItem({ task }: { task: Task }) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE";

  return (
    <div className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all cursor-pointer">
      {/* top row: priority + menu */}
      <div className="flex items-center justify-between mb-2">
        <Badge
          className={`${priorityColors[task.priority]} text-[10px] px-1.5 py-0`}
          variant="secondary"
        >
          {priorityLabels[task.priority]}
        </Badge>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* title */}
      <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-2 leading-snug">
        {task.title}
      </h4>

      {/* description preview */}
      {task.description && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* bottom row: metadata + assignee */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
        <div className="flex items-center gap-2">
          {/* due date */}
          {task.dueDate && (
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                isOverdue
                  ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 font-medium"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
              }`}
            >
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}

          {/* comment count */}
          {task._count.comments > 0 && (
            <span className="text-[11px] text-zinc-400 flex items-center gap-0.5">
              💬 {task._count.comments}
            </span>
          )}
        </div>

        {/* assignee */}
        {task.assignedTo ? (
          <Avatar
            name={task.assignedTo.name}
            src={task.assignedTo.avatar}
            size="sm"
          />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-600" title="Unassigned" />
        )}
      </div>
    </div>
  );
}
