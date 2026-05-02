import { useState } from "react";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  Play,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import TaskDetailModal from "@/components/task/TaskDetailModal";
import type { Task, TaskStatus } from "@/services/task.service";
import {
  statusLabels,
  priorityColors,
  priorityLabels,
} from "@/services/task.service";

/* Kanban Board with strict RBAC transitions and task detail view */

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

/* Allowed transitions per role — mirrors backend state machine */
const MEMBER_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: [],
  DONE: [],
};

const ADMIN_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: ["DONE", "IN_PROGRESS"],
  DONE: [],
};

/* Transition action labels and icons */
const transitionConfig: Record<string, { label: string; icon: typeof Play; variant: "primary" | "approve" | "reject" }> = {
  "TODO→IN_PROGRESS":       { label: "Start",         icon: Play,       variant: "primary" },
  "IN_PROGRESS→IN_REVIEW":  { label: "Submit Review",  icon: Eye,        variant: "primary" },
  "IN_REVIEW→DONE":         { label: "Approve",        icon: Check,      variant: "approve" },
  "IN_REVIEW→IN_PROGRESS":  { label: "Reject",         icon: RotateCcw,  variant: "reject" },
};

const variantStyles = {
  primary: "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900",
  approve: "bg-emerald-600 text-white",
  reject:  "bg-red-500/90 text-white",
};

interface KanbanBoardProps {
  tasks: Task[];
  onCreateTask: (defaultStatus: TaskStatus) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask?: (taskId: string) => void;
  isAdmin: boolean;
}

export default function KanbanBoard({
  tasks,
  onCreateTask,
  onStatusChange,
  onDeleteTask,
  isAdmin,
}: KanbanBoardProps) {
  const [expandedCols, setExpandedCols] = useState<Set<TaskStatus>>(
    new Set(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const toggleColumn = (status: TaskStatus) => {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const transitionMap = isAdmin ? ADMIN_TRANSITIONS : MEMBER_TRANSITIONS;

  const handleStatusChangeAndRefresh = async (taskId: string, newStatus: TaskStatus) => {
    await onStatusChange(taskId, newStatus);
    // Update selected task if it was the one changed
    if (selectedTask?.id === taskId) {
      const updated = tasks.find((t) => t.id === taskId);
      if (updated) {
        setSelectedTask({ ...updated, status: newStatus });
      } else {
        setSelectedTask(null);
      }
    }
  };

  return (
    <>
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
                        No tasks here
                      </div>
                    )
                  ) : (
                    columnTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        bgTint={col.bgTint}
                        allowedNextStatuses={transitionMap[col.status]}
                        onStatusChange={onStatusChange}
                        onSelect={() => setSelectedTask(task)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={handleStatusChangeAndRefresh}
        onDelete={isAdmin ? onDeleteTask : undefined}
        isAdmin={isAdmin}
      />
    </>
  );
}

/* Task Item — clickable card with hover actions */
function TaskItem({
  task,
  bgTint,
  allowedNextStatuses,
  onStatusChange,
  onSelect,
}: {
  task: Task;
  bgTint: string;
  allowedNextStatuses: TaskStatus[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onSelect: () => void;
}) {
  const [updating, setUpdating] = useState<TaskStatus | null>(null);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  const handleTransition = async (e: React.MouseEvent, newStatus: TaskStatus) => {
    e.stopPropagation();
    if (updating) return;
    setUpdating(newStatus);
    try {
      await onStatusChange(task.id, newStatus);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 p-3 ${bgTint} transition-all cursor-pointer`}
    >
      {/* Top: priority + actions */}
      <div className="flex items-center justify-between mb-1.5">
        <Badge className={`${priorityColors[task.priority]} text-[10px] px-1.5 py-0`} variant="secondary">
          {priorityLabels[task.priority]}
        </Badge>

        {/* Hover actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          {allowedNextStatuses.map((nextStatus) => {
            const key = `${task.status}→${nextStatus}`;
            const config = transitionConfig[key];
            if (!config) return null;
            const Icon = config.icon;
            const isLoading = updating === nextStatus;
            return (
              <button
                key={nextStatus}
                onClick={(e) => handleTransition(e, nextStatus)}
                disabled={!!updating}
                className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${variantStyles[config.variant]} hover:scale-105 transition-all disabled:opacity-50`}
                title={config.label}
              >
                <Icon className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Completed */}
        {task.status === "DONE" && allowedNextStatuses.length === 0 && (
          <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-0.5">
            <Check className="h-3 w-3" /> Completed
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-zinc-400 line-clamp-1 mt-1">{task.description}</p>
      )}

      {/* Bottom: metadata + assignee */}
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
