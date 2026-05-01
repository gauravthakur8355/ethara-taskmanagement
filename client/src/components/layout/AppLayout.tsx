import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, FolderKanban, LogOut } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// App Layout — shared shell for all authenticated pages
// includes sidebar navigation and top bar with user info
//
// the sidebar is collapsible on mobile but honestly for v1
// im just going with a fixed sidebar. we can add the mobile
// hamburger menu later if product insits on it
// ══════════════════════════════════════════════════════════════

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/projects", label: "Projects", icon: FolderKanban },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950">
      {/* ─── Sidebar ─── */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0">
        {/* logo */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-zinc-900 font-bold text-sm">E</span>
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">Ethara</span>
        </div>

        {/* nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* user section at bottom */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name || "U"} size="md" src={user?.avatar} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {user?.name}
              </p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {user?.role}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
