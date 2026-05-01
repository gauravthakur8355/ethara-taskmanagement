import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Settings, Users, Plus, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import KanbanBoard from "@/components/task/KanbanBoard";
import CreateTaskModal from "@/components/task/CreateTaskModal";
import { projectApi, type ProjectDetail } from "@/services/project.service";
import { taskApi, type Task, type TaskStatus } from "@/services/task.service";

// ══════════════════════════════════════════════════════════════
// Project Detail Page — kanban board + project settings
//
// this is the main workspace for a project
// shows the kanban board with all tasks
// admin-only features:
// - member managment panel
// - project settings (archive, delete)
//
// role-based UI: admins see settings/member buttons,
// regular members see a read-only member list
// ══════════════════════════════════════════════════════════════

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
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

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
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
    <div className="p-8">
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
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {project.name}
              </h1>
              {isAdmin && (
                <Badge variant="info" className="text-[10px]">ADMIN</Badge>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-zinc-500 mt-0.5">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* member avatars stack */}
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex -space-x-2">
              {project.members.slice(0, 4).map((member) => (
                <Avatar
                  key={member.id}
                  name={member.user.name}
                  src={member.user.avatar}
                  size="sm"
                />
              ))}
              {project.members.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-medium text-zinc-600 dark:text-zinc-400 ring-2 ring-white dark:ring-zinc-900">
                  +{project.members.length - 4}
                </div>
              )}
            </div>
            <Users className="h-4 w-4 text-zinc-400" />
          </button>

          <Button onClick={() => handleCreateTask("TODO")}>
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* members panel — toggleable */}
      {showMembers && (
        <div className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Team Members ({project.members.length})
            </h3>
            {isAdmin && (
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Invite Member
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={member.user.name} src={member.user.avatar} size="md" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {member.user.name}
                      {member.userId === user?.id && (
                        <span className="text-zinc-400 ml-1">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-400">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === "ADMIN" ? "info" : "secondary"}>
                    {member.role}
                  </Badge>
                  {/* admin can remove members (but not themselves or the creator) */}
                  {isAdmin && member.userId !== user?.userId && member.userId !== project.createdBy.id && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* kanban board */}
      <KanbanBoard
        tasks={tasks}
        onCreateTask={handleCreateTask}
        isAdmin={isAdmin}
      />

      {/* create task modal */}
      <CreateTaskModal
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        projectId={projectId!}
        members={project.members}
        onSuccess={fetchTasks}
        defaultStatus={defaultTaskStatus}
      />
    </div>
  );
}
