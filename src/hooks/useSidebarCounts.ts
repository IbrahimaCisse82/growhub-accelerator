import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useSidebarCounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sidebar-counts", user?.id],
    queryFn: async () => {
      const [startups, apps, risks, notifs, cohorts] = await Promise.all([
        supabase.from("startups").select("*", { count: "exact", head: true }),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("risks").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_read", false),
        supabase.from("cohorts").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);
      return {
        startups: startups.count ?? 0,
        pendingApps: apps.count ?? 0,
        openRisks: risks.count ?? 0,
        unreadNotifs: notifs.count ?? 0,
        activeCohorts: cohorts.count ?? 0,
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
