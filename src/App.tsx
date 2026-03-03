import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import DashboardPage from "@/pages/app/DashboardPage";
import CohortesPage from "@/pages/app/CohortesPage";
import StartupsPage from "@/pages/app/StartupsPage";
import CandidaturesPage from "@/pages/app/CandidaturesPage";
import MentorsPage from "@/pages/app/MentorsPage";
import CoachingPage from "@/pages/app/CoachingPage";
import LmsPage from "@/pages/app/LmsPage";
import ProjetsPage from "@/pages/app/ProjetsPage";
import GrantsPage from "@/pages/app/GrantsPage";
import EvenementsPage from "@/pages/app/EvenementsPage";
import AnalyticsPage from "@/pages/app/AnalyticsPage";
import PlaceholderPage from "@/pages/app/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="activites" element={<PlaceholderPage title="Activités" subtitle="Fil d'activité de la plateforme" />} />
              <Route path="portefeuilles" element={<PlaceholderPage title="Portefeuilles" subtitle="Gestion stratégique des portefeuilles" />} />
              <Route path="programmes" element={<PlaceholderPage title="Programmes" subtitle="Coordination des programmes d'accélération" />} />
              <Route path="cohortes" element={<CohortesPage />} />
              <Route path="startups" element={<StartupsPage />} />
              <Route path="candidatures" element={<CandidaturesPage />} />
              <Route path="mentors" element={<MentorsPage />} />
              <Route path="coaching" element={<CoachingPage />} />
              <Route path="lms" element={<LmsPage />} />
              <Route path="projets" element={<ProjetsPage />} />
              <Route path="gantt" element={<PlaceholderPage title="Gantt" subtitle="Vue Gantt des projets et jalons" />} />
              <Route path="risques" element={<PlaceholderPage title="Risques" subtitle="Registre et suivi des risques" />} />
              <Route path="grants" element={<GrantsPage />} />
              <Route path="budgets" element={<PlaceholderPage title="Budgets" subtitle="Suivi budgétaire et dépenses" />} />
              <Route path="evenements" element={<EvenementsPage />} />
              <Route path="messagerie" element={<PlaceholderPage title="Messagerie" subtitle="Messagerie interne de la plateforme" />} />
              <Route path="ressources" element={<PlaceholderPage title="Ressources" subtitle="Bibliothèque de ressources partagées" />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="rapports" element={<PlaceholderPage title="Rapports" subtitle="Génération et export de rapports" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
