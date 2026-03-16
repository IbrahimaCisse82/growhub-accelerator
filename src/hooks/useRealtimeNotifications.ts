import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

/**
 * Global real-time listener for notifications.
 * Mount once in AppLayout to get live notification updates.
 * Shows toast popups for incoming notifications.
 */
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["notifications"] });
          qc.invalidateQueries({ queryKey: ["notifications-unread"] });
          qc.invalidateQueries({ queryKey: ["sidebar-counts"] });

          // Show toast for the new notification
          const n = payload.new as { title?: string; content?: string };
          if (n?.title) {
            toast({
              title: n.title,
              description: n.content || undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc, toast]);
}
