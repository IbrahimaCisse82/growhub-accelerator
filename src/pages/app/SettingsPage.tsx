import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import { toast } from "@/hooks/use-toast";

const notifTypes = [
  { key: "application", label: "Candidatures", description: "Mises à jour de statut des candidatures" },
  { key: "coaching", label: "Coaching", description: "Sessions planifiées, confirmées ou annulées" },
  { key: "task", label: "Tâches", description: "Nouvelles tâches assignées" },
  { key: "milestone", label: "Jalons", description: "Jalons atteints dans les projets" },
  { key: "risk", label: "Risques", description: "Alertes sur les risques critiques" },
  { key: "message", label: "Messages", description: "Nouveaux messages reçus" },
  { key: "success", label: "Système", description: "Notifications système importantes" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: prefs } = useQuery({
    queryKey: ["notif-preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_preferences" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { preferences: Record<string, boolean> } | null;
    },
  });

  const defaultPrefs = Object.fromEntries(notifTypes.map(n => [n.key, true]));
  const [preferences, setPreferences] = useState<Record<string, boolean>>(defaultPrefs);

  useEffect(() => {
    if (prefs?.preferences) {
      setPreferences({ ...defaultPrefs, ...prefs.preferences });
    }
  }, [prefs]);

  const savePrefs = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notification_preferences" as any)
        .upsert({
          user_id: user!.id,
          preferences,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-preferences"] });
      toast({ title: "✓ Préférences sauvegardées" });
    },
  });

  const toggle = (key: string) => setPreferences(p => ({ ...p, [key]: !p[key] }));
  const [selectedTemplate, setSelectedTemplate] = useState("coaching_invite");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data: emailTemplates } = useQuery({
    queryKey: ["email-templates"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates" as any)
        .select("*")
        .order("template_key");
      if (error) throw error;
      return data as unknown as Array<{ template_key: string; subject: string; body: string }>;
    },
  });

  useEffect(() => {
    const found = emailTemplates?.find(t => t.template_key === selectedTemplate);
    setSubject(found?.subject ?? "");
    setBody(found?.body ?? "");
  }, [emailTemplates, selectedTemplate]);

  const saveTemplate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("email_templates" as any).upsert({
        template_key: selectedTemplate,
        subject,
        body,
        updated_by: user!.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "template_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "✓ Template email sauvegardé" });
    },
  });

  const dispatchCoachingEmails = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("dispatch-coaching-emails", {
        body: {},
      });
      if (error) throw error;
      return data as { sent?: number; failed?: number; reminders_enqueued?: number };
    },
    onSuccess: (data) => {
      toast({
        title: "✓ Envoi traite",
        description: `${data?.sent ?? 0} envoye(s), ${data?.failed ?? 0} echec(s), ${data?.reminders_enqueued ?? 0} rappel(s) prepares.`,
      });
    },
    onError: (e) => {
      toast({
        title: "Erreur envoi emails",
        description: (e as Error).message,
        variant: "destructive",
      });
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Paramètres" subtitle="Gérez vos préférences de notification et paramètres" />

      <div className="max-w-2xl">
        <GhCard title="🔔 Préférences de notification">
          <div className="space-y-3">
            {notifTypes.map(n => (
              <div key={n.key} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div>
                  <div className="text-[13px] font-medium text-foreground">{n.label}</div>
                  <div className="text-[11px] text-muted-foreground">{n.description}</div>
                </div>
                <button
                  onClick={() => toggle(n.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences[n.key] ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences[n.key] ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <GhButton variant="primary" onClick={() => savePrefs.mutate()} disabled={savePrefs.isPending}>
              {savePrefs.isPending ? "Sauvegarde…" : "Enregistrer les préférences"}
            </GhButton>
          </div>
        </GhCard>

        <GhCard title="✉ Templates email coaching" className="mt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: "coaching_invite", label: "Invitation" },
                { key: "coaching_reminder_24h", label: "Rappel 24h" },
                { key: "coaching_confirmed", label: "Confirmation" },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setSelectedTemplate(t.key)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg ${selectedTemplate === t.key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-foreground"
              placeholder="Sujet de l'email"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-foreground h-36 resize-none"
              placeholder="Corps du message. Variables: {{first_name}}, {{meeting_date}}, {{meeting_link}}, {{mentor_name}}"
            />
            <div className="text-[11px] text-muted-foreground">
              Variables disponibles: {"{{first_name}}"}, {"{{meeting_date}}"}, {"{{meeting_link}}"}, {"{{mentor_name}}"}.
            </div>
            <div className="flex justify-end">
              <GhButton onClick={() => saveTemplate.mutate()} disabled={!subject.trim() || !body.trim() || saveTemplate.isPending}>
                {saveTemplate.isPending ? "Sauvegarde..." : "Enregistrer le template"}
              </GhButton>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
              <div className="text-[11px] text-muted-foreground">
                Lance l'envoi des emails en file d'attente et genere les rappels J-1.
              </div>
              <GhButton variant="secondary" onClick={() => dispatchCoachingEmails.mutate()} disabled={dispatchCoachingEmails.isPending}>
                {dispatchCoachingEmails.isPending ? "Envoi..." : "Executer l'envoi coaching"}
              </GhButton>
            </div>
          </div>
        </GhCard>
      </div>
    </motion.div>
  );
}
