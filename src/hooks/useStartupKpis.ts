import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useStartupKpis(startupId: string | undefined) {
  return useQuery({
    queryKey: ["startup-kpis", startupId],
    enabled: !!startupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_kpis")
        .select("*")
        .eq("startup_id", startupId!)
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddStartupKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (kpi: { startup_id: string; metric_name: string; metric_value: number; unit?: string; period?: string; recorded_at?: string; notes?: string }) => {
      const { error } = await supabase.from("startup_kpis").insert(kpi);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["startup-kpis", vars.startup_id] });
      toast.success("KPI ajouté");
    },
    onError: () => toast.error("Erreur lors de l'ajout du KPI"),
  });
}

export function useStartupHealthScore(startupId: string | undefined) {
  return useQuery({
    queryKey: ["startup-health-score", startupId],
    enabled: !!startupId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("compute_startup_health_score", { p_startup_id: startupId! });
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });
}
