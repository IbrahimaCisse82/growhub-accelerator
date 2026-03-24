import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
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

function useNotifPreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notif-preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: prefs } = useNotifPreferences();

  const defaultPrefs = Object.fromEntries(notifTypes.map(n => [n.key, true]));
  const [preferences, setPreferences] = useState<Record<string, boolean>>(defaultPrefs);

  useEffect(() => {
    if (prefs?.preferences) {
      setPreferences({ ...defaultPrefs, ...(prefs.preferences as Record<string, boolean>) });
    }
  }, [prefs]);

  const savePrefs = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user!.id,
          preferences: preferences as any,
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
      </div>
    </motion.div>
  );
}
