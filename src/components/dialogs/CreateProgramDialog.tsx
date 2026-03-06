import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { usePortfolios } from "@/hooks/usePortfolios";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

export default function CreateProgramDialog({ children, portfolioId }: { children: React.ReactNode; portfolioId?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [funder, setFunder] = useState("");
  const [pId, setPId] = useState(portfolioId ?? "");
  const { data: portfolios } = usePortfolios();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("programs").insert({ name, code, funder: funder || null, portfolio_id: pId || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["programs"] }); qc.invalidateQueries({ queryKey: ["portfolio-programs"] }); setOpen(false); setName(""); setCode(""); setFunder(""); toast({ title: "Programme créé" }); },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-display">Nouveau programme</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Nom *</label><input value={name} onChange={e => setName(e.target.value)} required className={inputCls} /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Code *</label><input value={code} onChange={e => setCode(e.target.value)} required className={inputCls} placeholder="PRG-001" /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Bailleur</label><input value={funder} onChange={e => setFunder(e.target.value)} className={inputCls} /></div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Portefeuille</label>
            <select value={pId} onChange={e => setPId(e.target.value)} className={inputCls}>
              <option value="">Aucun</option>
              {portfolios?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={create.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {create.isPending ? "Création…" : "Créer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
