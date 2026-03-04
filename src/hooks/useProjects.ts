import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, startups(name), programs(name, code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
