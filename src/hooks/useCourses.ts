import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useCourses() {
  const { isAdmin } = useAuth();
  return useQuery({
    queryKey: ["courses", isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      // Non-admins only see published courses
      if (!isAdmin) {
        query = query.eq("is_published", true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
