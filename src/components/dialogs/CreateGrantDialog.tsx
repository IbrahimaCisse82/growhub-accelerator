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
  const [convention, setConvention] = useState("");
  const [amountTotal, setAmountTotal] = useState("");
  const [organization, setOrganization] = useState("");
  const [orgType, setOrgType] = useState("");
  const [pays, setPays] = useState("");
  const [devise, setDevise] = useState("XOF");
  const [tauxChange, setTauxChange] = useState("655.957");
  const [periodicite, setPeriodicite] = useState("Trimestrielle");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const qc = useQueryClient();
  const { data: projects } = useProjects();

  const activeProjects = projects?.filter(p => p.status === "active" || p.status === "draft") ?? [];

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
        convention: convention || null,
        amount_total: parseFloat(amountTotal) || 0,
        organization: organization || null,
        org_type: orgType || null,
        pays: pays || null,
        currency: devise || "EUR",
        taux_change: parseFloat(tauxChange) || 655.957,
        periodicite: periodicite || "Trimestrielle",
        project_id: projectId || null,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grants"] });
      setOpen(false);
      setName(""); setCode(""); setConvention(""); setAmountTotal(""); setOrganization("");
      setOrgType(""); setPays(""); setDevise("XOF"); setTauxChange("655.957");
      setPeriodicite("Trimestrielle"); setProjectId(""); setStartDate(""); setEndDate("");
      toast({ title: "Projet créé" });
    },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Nouveau projet — Convention de subvention</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Projet associé</label>
            <select value={projectId} onChange={e => handleProjectChange(e.target.value)} className={selectCls}>
              <option value="">Sélectionner un projet…</option>
              {activeProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.code ? ` (${p.code})` : ""}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">N° Convention *</label><input value={convention} onChange={e => setConvention(e.target.value)} required className={inputCls} placeholder="Ex: CONV-2024-001" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Code *</label><input value={code} onChange={e => setCode(e.target.value)} required className={inputCls} placeholder="GRT-001" /></div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Titre du projet *</label>
            <input value={name} onChange={e => setName(e.target.value)} required className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Organisation *</label><input value={organization} onChange={e => setOrganization(e.target.value)} required className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Type d'organisation</label>
              <select value={orgType} onChange={e => setOrgType(e.target.value)} className={selectCls}>
                <option value="">— Sélectionner —</option>
                <option value="ONG">ONG</option><option value="Association">Association</option><option value="Entreprise">Entreprise</option><option value="Institution">Institution publique</option><option value="Autre">Autre</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Pays</label><input value={pays} onChange={e => setPays(e.target.value)} className={inputCls} placeholder="Ex: Sénégal" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Devise</label>
              <select value={devise} onChange={e => setDevise(e.target.value)} className={selectCls}>
                <option value="XOF">XOF (FCFA)</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
              </select>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Taux change (→ EUR)</label><input type="number" step="0.001" value={tauxChange} onChange={e => setTauxChange(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Montant total (EUR) *</label><input type="number" value={amountTotal} onChange={e => setAmountTotal(e.target.value)} required className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Périodicité de reporting</label>
              <select value={periodicite} onChange={e => setPeriodicite(e.target.value)} className={selectCls}>
                <option value="Mensuelle">Mensuelle</option><option value="Trimestrielle">Trimestrielle</option><option value="Semestrielle">Semestrielle</option><option value="Annuelle">Annuelle</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} /></div>
          </div>
          <button type="submit" disabled={create.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {create.isPending ? "Création…" : "Créer le projet"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
