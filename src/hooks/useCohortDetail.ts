import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCohort(id: string | undefined) {
  return useQuery({
    queryKey: ["cohort", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cohorts")
        .select("*, programs(id, name, portfolios(id, name))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCohortStartups(cohortId: string | undefined) {
  return useQuery({
    queryKey: ["cohort-startups", cohortId],
    enabled: !!cohortId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .eq("cohort_id", cohortId!)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCohortApplications(cohortId: string | undefined) {
  return useQuery({
    queryKey: ["cohort-applications", cohortId],
    enabled: !!cohortId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, startups(name, sector)")
        .eq("cohort_id", cohortId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
