import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute, GuestRoute } from "@/components/auth/ProtectedRoute";

// ── Pages ──
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";

// react query client — configured for a good UX
// staleTime prevents unnecessary refetches on every navigation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes — data stays fresh for this long
      retry: 1, // only retry once on failure (dont spam the server)
      refetchOnWindowFocus: false, // dont refetch every time they alt-tab back
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* guest routes — redirect to dashboard if alredy logged in */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            {/* protected routes — redirect to login if not authenticatd */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* future routes go here:
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
              */}
            </Route>

            {/* catch-all — redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
