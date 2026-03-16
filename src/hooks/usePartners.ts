import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePartners() {
  return useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*, programs(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (partner: { name: string; type: string; contact_name?: string; contact_email?: string; contact_phone?: string; website?: string; description?: string; country?: string; sector?: string; program_id?: string; status?: string }) => {
      const { error } = await supabase.from("partners").insert(partner);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partenaire ajouté");
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partenaire supprimé");
    },
  });
}
