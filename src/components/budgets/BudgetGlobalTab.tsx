import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/shared/StatCard";
import GhButton from "@/components/shared/GhButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const WP_ORDER = ["WP1", "WP2", "WP3", "WP4", "GC", "SE"];
const WP_LABELS: Record<string, string> = {
  WP1: "WP1 — Renforcement des compétences & structuration",
  WP2: "WP2 — Accès aux marchés & développement commercial",
  WP3: "WP3 — Accès au financement & investissement",
  WP4: "WP4 — Innovation, durabilité & écosystème",
  GC: "Gouvernance & Coordination générale",
  SE: "Suivi & Évaluation",
};

const inputCls = "flex h-9 w-full rounded-lg border border-input bg-secondary px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

function useProjectBudgetLines(projectId: string | null) {
  return useQuery({
    queryKey: ["project_budget_lines", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_budget_lines")
        .select("*")
        .eq("project_id", projectId!)
        .order("code", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

interface Props {
  projectId: string | null;
  currency: string;
  rate: number;
  fmt: (n: number) => string;
}

export default function BudgetGlobalTab({ projectId, currency, rate, fmt }: Props) {
  const { data: lines, isLoading } = useProjectBudgetLines(projectId);
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // New line form state
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newSection, setNewSection] = useState("WP1");
  const [newY1, setNewY1] = useState(0);
  const [newY2, setNewY2] = useState(0);
  const [newY3, setNewY3] = useState(0);
  const [newY4, setNewY4] = useState(0);
  const [newY5, setNewY5] = useState(0);

  const addMutation = useMutation({
    mutationFn: async () => {
      const total = newY1 + newY2 + newY3 + newY4 + newY5;
      const { error } = await supabase.from("project_budget_lines").insert({
        project_id: projectId!, code: newCode, label: newLabel, section: newSection,
        year1: newY1, year2: newY2, year3: newY3, year4: newY4, year5: newY5, total_cost: total,
        category: "direct", unit: "forfait", quantity: 1, unit_cost: total,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_budget_lines", projectId] });
      setShowAdd(false); setNewCode(""); setNewLabel(""); setNewSection("WP1");
      setNewY1(0); setNewY2(0); setNewY3(0); setNewY4(0); setNewY5(0);
      toast({ title: "✓ Ligne budgétaire ajoutée" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_budget_lines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_budget_lines", projectId] });
      setDeleteId(null);
      toast({ title: "✓ Ligne supprimée" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  if (!projectId) return <p className="text-center text-muted-foreground py-8 text-sm">Sélectionnez un projet</p>;
  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;

  const wpLines = lines?.filter(l => WP_ORDER.includes(l.section || "")) ?? [];

  if (!wpLines.length && !showAdd) return (
    <div className="text-center py-8">
      <p className="text-muted-foreground text-sm mb-3">Aucune donnée budgétaire.</p>
      <GhButton onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> Ajouter une ligne</GhButton>
    </div>
  );

  const c = (n: number) => n * rate;

  const grouped = WP_ORDER.map(wp => ({
    wp,
    label: WP_LABELS[wp] || wp,
    lines: wpLines.filter(l => l.section === wp),
  })).filter(g => g.lines.length > 0);

  const wpTotals = grouped.map(g => ({
    ...g,
    y1: g.lines.reduce((s, l) => s + (l.year1 || 0), 0),
    y2: g.lines.reduce((s, l) => s + (l.year2 || 0), 0),
    y3: g.lines.reduce((s, l) => s + (l.year3 || 0), 0),
    y4: g.lines.reduce((s, l) => s + (l.year4 || 0), 0),
    y5: g.lines.reduce((s, l) => s + (l.year5 || 0), 0),
    total: g.lines.reduce((s, l) => s + (l.total_cost || 0), 0),
  }));

  const grandTotal = wpTotals.reduce((s, w) => s + w.total, 0);
  const imprevu = grandTotal * 0.07;
  const totalGeneral = grandTotal + imprevu;
  const yearTotals = [1, 2, 3, 4, 5].map(y =>
    wpTotals.reduce((s, w) => s + (w as any)[`y${y}`], 0)
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard label="Coûts directs" value={`${fmt(c(grandTotal))} ${currency}`} note={`${wpLines.length} postes`} color="blue" />
        <StatCard label="Imprévus (7%)" value={`${fmt(c(imprevu))} ${currency}`} note="Standard bailleurs" color="amber" />
        <StatCard label="TOTAL GÉNÉRAL" value={`${fmt(c(totalGeneral))} ${currency}`} note="5 ans (2026–2030)" color="green" />
        <StatCard label="Consommation" value={`${grouped.length} WP`} note={`${wpLines.length} lignes`} color="purple" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-primary/5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-wider">
              Budget Prévisionnel — Récapitulatif Global par Composante et par Année (2026–2030)
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Sénégal — Régions de Kédougou, Kolda & Ziguinchor | Durée : 5 ans | Montants en {currency}
            </p>
          </div>
          <GhButton variant="secondary" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Ligne</GhButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-secondary">
                {["Code", "Composante / Catégorie", "An.1\n2026", "An.2\n2027", "An.3\n2028", "An.4\n2029", "An.5\n2030", "TOTAL\n5 ANS", "% Budget", "Genre", "Climat", ""].map(h => (
                  <th key={h} className="px-2.5 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground whitespace-pre-line">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wpTotals.map(g => (
                <>
                  <tr key={`h-${g.wp}`}>
                    <td colSpan={12} className="px-3 py-2 bg-primary/10 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">
                      {g.label}
                    </td>
                  </tr>
                  {g.lines.map((l: any) => (
                    <tr key={l.id} className="border-b border-border hover:bg-secondary/50 transition-colors group">
                      <td className="px-2.5 py-1.5">
                        <span className="font-mono text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{l.code}</span>
                      </td>
                      <td className="px-2.5 py-1.5 text-foreground max-w-[220px] truncate" title={l.label}>{l.label}</td>
                      {[l.year1, l.year2, l.year3, l.year4, l.year5].map((v: number, i: number) => (
                        <td key={i} className="px-2.5 py-1.5 text-right font-mono text-foreground text-[11px]">{fmt(c(v || 0))}</td>
                      ))}
                      <td className="px-2.5 py-1.5 text-right">
                        <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold text-[11px]">{fmt(c(l.total_cost || 0))}</span>
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono text-muted-foreground text-[11px]">
                        {grandTotal > 0 ? (((l.total_cost || 0) / grandTotal) * 100).toFixed(1) : "0"}%
                      </td>
                      <td className="px-2.5 py-1.5 text-center text-[11px]">{l.marker_gender || "○"}</td>
                      <td className="px-2.5 py-1.5 text-center text-[11px]">{l.marker_climate || "○"}</td>
                      <td className="px-2.5 py-1.5">
                        <button onClick={() => setDeleteId(l.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr key={`st-${g.wp}`} className="bg-secondary/60">
                    <td colSpan={2} className="px-2.5 py-1.5 text-right text-[11px] font-bold text-foreground">SOUS-TOTAL {g.wp}</td>
                    {[g.y1, g.y2, g.y3, g.y4, g.y5].map((v, i) => (
                      <td key={i} className="px-2.5 py-1.5 text-right font-mono font-bold text-foreground text-[11px]">{fmt(c(v))}</td>
                    ))}
                    <td className="px-2.5 py-1.5 text-right font-mono font-bold text-primary text-[11px]">{fmt(c(g.total))}</td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-muted-foreground text-[11px]">
                      {grandTotal > 0 ? ((g.total / grandTotal) * 100).toFixed(1) : "0"}%
                    </td>
                    <td colSpan={3} />
                  </tr>
                </>
              ))}

              <tr><td colSpan={12} className="h-2" /></tr>
              <tr className="bg-secondary/80">
                <td colSpan={2} className="px-2.5 py-2 text-right text-[11px] font-bold text-foreground uppercase">Sous-total coûts directs</td>
                {yearTotals.map((v, i) => (
                  <td key={i} className="px-2.5 py-2 text-right font-mono font-bold text-foreground">{fmt(c(v))}</td>
                ))}
                <td className="px-2.5 py-2 text-right font-mono font-bold text-primary">{fmt(c(grandTotal))}</td>
                <td className="px-2.5 py-2 text-right font-mono font-bold text-foreground">100%</td>
                <td colSpan={3} />
              </tr>
              <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                <td colSpan={2} className="px-2.5 py-2 text-right text-[11px] font-bold text-foreground">Imprévus & Contingences (7%)</td>
                {yearTotals.map((v, i) => (
                  <td key={i} className="px-2.5 py-2 text-right font-mono text-foreground">{fmt(c(v * 0.07))}</td>
                ))}
                <td className="px-2.5 py-2 text-right font-mono font-bold text-foreground">{fmt(c(imprevu))}</td>
                <td colSpan={4} className="px-2.5 py-2 text-muted-foreground text-[10px]">Standard bailleurs (AFD, UE, Enabel)</td>
              </tr>
              <tr className="bg-foreground/5">
                <td colSpan={2} className="px-2.5 py-2.5 text-right text-xs font-bold text-foreground uppercase">Total Général Projet (5 ans)</td>
                {yearTotals.map((v, i) => (
                  <td key={i} className="px-2.5 py-2.5 text-right font-mono font-bold text-foreground">{fmt(c(v * 1.07))}</td>
                ))}
                <td className="px-2.5 py-2.5 text-right font-mono text-sm font-bold text-primary">{fmt(c(totalGeneral))}</td>
                <td colSpan={4} />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border bg-secondary/30 space-y-1">
          <p className="text-[10px] font-mono text-muted-foreground font-bold uppercase">Légende des marqueurs :</p>
          <p className="text-[10px] text-muted-foreground">✓✓ = Contribution principale | ✓ = Contribution significative | ○ = Non applicable</p>
          <p className="text-[10px] text-muted-foreground">Montants en {currency}</p>
        </div>
      </div>

      {/* Add line dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="font-display">Ajouter une ligne budgétaire</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!newCode || !newLabel) return; addMutation.mutate(); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs font-medium text-foreground">Code *</label><input value={newCode} onChange={e => setNewCode(e.target.value)} required className={inputCls} placeholder="Ex: A.1.1.3" /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-foreground">Work Package</label>
                <select value={newSection} onChange={e => setNewSection(e.target.value)} className={inputCls}>
                  {WP_ORDER.map(wp => <option key={wp} value={wp}>{wp}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1"><label className="text-xs font-medium text-foreground">Libellé *</label><input value={newLabel} onChange={e => setNewLabel(e.target.value)} required className={inputCls} /></div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "An.1", val: newY1, set: setNewY1 },
                { label: "An.2", val: newY2, set: setNewY2 },
                { label: "An.3", val: newY3, set: setNewY3 },
                { label: "An.4", val: newY4, set: setNewY4 },
                { label: "An.5", val: newY5, set: setNewY5 },
              ].map(y => (
                <div key={y.label} className="space-y-1">
                  <label className="text-[10px] font-mono text-muted-foreground">{y.label}</label>
                  <input type="number" value={y.val} onChange={e => y.set(+e.target.value)} className={inputCls + " text-xs text-right"} />
                </div>
              ))}
            </div>
            <div className="text-right text-xs text-muted-foreground">
              Total : <span className="font-mono font-bold text-primary">{fmt((newY1 + newY2 + newY3 + newY4 + newY5) * rate)} {currency}</span>
            </div>
            <button type="submit" disabled={addMutation.isPending} className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
              {addMutation.isPending ? "Ajout…" : "Ajouter"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette ligne ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
