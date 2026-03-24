import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import GhButton from "@/components/shared/GhButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  description?: string;
}

interface FillFormDialogProps {
  form: { id: string; title: string; fields: any; frequency: string | null };
  startupId: string;
}

export default function FillFormDialog({ form, startupId }: FillFormDialogProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const fields = (Array.isArray(form.fields) ? form.fields : []) as FormField[];

  const submit = useMutation({
    mutationFn: async () => {
      // Validate required fields
      for (const f of fields) {
        if (f.required && !responses[f.id]) throw new Error(`Le champ "${f.label}" est requis`);
      }
      const { error } = await supabase.from("data_collection_responses").insert({
        form_id: form.id,
        startup_id: startupId,
        respondent_id: user!.id,
        responses: responses as any,
        period,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["data-collection-responses"] });
      toast({ title: "✓ Réponses soumises" });
      setOpen(false);
      setResponses({});
    },
    onError: (e) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const updateField = (fieldId: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GhButton variant="primary" size="sm">📝 Remplir</GhButton>
      </DialogTrigger>
      <DialogContent className="max-w-[550px] bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{form.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Période</label>
            <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
          </div>

          {fields.map(field => (
            <div key={field.id}>
              <label className="text-xs font-medium text-foreground mb-1 block">
                {field.label} {field.required && <span className="text-destructive">*</span>}
              </label>
              {field.description && <p className="text-[10px] text-muted-foreground mb-1">{field.description}</p>}
              
              {field.type === "text" && (
                <input value={responses[field.id] ?? ""} onChange={e => updateField(field.id, e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              )}
              {field.type === "number" && (
                <input type="number" value={responses[field.id] ?? ""} onChange={e => updateField(field.id, Number(e.target.value))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              )}
              {field.type === "textarea" && (
                <textarea value={responses[field.id] ?? ""} onChange={e => updateField(field.id, e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none h-20" />
              )}
              {field.type === "date" && (
                <input type="date" value={responses[field.id] ?? ""} onChange={e => updateField(field.id, e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              )}
              {field.type === "boolean" && (
                <div className="flex gap-3">
                  {["Oui", "Non"].map(v => (
                    <button key={v} onClick={() => updateField(field.id, v === "Oui")}
                      className={`text-sm px-4 py-2 rounded-lg border transition-colors ${responses[field.id] === (v === "Oui") ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              )}
              {(field.type === "select" || field.type === "multiselect") && field.options && (
                <div className="flex flex-wrap gap-1.5">
                  {field.options.map(opt => {
                    const isMulti = field.type === "multiselect";
                    const selected = isMulti
                      ? (responses[field.id] ?? []).includes(opt)
                      : responses[field.id] === opt;
                    return (
                      <button key={opt} onClick={() => {
                        if (isMulti) {
                          const arr = responses[field.id] ?? [];
                          updateField(field.id, selected ? arr.filter((x: string) => x !== opt) : [...arr, opt]);
                        } else {
                          updateField(field.id, opt);
                        }
                      }}
                        className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors ${selected ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <GhButton onClick={() => submit.mutate()} disabled={submit.isPending} className="w-full">
            {submit.isPending ? "Envoi…" : "Soumettre les réponses"}
          </GhButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
