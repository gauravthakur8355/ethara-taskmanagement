import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Check, ArrowRight } from "lucide-react";
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
// Kanban Board — Bento Grid Layout with status update support
//
// 2x2 responsive grid. admins see all tasks + create buttons,
// members see only their assigned tasks + status update buttons
// ══════════════════════════════════════════════════════════════

const columns: {
  status: TaskStatus;
  dotColor: string;
  gradient: string;
  bgTint: string;
}[] = [
  { status: "TODO", dotColor: "bg-zinc-500", gradient: "from-zinc-500/10 to-zinc-500/5", bgTint: "hover:bg-zinc-500/5" },
  { status: "IN_PROGRESS", dotColor: "bg-blue-500", gradient: "from-blue-500/10 to-blue-500/5", bgTint: "hover:bg-blue-500/5" },
  { status: "IN_REVIEW", dotColor: "bg-amber-500", gradient: "from-amber-500/10 to-amber-500/5", bgTint: "hover:bg-amber-500/5" },
  { status: "DONE", dotColor: "bg-emerald-500", gradient: "from-emerald-500/10 to-emerald-500/5", bgTint: "hover:bg-emerald-500/5" },
];

// the allowed next status transitions — keeps flow linear
const nextStatus: Record<TaskStatus, TaskStatus | null> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "IN_REVIEW",
  IN_REVIEW: "DONE",
  DONE: null, // already done
};

interface KanbanBoardProps {
  tasks: Task[];
  onCreateTask: (defaultStatus: TaskStatus) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  isAdmin: boolean;
}

export default function KanbanBoard({
  tasks,
  onCreateTask,
  onStatusChange,
  isAdmin,
}: KanbanBoardProps) {
  const [expandedCols, setExpandedCols] = useState<Set<TaskStatus>>(
    new Set(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
  );

  const toggleColumn = (status: TaskStatus) => {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {columns.map((col) => {
        const columnTasks = tasks
          .filter((t) => t.status === col.status)
          .sort((a, b) => a.position - b.position);
        const isExpanded = expandedCols.has(col.status);

        return (
          <div
            key={col.status}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
          >
            {/* Column Header */}
            <div
              className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r ${col.gradient} cursor-pointer select-none`}
              onClick={() => toggleColumn(col.status)}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor} ring-2 ring-white dark:ring-zinc-900`} />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {statusLabels[col.status]}
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-full font-mono">
                  {columnTasks.length}
                </Badge>
              </div>

              <div className="flex items-center gap-1">
                {/* only admins can create tasks */}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    onClick={(e) => { e.stopPropagation(); onCreateTask(col.status); }}
                    title={`Add task to ${statusLabels[col.status]}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                )}
              </div>
            </div>

            {/* Task List */}
            {isExpanded && (
              <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                {columnTasks.length === 0 ? (
                  isAdmin ? (
                    <button
                      onClick={() => onCreateTask(col.status)}
                      className="w-full py-6 flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-500 transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-xs">Add a task</span>
                    </button>
                  ) : (
                    <div className="py-6 text-center text-xs text-zinc-400">
                      No tasks assigned to you
                    </div>
                  )
                ) : (
                  columnTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      bgTint={col.bgTint}
                      onStatusChange={onStatusChange}
                      isAdmin={isAdmin}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Task Item with status update ───

function TaskItem({
  task,
  bgTint,
  onStatusChange,
  isAdmin,
}: {
  task: Task;
  bgTint: string;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  isAdmin: boolean;
}) {
  const [updating, setUpdating] = useState(false);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const next = nextStatus[task.status];

  const handleAdvanceStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!next || updating) return;
    setUpdating(true);
    try {
      await onStatusChange(task.id, next);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`group rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 p-3 ${bgTint} transition-all`}>
      {/* top: priority */}
      <div className="flex items-center justify-between mb-1.5">
        <Badge className={`${priorityColors[task.priority]} text-[10px] px-1.5 py-0`} variant="secondary">
          {priorityLabels[task.priority]}
        </Badge>

        {/* status advance button — visible on hover */}
        {next && (
          <button
            onClick={handleAdvanceStatus}
            disabled={updating}
            className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-105 disabled:opacity-50"
            title={`Move to ${statusLabels[next]}`}
          >
            {task.status === "IN_REVIEW" ? (
              <><Check className="h-3 w-3" /> Done</>
            ) : (
              <><ArrowRight className="h-3 w-3" /> {statusLabels[next]}</>
            )}
          </button>
        )}

        {task.status === "DONE" && (
          <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-0.5">
            <Check className="h-3 w-3" /> Completed
          </span>
        )}
      </div>

      {/* title */}
      <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
        {task.title}
      </h4>

      {/* description */}
      {task.description && (
        <p className="text-xs text-zinc-400 line-clamp-1 mt-1">{task.description}</p>
      )}

      {/* bottom: metadata + assignee */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              isOverdue
                ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 font-semibold"
                : "text-zinc-500 dark:text-zinc-400"
            }`}>
              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          {task._count.comments > 0 && (
            <span className="text-[10px] text-zinc-400">💬 {task._count.comments}</span>
          )}
        </div>

        {task.assignedTo ? (
          <Avatar name={task.assignedTo.name} src={task.assignedTo.avatar} size="sm" />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-600" title="Unassigned" />
        )}
      </div>
    </div>
  );
}
