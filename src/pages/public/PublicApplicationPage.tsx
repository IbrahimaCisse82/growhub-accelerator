import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import logo from "@/assets/logo-growhublink.png";

const sectors = ["Fintech", "Agritech", "Healthtech", "Edtech", "E-commerce", "SaaS", "CleanTech", "Logistique", "Autre"];
const stages = ["Idéation", "MVP", "Lancement", "Croissance", "Scale-up"];

export default function PublicApplicationPage() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", startup_name: "",
    sector: "", stage: "", website: "", pitch: "", motivation: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.startup_name || !form.pitch) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.from("public_applications").insert({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      startup_name: form.startup_name,
      sector: form.sector || null,
      stage: form.stage || null,
      website: form.website || null,
      pitch: form.pitch,
      motivation: form.motivation || null,
    });
    setSubmitting(false);
    if (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center shadow-lg">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Candidature envoyée !</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Merci pour votre candidature. Notre équipe l'examinera et vous contactera sous 5 jours ouvrés.
          </p>
          <a href="/login" className="text-primary text-sm hover:underline">
            ← Retour à la connexion
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={logo} alt="GrowHub" className="h-8" />
          <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Déjà un compte ? Connexion →
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-background py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Rejoignez notre programme d'accélération
          </motion.h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Soumettez votre candidature pour intégrer notre écosystème d'innovation.
            Accédez à du mentorat, du financement et un réseau d'experts.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onSubmit={handleSubmit} className="space-y-6">

          {/* Personal info */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
              Informations personnelles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom complet *</label>
                <input value={form.full_name} onChange={e => set("full_name", e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Jean Dupont" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="jean@startup.com" required />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Téléphone</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="+33 6 12 34 56 78" />
              </div>
            </div>
          </div>

          {/* Startup info */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
              Votre entreprise
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom de l'entreprise *</label>
                <input value={form.startup_name} onChange={e => set("startup_name", e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ma Startup SAS" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Site web</label>
                <input value={form.website} onChange={e => set("website", e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="https://mastartup.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Secteur</label>
                <select value={form.sector} onChange={e => set("sector", e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                  <option value="">Sélectionner…</option>
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Stade</label>
                <select value={form.stage} onChange={e => set("stage", e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                  <option value="">Sélectionner…</option>
                  {stages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Pitch */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
              Votre pitch
            </h2>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Décrivez votre projet en quelques lignes *</label>
              <textarea value={form.pitch} onChange={e => set("pitch", e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-28"
                placeholder="Quel problème résolvez-vous ? Quelle est votre solution ? Quel est votre marché cible ?" required />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Motivation</label>
              <textarea value={form.motivation} onChange={e => set("motivation", e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-20"
                placeholder="Pourquoi souhaitez-vous rejoindre notre programme ?" />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
            {submitting ? "Envoi en cours…" : "Soumettre ma candidature →"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            En soumettant ce formulaire, vous acceptez que vos données soient traitées dans le cadre du processus de sélection.
          </p>
        </motion.form>
      </div>
    </div>
  );
}
