import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import KPIEntry from "./pages/KPIEntry";
import CoachPage from "./pages/CoachPage";
import EvidencePage from "./pages/EvidencePage";
import ProfilePage from "./pages/ProfilePage";
import UnitsPage from "./pages/UnitsPage";
import BusinessPage from "./pages/BusinessPage";
import CompletionPage from "./pages/CompletionPage";

export default function App() {
  return (
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
        <Route path="/business" element={<BusinessPage />} />
        <Route path="/completion" element={<CompletionPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
