import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

export default function CreatePortfolioDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("portfolios").insert({ name, code, description: description || null, owner_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolios"] }); setOpen(false); setName(""); setCode(""); setDescription(""); toast({ title: "Portefeuille créé" }); },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-display">Nouveau portefeuille</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Nom *</label><input value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="Nom du portefeuille" /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Code *</label><input value={code} onChange={e => setCode(e.target.value)} required className={inputCls} placeholder="PF-001" /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className={inputCls + " h-20 resize-none"} placeholder="Description…" /></div>
          <button type="submit" disabled={create.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {create.isPending ? "Création…" : "Créer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
