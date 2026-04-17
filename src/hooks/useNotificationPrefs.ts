import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface NotifPrefs {
  user_id: string;
  task_notifications: boolean;
  application_notifications: boolean;
  coaching_notifications: boolean;
  milestone_notifications: boolean;
  risk_notifications: boolean;
  message_notifications: boolean;
  email_digest_enabled: boolean;
  email_digest_frequency: "daily" | "weekly" | "never";
}

const DEFAULTS: Omit<NotifPrefs, "user_id"> = {
  task_notifications: true,
  application_notifications: true,
  coaching_notifications: true,
  milestone_notifications: true,
  risk_notifications: true,
  message_notifications: true,
  email_digest_enabled: false,
  email_digest_frequency: "weekly",
};

export function useNotificationPrefs() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["user-notification-prefs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_notification_prefs")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? { user_id: user!.id, ...DEFAULTS }) as NotifPrefs;
    },
  });

  const save = useMutation({
    mutationFn: async (prefs: Partial<NotifPrefs>) => {
      const { error } = await supabase
        .from("user_notification_prefs")
        .upsert({ user_id: user!.id, ...DEFAULTS, ...query.data, ...prefs }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-notification-prefs", user?.id] });
      toast({ title: "✓ Préférences mises à jour" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return { prefs: query.data, isLoading: query.isLoading, save };
}
