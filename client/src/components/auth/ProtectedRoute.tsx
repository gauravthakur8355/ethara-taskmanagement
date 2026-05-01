import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// ──────────────────────────────────────────────
// Protected Route — redirects to login if not authenticated
// wraps any route that requires authentication
//
// usage in router: <Route element={<ProtectedRoute />}>
//                    <Route path="/dashboard" element={<Dashboard />} />
//                  </Route>
// ──────────────────────────────────────────────

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // while checking auth state, show a loading spinner
  // (this only happens on initial page load — not on every navigation)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  // not authenticated — redirect to login but remember where they wanted to go
  // so we can send them back after they log in (good UX)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // authenticated — render the child routes
  return <Outlet />;
}

// ──────────────────────────────────────────────
// Guest Route — redirects to dashboard if ALREADY authenticated
// prevents logged-in users from seeing login/signup pages
// ──────────────────────────────────────────────

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  // already logged in — go to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
