import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, Plus, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import KanbanBoard from "@/components/task/KanbanBoard";
import CreateTaskModal from "@/components/task/CreateTaskModal";
import InviteMemberModal from "@/components/project/InviteMemberModal";
import { projectApi, type ProjectDetail } from "@/services/project.service";
import { taskApi, type Task, type TaskStatus } from "@/services/task.service";

// ══════════════════════════════════════════════════════════════
// Project Detail Page — kanban board + team management
// ══════════════════════════════════════════════════════════════

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>("TODO");

  // determine if current user is a project admin
  const currentMembership = project?.members.find((m) => m.userId === user?.id);
  const isAdmin = currentMembership?.role === "ADMIN";

  const fetchProject = async () => {
    if (!projectId) return;
    try {
      const response = await projectApi.getById(projectId);
      setProject(response.data);
    } catch (err) {
      console.error("Failed to fetch project:", err);
    }
  };

  const fetchTasks = async () => {
    if (!projectId) return;
    try {
      const response = await taskApi.getByProject(projectId, { limit: 100 });
      setTasks(response.data || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchProject(), fetchTasks()]);
      setIsLoading(false);
    };
    init();
  }, [projectId]);

  const handleCreateTask = (status: TaskStatus) => {
    setDefaultTaskStatus(status);
    setShowCreateTask(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskApi.update(taskId, { status: newStatus });
      await fetchTasks(); // refresh board
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update task status");
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!projectId) return;
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await projectApi.removeMember(projectId, memberUserId);
      fetchProject(); // refresh members
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to remove member");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[300px] space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Project not found</p>
        <Link to="/projects" className="text-sm text-violet-600 hover:underline mt-2 inline-block">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/projects"
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-zinc-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {project.name}
              </h1>
              {isAdmin && (
                <Badge variant="info" className="text-[10px]">ADMIN</Badge>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-zinc-500 mt-0.5 max-w-xl truncate">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* member avatars — click to toggle panel */}
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showMembers
                ? "border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30"
                : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="flex -space-x-2">
              {project.members.slice(0, 3).map((member) => (
                <Avatar key={member.id} name={member.user.name} src={member.user.avatar} size="sm" />
              ))}
              {project.members.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-medium text-zinc-600 dark:text-zinc-400 ring-2 ring-white dark:ring-zinc-900">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
            <Users className="h-4 w-4 text-zinc-400" />
          </button>

          {/* add task — admin only */}
          {isAdmin && (
            <Button onClick={() => handleCreateTask("TODO")}>
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* ─── Members Panel ─── */}
      {showMembers && (
        <div className="mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-400" />
              Team Members
              <Badge variant="secondary" className="text-[10px] rounded-full">
                {project.members.length}
              </Badge>
            </h3>
            {isAdmin && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Invite Member
              </Button>
            )}
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={member.user.name} src={member.user.avatar} size="md" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {member.user.name}
                      {member.userId === user?.id && (
                        <span className="text-zinc-400 text-xs ml-1.5">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-400">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === "ADMIN" ? "info" : "secondary"}>
                    {member.role}
                  </Badge>
                  {/* admin can remove members (not themselves, not the creator) */}
                  {isAdmin && member.userId !== user?.id && member.userId !== project.createdBy.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => handleRemoveMember(member.userId)}
                      title="Remove member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Kanban Board ─── */}
      <KanbanBoard
        tasks={tasks}
        onCreateTask={handleCreateTask}
        onStatusChange={handleStatusChange}
        isAdmin={isAdmin}
      />

      {/* ─── Modals ─── */}
      <CreateTaskModal
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        projectId={projectId!}
        members={project.members}
        onSuccess={fetchTasks}
        defaultStatus={defaultTaskStatus}
      />

      <InviteMemberModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        projectId={projectId!}
        existingMembers={project.members}
        onSuccess={fetchProject}
      />
    </div>
  );
}
