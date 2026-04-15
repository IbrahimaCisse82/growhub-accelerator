import { useState } from "react";
import { useBudgetDetails } from "@/hooks/useBudgetDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import NomenclatureSelect from "@/components/budgets/NomenclatureSelect";

const WP_LABELS: Record<string, string> = {
  WP1: "WP1 — Renforcement des compétences & structuration",
  WP2: "WP2 — Accès aux marchés & développement commercial",
  WP3: "WP3 — Accès au financement & investissement",
  WP4: "WP4 — Innovation, durabilité & écosystème",
  GC: "Gouvernance & Coordination générale",
  SE: "Suivi & Évaluation",
};

interface Props {
  projectId: string | null;
  currency?: string;
  rate?: number;
  fmt?: (n: number) => string;
}

export default function BudgetDetailTab({ projectId, currency = "USD", rate = 1, fmt: fmtProp }: Props) {
  const { data: details, isLoading } = useBudgetDetails(projectId);
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const fmt = fmtProp || ((n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n));
  const c = (n: number) => n * rate;

  if (!projectId) return <p className="text-center text-muted-foreground py-8 text-sm">Sélectionnez un projet</p>;
  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;
  if (!details?.length) return <p className="text-center text-muted-foreground py-8 text-sm">Aucun détail budgétaire</p>;

  const workPackages = [...new Set(details.map(d => d.work_package))];

  const startEdit = (row: any) => {
    setEditingId(row.id);
    setEditData({ quantity: row.quantity, unit_cost: row.unit_cost, year_1: row.year_1, year_2: row.year_2, year_3: row.year_3, year_4: row.year_4, year_5: row.year_5, nomenclature_code: (row as any).nomenclature_code || "" });
  };

  const saveEdit = async (id: string) => {
    const total = (editData.year_1 || 0) + (editData.year_2 || 0) + (editData.year_3 || 0) + (editData.year_4 || 0) + (editData.year_5 || 0);
    const { error } = await supabase.from("project_budget_details").update({ ...editData, total, nomenclature_code: editData.nomenclature_code || null, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Ligne mise à jour");
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ["project_budget_details"] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl px-4 py-3 bg-primary/5">
        <p className="text-xs font-bold text-primary uppercase tracking-wider">
          Budget Détaillé par Work Package et par Activité ({currency})
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Ventilation détaillée par activité, catégorie de dépenses et année | Source : Document PAERID v.finale 2025
        </p>
      </div>

      {workPackages.map(wp => {
        const lines = details.filter(d => d.work_package === wp);
        const wpTotal = lines.reduce((s, l) => s + (l.total || 0), 0);
        return (
          <div key={wp} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-primary/5 flex items-center justify-between">
              <span className="text-xs font-bold text-primary">{WP_LABELS[wp] || wp}</span>
              <span className="font-mono text-xs text-primary font-bold">{fmt(c(wpTotal))} {currency}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-secondary">
                    {["Code", "Activité / Description", "Catégorie", "Unité", "Qté", "Coût Unit.", "An.1 2026", "An.2 2027", "An.3 2028", "An.4 2029", "An.5 2030", "TOTAL", ""].map(h => (
                      <th key={h} className="px-2.5 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map(l => {
                    const isEditing = editingId === l.id;
                    return (
                      <tr key={l.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="px-2.5 py-2"><span className="font-mono text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{l.code}</span></td>
                        <td className="px-2.5 py-2 text-foreground max-w-[200px] truncate" title={l.activity}>{l.activity}</td>
                        <td className="px-2.5 py-2 text-muted-foreground text-[11px]">{l.category}</td>
                        <td className="px-2.5 py-2 text-muted-foreground">{l.unit}</td>
                        {isEditing ? (
                          <>
                            <td className="px-1 py-1"><input type="number" className="w-14 text-right text-xs bg-background border rounded px-1 py-0.5" value={editData.quantity} onChange={e => setEditData({ ...editData, quantity: +e.target.value })} /></td>
                            <td className="px-1 py-1"><input type="number" className="w-16 text-right text-xs bg-background border rounded px-1 py-0.5" value={editData.unit_cost} onChange={e => setEditData({ ...editData, unit_cost: +e.target.value })} /></td>
                            {[1, 2, 3, 4, 5].map(y => (
                              <td key={y} className="px-1 py-1"><input type="number" className="w-16 text-right text-xs bg-background border rounded px-1 py-0.5" value={editData[`year_${y}`]} onChange={e => setEditData({ ...editData, [`year_${y}`]: +e.target.value })} /></td>
                            ))}
                            <td className="px-2.5 py-2 text-right font-mono text-foreground">{fmt(c((editData.year_1||0)+(editData.year_2||0)+(editData.year_3||0)+(editData.year_4||0)+(editData.year_5||0)))}</td>
                            <td className="px-2 py-2 flex gap-1">
                              <button onClick={() => saveEdit(l.id)} className="text-green-600 hover:bg-green-100 rounded p-0.5"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingId(null)} className="text-red-500 hover:bg-red-100 rounded p-0.5"><X className="w-3.5 h-3.5" /></button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-2.5 py-2 text-right font-mono text-foreground">{l.quantity}</td>
                            <td className="px-2.5 py-2 text-right font-mono text-foreground">{fmt(c(l.unit_cost || 0))}</td>
                            {[l.year_1, l.year_2, l.year_3, l.year_4, l.year_5].map((v, i) => (
                              <td key={i} className="px-2.5 py-2 text-right font-mono text-foreground">{fmt(c(v || 0))}</td>
                            ))}
                            <td className="px-2.5 py-2 text-right"><span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{fmt(c(l.total || 0))}</span></td>
                            <td className="px-2 py-2"><button onClick={() => startEdit(l)} className="text-muted-foreground hover:text-primary hover:bg-secondary rounded p-0.5"><Pencil className="w-3.5 h-3.5" /></button></td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  <tr className="bg-secondary/60">
                    <td colSpan={11} className="px-2.5 py-2 text-right text-[11px] font-bold text-foreground">Sous-total {wp}</td>
                    <td className="px-2.5 py-2 text-right font-mono font-bold text-primary">{fmt(c(wpTotal))} {currency}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      <div className="bg-foreground/5 rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-bold text-foreground uppercase">Total général (hors imprévus)</span>
        <span className="font-mono text-lg font-bold text-primary">{fmt(c(details.reduce((s, l) => s + (l.total || 0), 0)))} {currency}</span>
      </div>
    </div>
  );
}
