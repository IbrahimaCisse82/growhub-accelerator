import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useStartup(id: string | undefined) {
  return useQuery({
    queryKey: ["startup", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("*, cohorts(id, name, program_id, programs(id, name, portfolio_id, portfolios(id, name)))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useStartupMembers(startupId: string | undefined) {
  return useQuery({
    queryKey: ["startup-members", startupId],
    enabled: !!startupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_members")
        .select("*")
        .eq("startup_id", startupId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useStartupProjects(startupId: string | undefined) {
  return useQuery({
    queryKey: ["startup-projects", startupId],
    enabled: !!startupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("startup_id", startupId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useStartupSessions(startupId: string | undefined) {
  return useQuery({
    queryKey: ["startup-sessions", startupId],
    enabled: !!startupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_sessions")
        .select("*, mentor:mentor_profiles(user_id, bio)")
        .eq("startup_id", startupId!)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useStartupRisks(startupId: string | undefined) {
  return useQuery({
    queryKey: ["startup-risks", startupId],
    enabled: !!startupId,
    queryFn: async () => {
      // Risks are linked to projects, so we need to find projects for this startup first
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("startup_id", startupId!);
      if (!projects || projects.length === 0) return [];
      const projectIds = projects.map(p => p.id);
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
