import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/services/task.service";
import { priorityColors, priorityLabels } from "@/services/task.service";
import { Calendar, MessageSquare, GripVertical } from "lucide-react";

// ──────────────────────────────────────────────
// Task Card — single task in the kanban column
//
// shows: title, priority badge, assignee avatar, due date, comment count
// clicking it could open a detail view (future feature)
// the grip icon is for drag-and-drop (not implemented yet but the UI is ready)
// ──────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: string) => void;
}

export default function TaskCard({ task }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer">
      {/* top row: grip + priority */}
      <div className="flex items-center justify-between mb-2.5">
        <GripVertical className="h-4 w-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
        <Badge className={priorityColors[task.priority]} variant="secondary">
          {priorityLabels[task.priority]}
        </Badge>
      </div>

      {/* title */}
      <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* description preview */}
      {task.description && (
        <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* bottom row: metadata */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          {/* due date */}
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : ""}`}>
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}

          {/* comment count */}
          {task._count.comments > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </span>
          )}
        </div>

        {/* assignee avatar */}
        {task.assignedTo && (
          <Avatar
            name={task.assignedTo.name}
            src={task.assignedTo.avatar}
            size="sm"
          />
        )}
      </div>
    </div>
  );
}
