import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, FolderKanban, Users, ListTodo, Search, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import CreateProjectModal from "@/components/project/CreateProjectModal";
import { projectApi, type Project } from "@/services/project.service";

// ══════════════════════════════════════════════════════════════
// Projects Page — lists all projects the user belongs to
//
// features:
// - project cards in a grid layout
// - search/filter
// - create new project modal
// - shows task count and member count per project
// - click a card to go to the kanban board
//
// role-based: everyone can see and create projects
// admin-specfic actions are inside the project detail page
// ══════════════════════════════════════════════════════════════

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await projectApi.getAll({
        search: search || undefined,
        limit: 50,
      });
      setProjects(response.data || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="p-8">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Projects</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your team workspaces and track progress
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* search bar */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* project grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <Skeleton className="h-5 w-40 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            {search ? "No projects found" : "No projects yet"}
          </h3>
          <p className="text-sm text-zinc-500 mb-6">
            {search
              ? "Try adjusting your search terms"
              : "Create your first project to get started"}
          </p>
          {!search && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {project.name.charAt(0).toUpperCase()}
                </div>
                {project.isArchived && (
                  <Badge variant="secondary" className="gap-1">
                    <Archive className="h-3 w-3" />
                    Archived
                  </Badge>
                )}
              </div>

              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {project.name}
              </h3>

              {project.description && (
                <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
                  {project.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-zinc-400 mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="flex items-center gap-1">
                  <ListTodo className="h-3.5 w-3.5" />
                  {project._count.tasks} tasks
                </span>
                {project._count.members !== undefined && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {project._count.members} members
                  </span>
                )}
              </div>

              {/* created by */}
              <div className="flex items-center gap-2 mt-3">
                <Avatar name={project.createdBy.name} size="sm" />
                <span className="text-xs text-zinc-400">{project.createdBy.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* create project modal */}
      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
