import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBudgetDetails(projectId: string | null) {
  return useQuery({
    queryKey: ["project_budget_details", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_budget_details")
        .select("*")
        .eq("project_id", projectId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useBudgetAssumptions(projectId: string | null) {
  return useQuery({
    queryKey: ["project_budget_assumptions", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_budget_assumptions")
        .select("*")
        .eq("project_id", projectId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
