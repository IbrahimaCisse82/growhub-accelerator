import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMilestones() {
  return useQuery({
    queryKey: ["milestones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("milestones")
        .select("*, projects(name, status, start_date, end_date)")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
