import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAlumni() {
  return useQuery({
    queryKey: ["alumni"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("*, cohorts(name, projects(name, programs(name)))")
        .eq("is_alumni", true)
        .order("alumni_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleAlumni() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_alumni, alumni_date, alumni_notes }: { id: string; is_alumni: boolean; alumni_date?: string; alumni_notes?: string }) => {
      const { error } = await supabase.from("startups").update({ is_alumni, alumni_date, alumni_notes } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alumni"] });
      qc.invalidateQueries({ queryKey: ["startups"] });
      toast.success("Statut alumni mis à jour");
    },
    onError: () => toast.error("Erreur"),
  });
}
