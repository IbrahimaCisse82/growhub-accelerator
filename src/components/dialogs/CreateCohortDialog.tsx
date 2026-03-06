import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { usePrograms } from "@/hooks/usePrograms";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

export default function CreateCohortDialog({ children, programId }: { children: React.ReactNode; programId?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pId, setPId] = useState(programId ?? "");
  const [maxStartups, setMaxStartups] = useState("20");
  const { data: programs } = usePrograms();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cohorts").insert({ name, program_id: pId || null, max_startups: parseInt(maxStartups) || 20 });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cohorts"] }); qc.invalidateQueries({ queryKey: ["program-cohorts"] }); setOpen(false); setName(""); toast({ title: "Cohorte créée" }); },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-display">Nouvelle cohorte</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Nom *</label><input value={name} onChange={e => setName(e.target.value)} required className={inputCls} /></div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Programme</label>
            <select value={pId} onChange={e => setPId(e.target.value)} className={inputCls}>
              <option value="">Aucun</option>
              {programs?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Max startups</label><input type="number" value={maxStartups} onChange={e => setMaxStartups(e.target.value)} className={inputCls} /></div>
          <button type="submit" disabled={create.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {create.isPending ? "Création…" : "Créer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
