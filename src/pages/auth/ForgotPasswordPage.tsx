import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-growhublink.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
    setSubmitting(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-[400px] text-center space-y-4">
          <img src={logo} alt="Grow Hub Management System" className="h-10 w-auto mx-auto" />
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-6 py-8 space-y-3">
            <div className="text-2xl">📧</div>
            <h2 className="text-lg font-display font-bold text-foreground">Email envoyé</h2>
            <p className="text-sm text-muted-foreground">
              Si un compte existe pour <strong className="text-foreground">{email}</strong>, vous recevrez un lien de réinitialisation.
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
          <img src={logo} alt="Grow Hub Management System" className="h-10 w-auto" />
          <div className="text-center">
            <h1 className="text-xl font-display font-bold text-foreground">Mot de passe oublié</h1>
            <p className="text-sm text-muted-foreground mt-1">Entrez votre email pour réinitialiser</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
              placeholder="vous@exemple.com" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {submitting ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
