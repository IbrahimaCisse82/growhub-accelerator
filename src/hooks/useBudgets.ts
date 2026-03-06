import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*, grants(name, code), projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
