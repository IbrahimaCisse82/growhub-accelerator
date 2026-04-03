import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import PublicApplicationPage from "@/pages/public/PublicApplicationPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import AppLayout from "@/components/layout/AppLayout";

import DashboardPage from "@/pages/app/DashboardPage";
import PortfoliosPage from "@/pages/app/PortfoliosPage";
import PortfolioDetailPage from "@/pages/app/PortfolioDetailPage";
import ProgrammesPage from "@/pages/app/ProgrammesPage";
import ProgramDetailPage from "@/pages/app/ProgramDetailPage";
import ProjetsPage from "@/pages/app/ProjetsPage";
import ProjetDetailPage from "@/pages/app/ProjetDetailPage";
import CohortesPage from "@/pages/app/CohortesPage";
import CohortDetailPage from "@/pages/app/CohortDetailPage";
import StartupsPage from "@/pages/app/StartupsPage";
import StartupDetailPage from "@/pages/app/StartupDetailPage";
import CandidaturesPage from "@/pages/app/CandidaturesPage";
import MentorsPage from "@/pages/app/MentorsPage";
import CoachingPage from "@/pages/app/CoachingPage";
import LmsPage from "@/pages/app/LmsPage";
import GrantsPage from "@/pages/app/GrantsPage";
import GrantDetailPage from "@/pages/app/GrantDetailPage";
import GrantsAnalyticsPage from "@/pages/app/GrantsAnalyticsPage";
import MessagingPage from "@/pages/app/MessagingPage";
import AnalyticsPage from "@/pages/app/AnalyticsPage";
import UsersPage from "@/pages/app/UsersPage";
import SettingsPage from "@/pages/app/SettingsPage";
import ProfilePage from "@/pages/app/ProfilePage";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/connexion" replace />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/postuler" element={<PublicApplicationPage />} />

          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="portefeuilles" element={<PortfoliosPage />} />
                    <Route path="portefeuilles/:id" element={<PortfolioDetailPage />} />
                    <Route path="programmes" element={<ProgrammesPage />} />
                    <Route path="programmes/:id" element={<ProgramDetailPage />} />
                    <Route path="projets" element={<ProjetsPage />} />
                    <Route path="projets/:id" element={<ProjetDetailPage />} />
                    <Route path="cohortes" element={<CohortesPage />} />
                    <Route path="cohortes/:id" element={<CohortDetailPage />} />
                    <Route path="startups" element={<StartupsPage />} />
                    <Route path="startups/:id" element={<StartupDetailPage />} />
                    <Route path="candidatures" element={<CandidaturesPage />} />
                    <Route path="mentors" element={<MentorsPage />} />
                    <Route path="coaching" element={<CoachingPage />} />
                    <Route path="lms" element={<LmsPage />} />
                    <Route path="subventions" element={<GrantsPage />} />
                    <Route path="subventions/:id" element={<GrantDetailPage />} />
                    <Route path="subventions-analytics" element={<GrantsAnalyticsPage />} />
                    <Route path="messagerie" element={<MessagingPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route
                      path="utilisateurs"
                      element={
                        <AdminRoute>
                          <UsersPage />
                        </AdminRoute>
                      }
                    />
                    <Route path="parametres" element={<SettingsPage />} />
                    <Route path="profil" element={<ProfilePage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
