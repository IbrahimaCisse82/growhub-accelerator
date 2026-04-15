import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type GrantStatus = Database["public"]["Enums"]["grant_status"];

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";
const selectCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors appearance-none cursor-pointer";

interface Grant {
  id: string;
  name: string;
  code: string;
  amount_total: number;
  amount_disbursed?: number | null;
  organization?: string | null;
  org_type?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  convention?: string | null;
  pays?: string | null;
  currency?: string | null;
  taux_change?: number | null;
  periodicite?: string | null;
  risk_score?: number | null;
  prepared_by?: string | null;
  submit_date?: string | null;
  version?: string | null;
  frais_structure_pct?: number | null;
  contribution_propre?: number | null;
  politique_change?: string | null;
}

export default function EditGrantDialog({ grant, children, open: controlledOpen, onOpenChange }: { grant: Grant; children?: React.ReactNode; open?: boolean; onOpenChange?: (o: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const [name, setName] = useState(grant.name);
  const [code, setCode] = useState(grant.code);
  const [convention, setConvention] = useState(grant.convention ?? "");
  const [amountTotal, setAmountTotal] = useState(String(grant.amount_total));
  const [amountDisbursed, setAmountDisbursed] = useState(String(grant.amount_disbursed ?? 0));
  const [organization, setOrganization] = useState(grant.organization ?? "");
  const [orgType, setOrgType] = useState(grant.org_type ?? "");
  const [description, setDescription] = useState(grant.description ?? "");
  const [startDate, setStartDate] = useState(grant.start_date ?? "");
  const [endDate, setEndDate] = useState(grant.end_date ?? "");
  const [status, setStatus] = useState(grant.status);
  const [pays, setPays] = useState(grant.pays ?? "");
  const [devise, setDevise] = useState(grant.currency ?? "EUR");
  const [tauxChange, setTauxChange] = useState(String(grant.taux_change ?? 655.957));
  const [periodicite, setPeriodicite] = useState(grant.periodicite ?? "Trimestrielle");
  const [riskScore, setRiskScore] = useState(String(grant.risk_score ?? ""));
  const [preparedBy, setPreparedBy] = useState(grant.prepared_by ?? "");
  const [submitDate, setSubmitDate] = useState(grant.submit_date ?? "");
  const [version, setVersion] = useState(grant.version ?? "");
  const [fraisStructure, setFraisStructure] = useState(String(grant.frais_structure_pct ?? ""));
  const [contributionPropre, setContributionPropre] = useState(String(grant.contribution_propre ?? ""));
  const [politiqueChange, setPolitiqueChange] = useState(grant.politique_change ?? "");
  const qc = useQueryClient();

  useEffect(() => {
    if (open) {
      setName(grant.name); setCode(grant.code); setConvention(grant.convention ?? "");
      setAmountTotal(String(grant.amount_total)); setAmountDisbursed(String(grant.amount_disbursed ?? 0));
      setOrganization(grant.organization ?? ""); setOrgType(grant.org_type ?? "");
      setDescription(grant.description ?? ""); setStartDate(grant.start_date ?? "");
      setEndDate(grant.end_date ?? ""); setStatus(grant.status);
      setPays(grant.pays ?? ""); setDevise(grant.currency ?? "EUR");
      setTauxChange(String(grant.taux_change ?? 655.957)); setPeriodicite(grant.periodicite ?? "Trimestrielle");
      setRiskScore(String(grant.risk_score ?? "")); setPreparedBy(grant.prepared_by ?? "");
      setSubmitDate(grant.submit_date ?? ""); setVersion(grant.version ?? "");
      setFraisStructure(String((grant as any).frais_structure_pct ?? ""));
      setContributionPropre(String((grant as any).contribution_propre ?? ""));
      setPolitiqueChange((grant as any).politique_change ?? "");
    }
  }, [open, grant]);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("grants").update({
        name, code, convention: convention || null,
        amount_total: parseFloat(amountTotal) || 0,
        amount_disbursed: parseFloat(amountDisbursed) || 0,
        organization: organization || null, org_type: orgType || null,
        description: description || null,
        start_date: startDate || null, end_date: endDate || null,
        status: status as GrantStatus,
        pays: pays || null, currency: devise || "EUR",
        taux_change: parseFloat(tauxChange) || 655.957,
        periodicite: periodicite || "Trimestrielle",
        risk_score: parseFloat(riskScore) || null,
        prepared_by: preparedBy || null, submit_date: submitDate || null, version: version || null,
        frais_structure_pct: parseFloat(fraisStructure) || 0,
        contribution_propre: parseFloat(contributionPropre) || 0,
        politique_change: politiqueChange || null,
      } as any).eq("id", grant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grants"] });
      qc.invalidateQueries({ queryKey: ["grant_detail", grant.id] });
      setOpen(false);
      toast({ title: "Projet mis à jour" });
    },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  const statusOptions = [
    { value: "draft", label: "Brouillon" }, { value: "active", label: "Active" },
    { value: "disbursing", label: "Décaissement" }, { value: "closing", label: "Clôture" },
    { value: "closed", label: "Clôturé" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Modifier le projet</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); update.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">N° Convention</label><input value={convention} onChange={e => setConvention(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Titre du projet *</label><input value={name} onChange={e => setName(e.target.value)} required className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Code *</label><input value={code} onChange={e => setCode(e.target.value)} required className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Version</label><input value={version} onChange={e => setVersion(e.target.value)} className={inputCls} placeholder="v1.0" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Organisation</label><input value={organization} onChange={e => setOrganization(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Type d'organisation</label>
              <select value={orgType} onChange={e => setOrgType(e.target.value)} className={selectCls}>
                <option value="">—</option><option value="ONG">ONG</option><option value="Association">Association</option><option value="Entreprise">Entreprise</option><option value="Institution">Institution publique</option><option value="Autre">Autre</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Pays</label><input value={pays} onChange={e => setPays(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Devise</label>
              <select value={devise} onChange={e => setDevise(e.target.value)} className={selectCls}>
                <option value="XOF">XOF (FCFA)</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
              </select>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Taux (→ EUR)</label><input type="number" step="0.001" value={tauxChange} onChange={e => setTauxChange(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Montant total (EUR) *</label><input type="number" value={amountTotal} onChange={e => setAmountTotal(e.target.value)} required className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Décaissé (EUR)</label><input type="number" value={amountDisbursed} onChange={e => setAmountDisbursed(e.target.value)} className={inputCls} /></div>
          </div>

          {/* New Enabel fields */}
          <div className="border-t border-border pt-3">
            <div className="text-[11px] font-bold text-foreground mb-2 uppercase tracking-wider">Paramètres Enabel</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><label className="text-sm font-medium text-foreground">Frais de structure (%)</label><input type="number" step="0.1" min="0" max="100" value={fraisStructure} onChange={e => setFraisStructure(e.target.value)} className={inputCls} placeholder="Ex: 7" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-foreground">Contribution propre (€)</label><input type="number" value={contributionPropre} onChange={e => setContributionPropre(e.target.value)} className={inputCls} placeholder="Cofinancement" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-foreground">Politique de change</label>
                <select value={politiqueChange} onChange={e => setPolitiqueChange(e.target.value)} className={selectCls}>
                  <option value="">— Sélectionner —</option>
                  <option value="taux_moyen_pondere">Taux moyen pondéré des versements</option>
                  <option value="taux_fixe_convention">Taux fixe de la convention</option>
                  <option value="taux_jour">Taux du jour (transaction)</option>
                  <option value="procedure_interne">Procédure interne validée</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Périodicité</label>
              <select value={periodicite} onChange={e => setPeriodicite(e.target.value)} className={selectCls}>
                <option value="Mensuelle">Mensuelle</option><option value="Trimestrielle">Trimestrielle</option><option value="Semestrielle">Semestrielle</option><option value="Annuelle">Annuelle</option>
              </select>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Score risque (0–100)</label><input type="number" min="0" max="100" value={riskScore} onChange={e => setRiskScore(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Préparé par</label><input value={preparedBy} onChange={e => setPreparedBy(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date soumission</label><input value={submitDate} onChange={e => setSubmitDate(e.target.value)} className={inputCls} placeholder="JJ/MM/AAAA" /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputCls + " h-auto"} /></div>
          <button type="submit" disabled={update.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
