import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-growhublink.png";

export default function SignupPage() {
  const { session, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/app/dashboard" replace />;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    else setSuccess(true);
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-[400px] text-center space-y-4">
          <img src={logo} alt="GrowHub Accelerator" className="h-10 w-auto mx-auto" />
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-6 py-8 space-y-3">
            <div className="text-2xl">✉️</div>
            <h2 className="text-lg font-display font-bold text-foreground">Inscription réussie</h2>
            <p className="text-sm text-muted-foreground">
              Votre compte a été créé. Un administrateur doit valider votre accès avant que vous puissiez utiliser la plateforme.
            </p>
          </div>
          <Link to="/login" className="text-sm text-primary hover:underline">Retour à la connexion</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center gap-4">
          <img src={logo} alt="GrowHub Accelerator" className="h-10 w-auto" />
          <div className="text-center">
            <h1 className="text-xl font-display font-bold text-foreground">Créer un compte</h1>
            <p className="text-sm text-muted-foreground mt-1">Rejoignez GrowHub Accelerator</p>
          </div>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nom complet</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors" placeholder="Jean Dupont" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors" placeholder="vous@exemple.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors" placeholder="6 caractères minimum" />
          </div>
          <button type="submit" disabled={submitting} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {submitting ? "Création…" : "Créer mon compte"}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ? <Link to="/login" className="text-primary hover:underline font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
