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
import PortfoliosPage from "@/pages/app/PortfoliosPage";
import PortfolioDetailPage from "@/pages/app/PortfolioDetailPage";
import ProgrammesPage from "@/pages/app/ProgrammesPage";
import ProgramDetailPage from "@/pages/app/ProgramDetailPage";
import CohortesPage from "@/pages/app/CohortesPage";
import CohortDetailPage from "@/pages/app/CohortDetailPage";
import StartupsPage from "@/pages/app/StartupsPage";
import StartupDetailPage from "@/pages/app/StartupDetailPage";
import CandidaturesPage from "@/pages/app/CandidaturesPage";
import MentorsPage from "@/pages/app/MentorsPage";
import CoachingPage from "@/pages/app/CoachingPage";
import LmsPage from "@/pages/app/LmsPage";
import ProjetsPage from "@/pages/app/ProjetsPage";
import JalonsPage from "@/pages/app/JalonsPage";
import TachesPage from "@/pages/app/TachesPage";
import ProjectWizardPage from "@/pages/app/ProjectWizardPage";
import GanttPage from "@/pages/app/GanttPage";
import RisquesPage from "@/pages/app/RisquesPage";
import GrantsPage from "@/pages/app/GrantsPage";
import GrantDetailPage from "@/pages/app/GrantDetailPage";
import GrantsAnalyticsPage from "@/pages/app/GrantsAnalyticsPage";
import BudgetsPage from "@/pages/app/BudgetsPage";
import EvenementsPage from "@/pages/app/EvenementsPage";
import MessagingPage from "@/pages/app/MessagingPage";
import ResourcesPage from "@/pages/app/ResourcesPage";
import AnalyticsPage from "@/pages/app/AnalyticsPage";
import RapportsPage from "@/pages/app/RapportsPage";
import UsersPage from "@/pages/app/UsersPage";
import ProfilePage from "@/pages/app/ProfilePage";
import ActivitesPage from "@/pages/app/ActivitesPage";
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
              <Route path="activites" element={<ActivitesPage />} />
              <Route path="portefeuilles" element={<PortfoliosPage />} />
              <Route path="portefeuilles/:id" element={<PortfolioDetailPage />} />
              <Route path="programmes" element={<ProgrammesPage />} />
              <Route path="programmes/:id" element={<ProgramDetailPage />} />
              <Route path="cohortes" element={<CohortesPage />} />
              <Route path="cohortes/:id" element={<CohortDetailPage />} />
              <Route path="startups" element={<StartupsPage />} />
              <Route path="startups/:id" element={<StartupDetailPage />} />
              <Route path="candidatures" element={<CandidaturesPage />} />
              <Route path="mentors" element={<MentorsPage />} />
              <Route path="coaching" element={<CoachingPage />} />
              <Route path="lms" element={<LmsPage />} />
              <Route path="projets" element={<ProjetsPage />} />
              <Route path="projets/nouveau" element={<ProjectWizardPage />} />
              <Route path="jalons" element={<JalonsPage />} />
              <Route path="taches" element={<TachesPage />} />
              <Route path="gantt" element={<GanttPage />} />
              <Route path="risques" element={<RisquesPage />} />
              <Route path="grants" element={<GrantsPage />} />
              <Route path="grants/:id" element={<GrantDetailPage />} />
              <Route path="budgets" element={<BudgetsPage />} />
              <Route path="evenements" element={<EvenementsPage />} />
              <Route path="messagerie" element={<MessagingPage />} />
              <Route path="ressources" element={<ResourcesPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="rapports" element={<RapportsPage />} />
              <Route path="utilisateurs" element={<UsersPage />} />
              <Route path="profil" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
