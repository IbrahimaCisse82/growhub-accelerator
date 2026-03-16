import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

const statusMap: Record<string, { label: string; color: "green" | "amber" | "blue" | "gray" }> = {
  brouillon: { label: "Brouillon", color: "gray" },
  soumis: { label: "Soumis", color: "blue" },
  approuve: { label: "Approuvé", color: "green" },
  rejete: { label: "Rejeté", color: "amber" },
};

const motifOptions = [
  "Réallocation entre postes",
  "Extension de délai",
  "Modification de montant",
  "Ajout d'activité",
  "Réduction de périmètre",
];

interface Addendum {
  id: string;
  grant_id: string;
  num: number;
  date: string | null;
  motif: string | null;
  justification: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AddendumLine {
  id: string;
  addendum_id: string;
  budget_line_code: string;
  delta_amount: number;
  created_at: string;
}

// Hooks
export function useGrantAddendums(grantId: string | undefined) {
  return useQuery({
    queryKey: ["grant_addendums", grantId],
    enabled: !!grantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grant_addendums")
        .select("*")
        .eq("grant_id", grantId!)
        .order("num", { ascending: true });
      if (error) throw error;
      return data as Addendum[];
    },
  });
}

function useAddendumLines(addendumId: string | undefined) {
  return useQuery({
    queryKey: ["grant_addendum_lines", addendumId],
    enabled: !!addendumId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grant_addendum_lines")
        .select("*")
        .eq("addendum_id", addendumId!);
      if (error) throw error;
      return data as AddendumLine[];
    },
  });
}

interface BudgetLine {
  code: string | null;
  label: string;
  section: string | null;
  quantity: number | null;
  unit_cost: number | null;
  allocation_pct: number | null;
}

export default function GrantAddendumTab({ grantId, budgetLines }: { grantId: string; budgetLines: BudgetLine[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: addendums, isLoading } = useGrantAddendums(grantId);
  const [selectedAddendum, setSelectedAddendum] = useState<Addendum | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Addendum | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const nextNum = (addendums?.length ?? 0) + 1;
      const { error } = await supabase.from("grant_addendums").insert({
        grant_id: grantId, num: nextNum, created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grant_addendums", grantId] });
      toast({ title: "Addendum créé" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grant_addendums").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grant_addendums", grantId] });
      setDeleteItem(null);
      if (selectedAddendum && deleteItem && selectedAddendum.id === deleteItem.id) setSelectedAddendum(null);
      toast({ title: "Addendum supprimé" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("grant_addendums").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grant_addendums", grantId] });
      toast({ title: "Statut mis à jour" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-foreground">Addendums / Amendements budgétaires</span>
          <span className="font-mono text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{addendums?.length ?? 0}</span>
        </div>
        <GhButton onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          + Nouvel addendum
        </GhButton>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : !addendums || addendums.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="text-2xl mb-2">📝</div>
          <div className="text-sm text-muted-foreground mb-3">Aucun addendum budgétaire</div>
          <GhButton onClick={() => createMutation.mutate()}>+ Premier addendum</GhButton>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Addendum list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {addendums.map(a => {
              const st = statusMap[a.status] ?? statusMap.brouillon;
              const isActive = selectedAddendum?.id === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAddendum(a)}
                  className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/30 ${isActive ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                      N° {String(a.num).padStart(2, "0")}
                    </span>
                    <Pill color={st.color}>{st.label}</Pill>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{a.motif || "Motif non renseigné"}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-1">{a.date ?? "Date non définie"}</div>
                  <div className="flex gap-1 mt-3">
                    {a.status === "brouillon" && (
                      <button onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: a.id, status: "soumis" }); }}
                        className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 font-medium">Soumettre</button>
                    )}
                    {a.status === "soumis" && (
                      <button onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: a.id, status: "approuve" }); }}
                        className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20 font-medium">✓ Approuver</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setSelectedAddendum(a); setShowForm(true); }}
                      className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground hover:text-foreground">✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteItem(a); }}
                      className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground hover:text-destructive">🗑</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel for selected addendum */}
          {selectedAddendum && (
            <AddendumDetailPanel
              addendum={selectedAddendum}
              budgetLines={budgetLines}
              grantId={grantId}
            />
          )}
        </div>
      )}

      {/* Edit form dialog */}
      {selectedAddendum && (
        <AddendumFormDialog
          open={showForm}
          onOpenChange={setShowForm}
          addendum={selectedAddendum}
          grantId={grantId}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => { if (!o) setDeleteItem(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet addendum ?</AlertDialogTitle>
            <AlertDialogDescription>L'addendum N° {String(deleteItem?.num ?? 0).padStart(2, "0")} sera définitivement supprimé.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Addendum Detail with Delta Table ─────────────────────────────
function AddendumDetailPanel({ addendum, budgetLines, grantId }: {
  addendum: Addendum; budgetLines: BudgetLine[]; grantId: string;
}) {
  const qc = useQueryClient();
  const { data: lines } = useAddendumLines(addendum.id);
  const [deltas, setDeltas] = useState<Record<string, number>>({});

  // Merge DB lines into deltas on load
  const getEffectiveDelta = (code: string) => {
    if (deltas[code] !== undefined) return deltas[code];
    const dbLine = lines?.find(l => l.budget_line_code === code);
    return dbLine?.delta_amount ?? 0;
  };

  const linesA = budgetLines.filter(l => l.section === "A");
  const linesB = budgetLines.filter(l => l.section === "B");
  const lineTotal = (l: BudgetLine) => (l.quantity || 0) * (l.unit_cost || 0) * ((l.allocation_pct || 100) / 100);

  const totalDeltaA = linesA.reduce((s, l) => s + getEffectiveDelta(l.code ?? ""), 0);
  const totalDeltaB = linesB.reduce((s, l) => s + getEffectiveDelta(l.code ?? ""), 0);
  const totalDelta = totalDeltaA + totalDeltaB;

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete existing lines and re-insert
      await supabase.from("grant_addendum_lines").delete().eq("addendum_id", addendum.id);
      const allCodes = [...linesA, ...linesB].map(l => l.code ?? "").filter(Boolean);
      const linesToInsert = allCodes
        .map(code => ({ addendum_id: addendum.id, budget_line_code: code, delta_amount: getEffectiveDelta(code) }))
        .filter(l => l.delta_amount !== 0);
      if (linesToInsert.length > 0) {
        const { error } = await supabase.from("grant_addendum_lines").insert(linesToInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grant_addendum_lines", addendum.id] });
      toast({ title: "Amendement sauvegardé" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const renderRow = (l: BudgetLine) => {
    const code = l.code ?? "";
    const budgetBefore = lineTotal(l);
    const delta = getEffectiveDelta(code);
    const newBudget = budgetBefore + delta;

    return (
      <tr key={code} className="border-b border-border hover:bg-secondary/50 transition-colors">
        <td className="px-3 py-2">
          <span className="font-mono text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{code}</span>
        </td>
        <td className="px-3 py-2 text-foreground text-[12px]">{l.label}</td>
        <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(budgetBefore)}</td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={delta || ""}
            onChange={e => setDeltas(prev => ({ ...prev, [code]: parseFloat(e.target.value) || 0 }))}
            className="w-[100px] h-8 rounded border border-input bg-green-500/5 px-2 py-1 text-sm font-mono text-right text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="0"
          />
        </td>
        <td className="px-3 py-2 text-right">
          <span className={`font-mono text-[12px] px-2 py-0.5 rounded font-semibold ${delta > 0 ? "bg-green-500/10 text-green-500" : delta < 0 ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>
            {fmt(newBudget)}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-foreground">
            Addendum N° {String(addendum.num).padStart(2, "0")} — Tableau de modification
          </span>
          {addendum.motif && <span className="text-[10px] text-muted-foreground">({addendum.motif})</span>}
        </div>
        <GhButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Sauvegarde…" : "💾 Sauvegarder"}
        </GhButton>
      </div>

      {/* Delta summary KPIs */}
      <div className="grid grid-cols-3 gap-0 border-b border-border">
        {[
          { label: "Variation Section A", val: totalDeltaA, color: totalDeltaA >= 0 ? "text-green-500" : "text-destructive" },
          { label: "Variation Section B", val: totalDeltaB, color: totalDeltaB >= 0 ? "text-green-500" : "text-destructive" },
          { label: "Variation totale", val: totalDelta, color: totalDelta === 0 ? "text-primary" : totalDelta > 0 ? "text-green-500" : "text-destructive" },
        ].map(kpi => (
          <div key={kpi.label} className="px-4 py-3 border-r border-border last:border-r-0 text-center">
            <div className="text-[10px] text-muted-foreground font-mono uppercase">{kpi.label}</div>
            <div className={`font-mono text-lg font-bold ${kpi.color}`}>
              {kpi.val >= 0 ? "+" : ""}{fmt(kpi.val)} €
            </div>
            <div className="text-[10px] text-muted-foreground">
              {kpi.val === 0 ? "Budget neutre" : kpi.val > 0 ? "Augmentation" : "Réduction"}
            </div>
          </div>
        ))}
      </div>

      {/* Delta table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-secondary">
              <th className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground w-[80px]">Code</th>
              <th className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground">Description</th>
              <th className="px-3 py-2 text-right text-[10px] font-mono uppercase text-muted-foreground w-[110px]">Budget avant</th>
              <th className="px-3 py-2 text-[10px] font-mono uppercase text-muted-foreground w-[120px]" style={{ background: "hsl(var(--primary) / 0.05)" }}>Variation ±</th>
              <th className="px-3 py-2 text-right text-[10px] font-mono uppercase text-muted-foreground w-[120px]" style={{ background: "hsl(var(--primary) / 0.05)" }}>Nouveau budget</th>
            </tr>
          </thead>
          <tbody>
            {linesA.length > 0 && (
              <>
                <tr><td colSpan={5} className="px-3 py-2 bg-primary/10 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">A — Coûts opérationnels</td></tr>
                {linesA.map(renderRow)}
                <tr className="bg-secondary/50">
                  <td colSpan={3} className="px-3 py-1.5 text-right text-[11px] font-bold text-foreground">Sous-total A variation</td>
                  <td colSpan={2} className="px-3 py-1.5 text-right">
                    <span className={`font-mono font-bold ${totalDeltaA >= 0 ? "text-green-500" : "text-destructive"}`}>{totalDeltaA >= 0 ? "+" : ""}{fmt(totalDeltaA)} €</span>
                  </td>
                </tr>
              </>
            )}
            {linesB.length > 0 && (
              <>
                <tr><td colSpan={5} className="px-3 py-2 bg-accent/10 text-accent-foreground font-mono text-[10px] font-bold uppercase tracking-wider">B — Frais de gestion</td></tr>
                {linesB.map(renderRow)}
                <tr className="bg-secondary/50">
                  <td colSpan={3} className="px-3 py-1.5 text-right text-[11px] font-bold text-foreground">Sous-total B variation</td>
                  <td colSpan={2} className="px-3 py-1.5 text-right">
                    <span className={`font-mono font-bold ${totalDeltaB >= 0 ? "text-green-500" : "text-destructive"}`}>{totalDeltaB >= 0 ? "+" : ""}{fmt(totalDeltaB)} €</span>
                  </td>
                </tr>
              </>
            )}
            <tr className="bg-foreground/5">
              <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-bold text-foreground uppercase">Variation totale budget</td>
              <td colSpan={2} className="px-3 py-2.5 text-right">
                <span className={`font-mono text-sm font-bold ${totalDelta === 0 ? "text-primary" : totalDelta > 0 ? "text-green-500" : "text-destructive"}`}>
                  {totalDelta >= 0 ? "+" : ""}{fmt(totalDelta)} €
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Edit Addendum Form Dialog ────────────────────────────────────
function AddendumFormDialog({ open, onOpenChange, addendum, grantId }: {
  open: boolean; onOpenChange: (o: boolean) => void; addendum: Addendum; grantId: string;
}) {
  const qc = useQueryClient();
  const [date, setDate] = useState(addendum.date ?? "");
  const [motif, setMotif] = useState(addendum.motif ?? "");
  const [justification, setJustification] = useState(addendum.justification ?? "");
  const [status, setStatus] = useState(addendum.status ?? "brouillon");

  const handleOpenChange = (o: boolean) => {
    if (o) {
      setDate(addendum.date ?? ""); setMotif(addendum.motif ?? "");
      setJustification(addendum.justification ?? ""); setStatus(addendum.status ?? "brouillon");
    }
    onOpenChange(o);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("grant_addendums").update({
        date: date || null, motif: motif || null, justification: justification || null, status,
      }).eq("id", addendum.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grant_addendums", grantId] });
      onOpenChange(false);
      toast({ title: "Addendum modifié" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Modifier l'addendum N° {String(addendum.num).padStart(2, "0")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date de soumission</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                <option value="brouillon">Brouillon</option><option value="soumis">Soumis</option>
                <option value="approuve">Approuvé</option><option value="rejete">Rejeté</option>
              </select>
            </div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Motif principal</label>
            <select value={motif} onChange={e => setMotif(e.target.value)} className={inputCls}>
              <option value="">— Sélectionner —</option>
              {motifOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Justification détaillée</label>
            <textarea value={justification} onChange={e => setJustification(e.target.value)} rows={3} className={inputCls + " h-auto"} />
          </div>
          <button type="submit" disabled={saveMutation.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {saveMutation.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
