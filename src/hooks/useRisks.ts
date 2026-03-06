import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRisks() {
  return useQuery({
    queryKey: ["risks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*, projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
