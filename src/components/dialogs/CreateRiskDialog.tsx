import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import type { Database } from "@/integrations/supabase/types";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

export default function CreateRiskDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("medium");
  const [mitigation, setMitigation] = useState("");
  const [projectId, setProjectId] = useState("");
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: projects } = useProjects();

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("risks").insert({
        title, description: description || null, level: level as Database["public"]["Enums"]["risk_level"],
        mitigation: mitigation || null, project_id: projectId || null,
        owner_id: user?.id, status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risks"] });
      setOpen(false); setTitle(""); setDescription(""); setLevel("medium"); setMitigation(""); setProjectId("");
      toast({ title: "✓ Risque créé" });
    },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-display">Nouveau risque</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; create.mutate(); }} className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Titre *</label><input value={title} onChange={e => setTitle(e.target.value)} required className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Niveau</label>
              <select value={level} onChange={e => setLevel(e.target.value)} className={inputCls}>
                <option value="low">Faible</option><option value="medium">Moyen</option><option value="high">Élevé</option><option value="critical">Critique</option>
              </select>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Projet</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls}>
                <option value="">— Aucun</option>
                {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className={inputCls + " h-16 resize-none"} /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Mitigation</label><textarea value={mitigation} onChange={e => setMitigation(e.target.value)} className={inputCls + " h-16 resize-none"} /></div>
          <button type="submit" disabled={create.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {create.isPending ? "Création…" : "Créer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
