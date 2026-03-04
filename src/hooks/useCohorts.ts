import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCohorts() {
  return useQuery({
    queryKey: ["cohorts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cohorts")
        .select("*, programs(name, funder)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
