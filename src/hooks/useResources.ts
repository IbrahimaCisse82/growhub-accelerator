import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useResources() {
  return useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*, programs(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
