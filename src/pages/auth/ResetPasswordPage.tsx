import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-growhublink.png";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      navigate("/app/dashboard", { replace: true });
    }
    setSubmitting(false);
  };

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Lien invalide ou expiré.</p>
          <Link to="/login" className="text-sm text-primary hover:underline">Retour à la connexion</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center gap-4">
          <img src={logo} alt="Grow Hub Management System" className="h-10 w-auto" />
          <div className="text-center">
            <h1 className="text-xl font-display font-bold text-foreground">Nouveau mot de passe</h1>
            <p className="text-sm text-muted-foreground mt-1">Choisissez un nouveau mot de passe</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nouveau mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
              placeholder="6 caractères minimum" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {submitting ? "Mise à jour…" : "Mettre à jour"}
          </button>
        </form>
      </div>
    </div>
  );
}
