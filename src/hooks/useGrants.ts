import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useGrants() {
  return useQuery({
    queryKey: ["grants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grants")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
