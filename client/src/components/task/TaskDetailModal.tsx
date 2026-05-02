import { useState } from "react";
import {
  X,
  Calendar,
  User,
  Flag,
  Clock,
  Play,
  Eye,
  Check,
  RotateCcw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { Task, TaskStatus } from "@/services/task.service";
import {
  statusLabels,
  statusColors,
  priorityLabels,
  priorityColors,
} from "@/services/task.service";

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

/* Action config for each transition */
const actionConfig: Record<
  string,
  { label: string; icon: typeof Play; color: string; hoverColor: string }
> = {
  "TODO→IN_PROGRESS": {
    label: "Start Working",
    icon: Play,
    color: "bg-blue-600 text-white",
    hoverColor: "hover:bg-blue-700",
  },
  "IN_PROGRESS→IN_REVIEW": {
    label: "Submit for Review",
    icon: Eye,
    color: "bg-amber-600 text-white",
    hoverColor: "hover:bg-amber-700",
  },
  "IN_REVIEW→DONE": {
    label: "Approve & Complete",
    icon: Check,
    color: "bg-emerald-600 text-white",
    hoverColor: "hover:bg-emerald-700",
  },
  "IN_REVIEW→IN_PROGRESS": {
    label: "Reject — Needs Work",
    icon: RotateCcw,
    color: "bg-red-600 text-white",
    hoverColor: "hover:bg-red-700",
  },
};

/* Status progress mapping */
const statusProgress: Record<TaskStatus, number> = {
  TODO: 0,
  IN_PROGRESS: 33,
  IN_REVIEW: 66,
  DONE: 100,
};

const statusStepColor: Record<TaskStatus, string> = {
  TODO: "bg-zinc-400",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-amber-500",
  DONE: "bg-emerald-500",
};

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
  isAdmin: boolean;
}

export default function TaskDetailModal({
  task,
  open,
  onClose,
  onStatusChange,
  onDelete,
  isAdmin,
}: TaskDetailModalProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  if (!open || !task) return null;

  const transitions = isAdmin ? ADMIN_TRANSITIONS : MEMBER_TRANSITIONS;
  const allowedNext = transitions[task.status];
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const progress = statusProgress[task.status];

  const handleTransition = async (newStatus: TaskStatus) => {
    if (updating) return;
    setUpdating(newStatus);
    try {
      await onStatusChange(task.id, newStatus);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (!confirm("Permanently delete this task? This cannot be undone.")) return;
    onDelete(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header — status + priority badges */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
            <Badge className={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>
            {isOverdue && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>

          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 pr-8 leading-snug">
            {task.title}
          </h2>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${statusStepColor[task.status]}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex items-center justify-between mt-2">
            {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as TaskStatus[]).map(
              (s) => {
                const stepIndex = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].indexOf(s);
                const currentIndex = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].indexOf(task.status);
                const isComplete = stepIndex <= currentIndex;
                return (
                  <div key={s} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-3 h-3 rounded-full border-2 transition-colors ${
                        isComplete
                          ? `${statusStepColor[s]} border-transparent`
                          : "bg-transparent border-zinc-300 dark:border-zinc-600"
                      }`}
                    />
                    <span className={`text-[10px] ${isComplete ? "text-zinc-700 dark:text-zinc-300 font-medium" : "text-zinc-400"}`}>
                      {statusLabels[s]}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="px-6 py-4 space-y-4">
          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Description
              </h4>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Assigned To */}
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                <User className="h-3.5 w-3.5" />
                Assigned To
              </div>
              {task.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Avatar
                    name={task.assignedTo.name}
                    src={task.assignedTo.avatar}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {task.assignedTo.name}
                    </p>
                    <p className="text-[11px] text-zinc-400">{task.assignedTo.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">Unassigned</p>
              )}
            </div>

            {/* Created By */}
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                <User className="h-3.5 w-3.5" />
                Created By
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {task.createdBy.name}
              </p>
            </div>

            {/* Priority */}
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                <Flag className="h-3.5 w-3.5" />
                Priority
              </div>
              <Badge className={priorityColors[task.priority]}>
                {priorityLabels[task.priority]}
              </Badge>
            </div>

            {/* Due Date */}
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                <Calendar className="h-3.5 w-3.5" />
                Due Date
              </div>
              {task.dueDate ? (
                <p
                  className={`text-sm font-medium ${
                    isOverdue
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 italic">No deadline</p>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-[11px] text-zinc-400 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created {new Date(task.createdAt).toLocaleDateString()}
            </span>
            <span>
              Updated {new Date(task.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
          {allowedNext.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium mb-2">
                {isAdmin ? "Admin Actions" : "Available Actions"}
              </p>
              <div className="flex flex-wrap gap-2">
                {allowedNext.map((nextStatus) => {
                  const key = `${task.status}→${nextStatus}`;
                  const config = actionConfig[key];
                  if (!config) return null;
                  const Icon = config.icon;
                  const isLoading = updating === nextStatus;

                  return (
                    <Button
                      key={nextStatus}
                      onClick={() => handleTransition(nextStatus)}
                      disabled={!!updating}
                      className={`gap-1.5 ${config.color} ${config.hoverColor}`}
                    >
                      <Icon className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 text-center py-1">
              {task.status === "DONE"
                ? "✅ This task has been completed"
                : isAdmin
                  ? "No actions available for this status"
                  : "Waiting for admin review"}
            </p>
          )}

          {/* Delete — admin only */}
          {isAdmin && onDelete && (
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete this task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
