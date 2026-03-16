import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useSurveys() {
  return useQuery({
    queryKey: ["surveys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("*, programs(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSurveyResponses(surveyId: string | undefined) {
  return useQuery({
    queryKey: ["survey-responses", surveyId],
    enabled: !!surveyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_responses")
        .select("*")
        .eq("survey_id", surveyId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (survey: { title: string; description?: string; survey_type?: string; target_type?: string; program_id?: string; created_by?: string }) => {
      const { error } = await supabase.from("surveys").insert(survey);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["surveys"] });
      toast.success("Enquête créée");
    },
    onError: () => toast.error("Erreur lors de la création"),
  });
}

export function useSubmitSurveyResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (response: { survey_id: string; respondent_id: string; rating?: number; feedback?: string; answers?: Record<string, unknown> }) => {
      const { error } = await supabase.from("survey_responses").insert([response] as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["survey-responses", vars.survey_id] });
      toast.success("Réponse enregistrée");
    },
    onError: () => toast.error("Erreur lors de l'envoi"),
  });
}

export function useDeleteSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("surveys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["surveys"] });
      toast.success("Enquête supprimée");
    },
  });
}
