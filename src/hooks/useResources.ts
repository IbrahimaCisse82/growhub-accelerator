import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useResources() {
  const { isAdmin } = useAuth();
  return useQuery({
    queryKey: ["resources", isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("resources")
        .select("*, programs(name)")
        .order("created_at", { ascending: false });
      // Non-admins only see public resources
      if (!isAdmin) {
        query = query.eq("is_public", true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
