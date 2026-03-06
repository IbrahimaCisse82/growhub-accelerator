import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

export default function CreateCourseDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("beginner");
  const [durationHours, setDurationHours] = useState("");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").insert({ title, description: description || null, level, duration_hours: parseFloat(durationHours) || 0 });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["courses"] }); setOpen(false); setTitle(""); setDescription(""); toast({ title: "Cours créé" }); },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-display">Nouveau cours</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Titre *</label><input value={title} onChange={e => setTitle(e.target.value)} required className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Niveau</label>
              <select value={level} onChange={e => setLevel(e.target.value)} className={inputCls}>
                <option value="beginner">Débutant</option><option value="intermediate">Intermédiaire</option><option value="advanced">Avancé</option>
              </select>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Durée (h)</label><input type="number" value={durationHours} onChange={e => setDurationHours(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className={inputCls + " h-20 resize-none"} /></div>
          <button type="submit" disabled={create.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {create.isPending ? "Création…" : "Créer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
