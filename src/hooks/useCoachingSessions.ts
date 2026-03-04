import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCoachingSessions() {
  return useQuery({
    queryKey: ["coaching-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_sessions")
        .select("*, startups(name)")
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
