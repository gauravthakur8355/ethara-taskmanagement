import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { FolderKanban, ListTodo, CheckCircle2 } from "lucide-react";

// dashboard — simplified since nav/logout is now in AppLayout sidebar
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        Welcome back, {user?.name?.split(" ")[0]} 👋
      </h1>
      <p className="text-sm text-zinc-500 mb-8">
        Here's what's happening with your projects today.
      </p>

      {/* stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { title: "Total Projects", value: "—", icon: FolderKanban, color: "from-violet-500 to-purple-600" },
          { title: "Active Tasks", value: "—", icon: ListTodo, color: "from-blue-500 to-cyan-500" },
          { title: "Completed", value: "—", icon: CheckCircle2, color: "from-emerald-500 to-green-500" },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-500">{card.title}</p>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{card.value}</p>
          </div>
        ))}
      </div>

      {/* quick action */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-4 text-sm text-zinc-500 hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-600 dark:hover:text-violet-400 transition-colors"
      >
        <FolderKanban className="h-4 w-4" />
        Go to Projects →
      </Link>
    </div>
  );
}
