import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useStartup(id: string | undefined) {
  return useQuery({
    queryKey: ["startup", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("*, cohorts(id, name, program_id, programs(id, name, portfolio_id, portfolios(id, name)))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useStartupMembers(startupId: string | undefined) {
  return useQuery({
    queryKey: ["startup-members", startupId],
    enabled: !!startupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_members")
        .select("*")
        .eq("startup_id", startupId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}
