import type { ReactElement } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import { useAuth } from "./auth/AuthProvider";
import LoginPage from "./auth/LoginPage";
import AuthCallback from "./auth/AuthCallback";
import Dashboard from "./pages/Dashboard";
import KPIEntry from "./pages/KPIEntry";
import CoachPage from "./pages/CoachPage";
import EvidencePage from "./pages/EvidencePage";
import ProfilePage from "./pages/ProfilePage";
import UnitsPage from "./pages/UnitsPage";
import UnitDetail from "./pages/UnitDetail";
import BusinessPage from "./pages/BusinessPage";
import CompletionPage from "./pages/CompletionPage";
import AdminPage from "./pages/AdminPage";
import AdminEnrolPage from "./pages/AdminEnrolPage";
import AdminLearnerDetailPage from "./pages/AdminLearnerDetailPage";

function FullScreenLoader() {
  return (
    <div className="flex min-h-full items-center justify-center text-brand-muted">
      <span className="text-brand-accent" aria-hidden>
        ✦
      </span>
    </div>
  );
}

// Gate the authenticated app. While the session is resolving we hold on a
// loader to avoid a flash of the login page for already-signed-in users.
function RequireAuth({ children }: { children: ReactElement }) {
  const { session, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

// Gate the Admin section to tutor/admin roles. Learners are bounced home.
// `profile` is null while it loads, so hold on the loader until we know.
function RequireStaff({ children }: { children: ReactElement }) {
  const { profile, isStaff } = useAuth();
  if (!profile) return <FullScreenLoader />;
  if (!isStaff) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { session, loading } = useAuth();

  return (
    <Routes>
      {/* Public auth routes */}
      <Route
        path="/login"
        element={
          loading ? (
            <FullScreenLoader />
          ) : session ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Authenticated app */}
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppShell>
              <Routes>
                {/* Bottom-nav tabs */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/kpi" element={<KPIEntry />} />
                <Route path="/coach" element={<CoachPage />} />
                <Route path="/evidence" element={<EvidencePage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Reached from Dashboard cards */}
                <Route path="/units" element={<UnitsPage />} />
                <Route path="/units/:unitId" element={<UnitDetail />} />
                <Route path="/business" element={<BusinessPage />} />
                <Route path="/completion" element={<CompletionPage />} />

                {/* Admin — tutor/admin only (reached from the Profile tab) */}
                <Route
                  path="/admin"
                  element={
                    <RequireStaff>
                      <AdminPage />
                    </RequireStaff>
                  }
                />
                <Route
                  path="/admin/enrol/:learnerId"
                  element={
                    <RequireStaff>
                      <AdminEnrolPage />
                    </RequireStaff>
                  }
                />
                <Route
                  path="/admin/learner/:learnerId"
                  element={
                    <RequireStaff>
                      <AdminLearnerDetailPage />
                    </RequireStaff>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
