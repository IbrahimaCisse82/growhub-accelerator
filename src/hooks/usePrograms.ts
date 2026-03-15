import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePrograms() {
  return useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*, portfolios(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProgram(id: string | undefined) {
  return useQuery({
    queryKey: ["program", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*, portfolios(id, name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useProjectCohorts(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-cohorts", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cohorts")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProgramGrants(programId: string | undefined) {
  return useQuery({
    queryKey: ["program-grants", programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grants")
        .select("*")
        .eq("program_id", programId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProgramEvents(programId: string | undefined) {
  return useQuery({
    queryKey: ["program-events", programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("program_id", programId!)
        .order("start_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
