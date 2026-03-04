import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useStartups() {
  return useQuery({
    queryKey: ["startups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("*, cohorts(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useStartupsCount() {
  return useQuery({
    queryKey: ["startups-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("startups")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}
