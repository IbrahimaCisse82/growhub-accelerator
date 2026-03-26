import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import FunnelBuilder from "@/components/funnel/FunnelBuilder";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Save } from "lucide-react";

const FUNNEL_FORM_TITLE = "__funnel_builder_config__";

export default function FunnelBuilderPage() {
  const [fields, setFields] = useState<any[]>([]);
  const { profile } = useAuth();
  const qc = useQueryClient();

  // Load saved funnel from data_collection_forms
  const { data: savedForm, isLoading } = useQuery({
    queryKey: ["funnel-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_collection_forms")
        .select("*")
        .eq("title", FUNNEL_FORM_TITLE)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (savedForm?.fields) {
      try {
        const parsed = Array.isArray(savedForm.fields) ? savedForm.fields : [];
        setFields(parsed as any[]);
      } catch { /* ignore */ }
    }
  }, [savedForm]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (savedForm?.id) {
        const { error } = await supabase
          .from("data_collection_forms")
          .update({ fields: fields as any })
          .eq("id", savedForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("data_collection_forms")
          .insert({
            title: FUNNEL_FORM_TITLE,
            description: "Application funnel configuration",
            fields: fields as any,
            is_active: true,
            created_by: profile?.user_id ?? null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funnel-config"] });
      toast({ title: "✓ Funnel sauvegardé", description: `${fields.length} champ(s) configurés` });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder le funnel", variant: "destructive" });
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Funnel Builder"
        subtitle="Construisez votre formulaire de candidature par glisser-déposer"
        actions={
          <GhButton onClick={() => saveMutation.mutate()} disabled={fields.length === 0 || saveMutation.isPending}>
            <Save size={14} className="mr-1.5" />
            {saveMutation.isPending ? "Sauvegarde..." : "Sauvegarder le funnel"}
          </GhButton>
        }
      />
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Chargement...</div>
      ) : (
        <FunnelBuilder fields={fields} onChange={setFields} />
      )}
    </motion.div>
  );
}
