import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  FolderKanban,
  Home,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/projects", label: "Projects", icon: FolderKanban },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <>
      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 px-3 py-2.5 ${
                active
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
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
          <Button variant="ghost" size="icon" onClick={logout} className="shrink-0" title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-col shrink-0">
        {/* Logo */}
        <Link to={"/"}>
        <div className="h-16 px-3 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
            <span className="text-white dark:text-zinc-900 font-bold text-sm">E</span>
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">
            Ethara
          </span>
        </div>
        </Link>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-50 shadow-xl">
            {/* Mobile logo + close */}
            <div className="h-16 px-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
                  <span className="text-white dark:text-zinc-900 font-bold text-sm">E</span>
                </div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">
                  Ethara
                </span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar — shown only on mobile */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="font-semibold text-zinc-900 dark:text-zinc-100">Ethara</Link>
          </div>
          <Avatar name={user?.name || "U"} size="sm" src={user?.avatar} />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}