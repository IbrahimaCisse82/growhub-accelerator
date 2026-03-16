import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useProjects } from "@/hooks/useProjects";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";
const selectCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors appearance-none cursor-pointer";

export default function CreateGrantDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [amountTotal, setAmountTotal] = useState("");
  const [organization, setOrganization] = useState("");
  const qc = useQueryClient();
  const { data: projects } = useProjects();

  // Filter only active/in-progress projects
  const activeProjects = projects?.filter(p => p.status === "active" || p.status === "in_progress" || p.status === "draft") ?? [];

  const handleProjectChange = (id: string) => {
    setProjectId(id);
    const project = projects?.find(p => p.id === id);
    if (project) {
      setName(project.name);
      if (project.code) setCode(project.code);
    }
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("grants").insert({
        name,
        code,
        amount_total: parseFloat(amountTotal) || 0,
        organization: organization || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grants"] });
      setOpen(false); setName(""); setCode(""); setAmountTotal(""); setOrganization(""); setProjectId("");
      toast({ title: "Grant créé" });
    },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-display">Nouveau grant</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Projet *</label>
            <select value={projectId} onChange={e => handleProjectChange(e.target.value)} required className={selectCls}>
              <option value="">Sélectionner un projet…</option>
              {activeProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.code ? ` (${p.code})` : ""}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nom du grant *</label>
            <input value={name} onChange={e => setName(e.target.value)} required className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Code *</label><input value={code} onChange={e => setCode(e.target.value)} required className={inputCls} placeholder="GRT-001" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Montant (XOF) *</label><input type="number" value={amountTotal} onChange={e => setAmountTotal(e.target.value)} required className={inputCls} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Organisation</label><input value={organization} onChange={e => setOrganization(e.target.value)} className={inputCls} /></div>
          <button type="submit" disabled={create.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {create.isPending ? "Création…" : "Créer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}