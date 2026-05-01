import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { taskApi, type TaskStatus, type TaskPriority } from "@/services/task.service";
import type { ProjectMember } from "@/services/project.service";

// ──────────────────────────────────────────────
// Create Task Modal — adds a new task to a project
//
// features:
// - title + description fields
// - status selector (defaults to TODO)
// - priority selector (defaults to MEDIUM)
// - due date picker
// - assign to dropdown (shows project members)
//
// the assign dropdown only shows members of the current project
// becuase you cant assign tasks to people who arent in the project
// (backend enforces this too but better to prevent it in the UI)
// ──────────────────────────────────────────────

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  members: ProjectMember[];
  onSuccess: () => void;
  defaultStatus?: TaskStatus;
}

export default function CreateTaskModal({
  open,
  onOpenChange,
  projectId,
  members,
  onSuccess,
  defaultStatus = "TODO",
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await taskApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
        assignedToId: assignedToId || undefined,
        projectId,
      });

      // reset form
      setTitle("");
      setDescription("");
      setStatus(defaultStatus);
      setPriority("MEDIUM");
      setDueDate("");
      setAssignedToId("");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a task to this project. You can assign it to a team memeber.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {/* title */}
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                placeholder="e.g., Design login page"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* description */}
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description (optional)</Label>
              <Textarea
                id="task-desc"
                placeholder="Add more details about this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* status + priority row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectOption value="TODO">📋 To Do</SelectOption>
                  <SelectOption value="IN_PROGRESS">🔄 In Progress</SelectOption>
                  <SelectOption value="IN_REVIEW">👀 In Review</SelectOption>
                  <SelectOption value="DONE">✅ Done</SelectOption>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectOption value="LOW">🟢 Low</SelectOption>
                  <SelectOption value="MEDIUM">🔵 Medium</SelectOption>
                  <SelectOption value="HIGH">🟠 High</SelectOption>
                  <SelectOption value="URGENT">🔴 Urgent</SelectOption>
                </Select>
              </div>
            </div>

            {/* due date + assign row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-due">Due Date (optional)</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select
                  value={assignedToId}
                  onValueChange={setAssignedToId}
                  placeholder="Unassigned"
                >
                  <SelectOption value="">Unassigned</SelectOption>
                  {members.map((member) => (
                    <SelectOption key={member.user.id} value={member.user.id}>
                      {member.user.name} ({member.role})
                    </SelectOption>
                  ))}
                </Select>
              </div>
            </div>

            {/* selected assignee preview */}
            {assignedToId && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <Avatar
                  name={members.find((m) => m.user.id === assignedToId)?.user.name || ""}
                  size="sm"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Assigned to{" "}
                  <strong>{members.find((m) => m.user.id === assignedToId)?.user.name}</strong>
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                <><Plus className="h-4 w-4" /> Create Task</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
