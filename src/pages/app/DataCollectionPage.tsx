import { motion } from "framer-motion";
import { useState } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import EmptyState from "@/components/shared/EmptyState";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type FieldType = "text" | "number" | "select" | "multiselect" | "date" | "textarea" | "boolean";

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  description?: string;
  conditional?: { field_id: string; value: string };
}

// ── Hooks ──
function useForms() {
  return useQuery({
    queryKey: ["data-collection-forms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_collection_forms").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useResponses(formId?: string) {
  return useQuery({
    queryKey: ["data-collection-responses", formId],
    enabled: !!formId,
    queryFn: async () => {
      const { data, error } = await supabase.from("data_collection_responses").select("*, startups:startup_id(name)").eq("form_id", formId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ── Form Builder Dialog ──
function FormBuilderDialog() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [fields, setFields] = useState<FormField[]>([]);

  const addField = () => {
    setFields(prev => [...prev, {
      id: crypto.randomUUID(),
      label: "",
      type: "text",
      required: false,
    }]);
  };

  const updateField = (id: string, update: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...update } : f));
  };

  const removeField = (id: string) => setFields(prev => prev.filter(f => f.id !== id));

  const moveField = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= fields.length) return;
    const copy = [...fields];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    setFields(copy);
  };

  const createForm = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("data_collection_forms").insert({
        title,
        description,
        frequency,
        fields: fields as any,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["data-collection-forms"] });
      toast({ title: "✓ Formulaire créé" });
      setOpen(false);
      setTitle(""); setDescription(""); setFields([]);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GhButton>+ Créer formulaire</GhButton>
      </DialogTrigger>
      <DialogContent className="max-w-[650px] bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Créer un formulaire de collecte</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre du formulaire"
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12.5px] text-foreground" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optionnel)"
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-foreground resize-none h-16" />

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Fréquence :</span>
            {["monthly", "quarterly", "one_time"].map(f => (
              <button key={f} onClick={() => setFrequency(f)}
                className={`text-[11px] px-2.5 py-1 rounded-lg ${frequency === f ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>
                {f === "monthly" ? "Mensuelle" : f === "quarterly" ? "Trimestrielle" : "Ponctuelle"}
              </button>
            ))}
          </div>

          {/* Fields builder */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-foreground">Champs du formulaire</span>
              <GhButton variant="secondary" size="sm" onClick={addField}>+ Ajouter un champ</GhButton>
            </div>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="bg-surface-2 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveField(idx, -1)} className="text-muted-foreground hover:text-foreground text-[10px]">▲</button>
                      <button onClick={() => moveField(idx, 1)} className="text-muted-foreground hover:text-foreground text-[10px]">▼</button>
                    </div>
                    <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })}
                      placeholder="Nom du champ"
                      className="flex-1 bg-card border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground" />
                    <select value={field.type} onChange={e => updateField(field.id, { type: e.target.value as FieldType })}
                      className="bg-card border border-border rounded-lg px-2 py-1.5 text-[11px] text-foreground">
                      <option value="text">Texte</option>
                      <option value="number">Nombre</option>
                      <option value="textarea">Texte long</option>
                      <option value="select">Liste déroulante</option>
                      <option value="multiselect">Choix multiple</option>
                      <option value="date">Date</option>
                      <option value="boolean">Oui/Non</option>
                    </select>
                    <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="w-3 h-3" />
                      Requis
                    </label>
                    <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive text-sm">✕</button>
                  </div>
                  {(field.type === "select" || field.type === "multiselect") && (
                    <input
                      value={field.options?.join(", ") ?? ""}
                      onChange={e => updateField(field.id, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                      placeholder="Options séparées par des virgules"
                      className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-[11px] text-foreground mt-1"
                    />
                  )}
                </div>
              ))}
              {fields.length === 0 && (
                <div className="text-center text-muted-foreground text-[11px] py-6 border border-dashed border-border rounded-lg">
                  Cliquez "Ajouter un champ" pour commencer
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <GhButton onClick={() => createForm.mutate()} disabled={!title || fields.length === 0 || createForm.isPending}>
              Créer le formulaire
            </GhButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──
export default function DataCollectionPage() {
  const { data: forms, isLoading } = useForms();
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const { data: responses } = useResponses(selectedFormId ?? undefined);

  const activeForms = forms?.filter(f => f.is_active).length ?? 0;
  const totalResponses = forms?.length ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Collecte de données"
        subtitle="Formulaires dynamiques pour collecter les données des startups automatiquement"
        actions={<FormBuilderDialog />}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mb-5">
        <StatCard label="Formulaires actifs" value={String(activeForms)} note="" color="green" />
        <StatCard label="Total formulaires" value={String(totalResponses)} note="" color="blue" />
        <StatCard label="Réponses ce mois" value={String(responses?.length ?? 0)} note="" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Forms list */}
        <div className="lg:col-span-1">
          <GhCard title="Formulaires" badge={String(forms?.length ?? 0)} noPadding>
            {isLoading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
            ) : !forms || forms.length === 0 ? (
              <EmptyState icon="📋" title="Aucun formulaire" description="Créez votre premier formulaire de collecte" />
            ) : (
              <div className="divide-y divide-border">
                {forms.map(f => {
                  const fieldCount = Array.isArray(f.fields) ? (f.fields as any[]).length : 0;
                  return (
                    <button key={f.id} onClick={() => setSelectedFormId(f.id)}
                      className={`w-full text-left p-3.5 hover:bg-secondary transition-colors ${selectedFormId === f.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                      <div className="text-[12.5px] font-semibold text-foreground">{f.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{fieldCount} champs</div>
                      <div className="flex gap-1.5 mt-1.5">
                        <Pill color={f.is_active ? "green" : "gray"}>{f.is_active ? "Actif" : "Inactif"}</Pill>
                        <Pill color="blue">{f.frequency === "monthly" ? "Mensuel" : f.frequency === "quarterly" ? "Trimestriel" : "Ponctuel"}</Pill>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </GhCard>
        </div>

        {/* Responses */}
        <div className="lg:col-span-2">
          {selectedFormId ? (
            <GhCard title="Réponses" badge={String(responses?.length ?? 0)} noPadding>
              {!responses || responses.length === 0 ? (
                <EmptyState icon="📊" title="Aucune réponse" description="Les réponses des startups apparaîtront ici" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[12.5px]">
                    <thead>
                      <tr className="bg-secondary">
                        {["Entreprise", "Période", "Statut", "Date"].map(h => (
                          <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {responses.map(r => (
                        <tr key={r.id} className="hover:bg-secondary transition-colors">
                          <td className="px-3.5 py-2.5 border-b border-border text-foreground font-semibold">{(r as any).startups?.name ?? "—"}</td>
                          <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{r.period ?? "—"}</td>
                          <td className="px-3.5 py-2.5 border-b border-border">
                            <Pill color={r.status === "submitted" ? "green" : "amber"}>{r.status === "submitted" ? "Soumis" : "Brouillon"}</Pill>
                          </td>
                          <td className="px-3.5 py-2.5 border-b border-border font-mono text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yyyy", { locale: fr })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GhCard>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              Sélectionnez un formulaire pour voir les réponses
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
