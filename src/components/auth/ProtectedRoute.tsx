import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-growhublink.png";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-mono">Chargement…</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // User exists but profile not yet loaded
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-mono">Chargement du profil…</span>
        </div>
      </div>
    );
  }

  // User not approved
  if (!profile.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <img src={logo} alt="GrowHub Accelerator" className="h-10 mx-auto mb-6" />
          <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏳</span>
          </div>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">Compte en attente de validation</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Votre inscription a bien été enregistrée. Un administrateur doit valider votre compte avant que vous puissiez accéder à la plateforme.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Connecté en tant que <span className="text-foreground font-medium">{profile.email}</span>
          </p>
          <button
            onClick={signOut}
            className="w-full py-2.5 px-4 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
