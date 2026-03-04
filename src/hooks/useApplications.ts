import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useApplications() {
  return useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, startups(name, sector), programs(name)")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useApplicationsPipeline() {
  return useQuery({
    queryKey: ["applications-pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("status");
      if (error) throw error;
      const counts = {
        submitted: 0, screening: 0, interview: 0,
        due_diligence: 0, accepted: 0, rejected: 0,
      };
      data?.forEach((a) => { counts[a.status]++; });
      return counts;
    },
  });
}
