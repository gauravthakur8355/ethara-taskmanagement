import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  FolderKanban,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// App Layout — collapsible sidebar + content area
//
// the sidebar collapses to a narrow icon-only strip (64px)
// and expands to the full 256px width. uses CSS transitions
// for smooth animations. tooltip-style labels appear on hover
// when collapsed so you still know what each icon does.
// ══════════════════════════════════════════════════════════════

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/projects", label: "Projects", icon: FolderKanban },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950">
      {/* ─── Sidebar ─── */}
      <aside
        className={`${
          collapsed ? "w-[68px]" : "w-64"
        } border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0 transition-all duration-300 ease-in-out`}
      >
        {/* logo + collapse toggle */}
        <div className="h-16 px-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
              <span className="text-white dark:text-zinc-900 font-bold text-sm">E</span>
            </div>
            {!collapsed && (
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg whitespace-nowrap">
                Ethara
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* nav links */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* user section at bottom */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
          {collapsed ? (
            /* collapsed state — just the avatar and a logout icon */
            <div className="flex flex-col items-center gap-2">
              <Avatar name={user?.name || "U"} size="md" src={user?.avatar} />
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            /* expanded state — full user info */
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
          )}
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
