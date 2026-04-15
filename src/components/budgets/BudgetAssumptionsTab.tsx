import { useState } from "react";
import { useBudgetAssumptions } from "@/hooks/useBudgetDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";

const SECTION_LABELS: Record<string, string> = {
  general: "Paramètres Généraux",
  unit_costs: "Paramètres de Coûts Unitaires (Indicatifs)",
  genre_climate: "Répartition Genre & Climat (OCDE-DAC)",
  funding: "Sources de Financement Potentielles",
};

const SECTION_COLORS: Record<string, string> = {
  general: "bg-primary/5 text-primary",
  unit_costs: "bg-amber-500/5 text-amber-700 dark:text-amber-400",
  genre_climate: "bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
  funding: "bg-violet-500/5 text-violet-700 dark:text-violet-400",
};

export default function BudgetAssumptionsTab({ projectId }: { projectId: string | null }) {
  const { data: assumptions, isLoading } = useBudgetAssumptions(projectId);
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ value: string; detail: string; note: string }>({ value: "", detail: "", note: "" });

  if (!projectId) return <p className="text-center text-muted-foreground py-8 text-sm">Sélectionnez un projet</p>;
  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;
  if (!assumptions?.length) return <p className="text-center text-muted-foreground py-8 text-sm">Aucune hypothèse enregistrée</p>;

  const sections = [...new Set(assumptions.map(a => a.section))];

  const startEdit = (row: any) => {
    setEditingId(row.id);
    setEditData({ value: row.value || "", detail: row.detail || "", note: row.note || "" });
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from("project_budget_assumptions").update({ ...editData, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Paramètre mis à jour");
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ["project_budget_assumptions"] });
  };

  return (
    <div className="space-y-6">
      {sections.map(section => {
        const items = assumptions.filter(a => a.section === section);
        return (
          <div key={section} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className={`px-4 py-2.5 border-b border-border ${SECTION_COLORS[section] || "bg-secondary"}`}>
              <span className="text-xs font-bold uppercase tracking-wider">{SECTION_LABELS[section] || section}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-secondary">
                    {["Paramètre", "Valeur", "Détail", "Note", ""].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(a => {
                    const isEditing = editingId === a.id;
                    return (
                      <tr key={a.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="px-3 py-2 font-medium text-foreground">{a.label}</td>
                        {isEditing ? (
                          <>
                            <td className="px-1 py-1"><input className="w-full text-xs bg-background border rounded px-2 py-1" value={editData.value} onChange={e => setEditData({ ...editData, value: e.target.value })} /></td>
                            <td className="px-1 py-1"><input className="w-full text-xs bg-background border rounded px-2 py-1" value={editData.detail} onChange={e => setEditData({ ...editData, detail: e.target.value })} /></td>
                            <td className="px-1 py-1"><input className="w-full text-xs bg-background border rounded px-2 py-1" value={editData.note} onChange={e => setEditData({ ...editData, note: e.target.value })} /></td>
                            <td className="px-2 py-2 flex gap-1">
                              <button onClick={() => saveEdit(a.id)} className="text-green-600 hover:bg-green-100 rounded p-0.5"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingId(null)} className="text-red-500 hover:bg-red-100 rounded p-0.5"><X className="w-3.5 h-3.5" /></button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2"><span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold text-[11px]">{a.value}</span></td>
                            <td className="px-3 py-2 text-muted-foreground">{a.detail}</td>
                            <td className="px-3 py-2 text-muted-foreground text-[11px]">{a.note}</td>
                            <td className="px-2 py-2"><button onClick={() => startEdit(a)} className="text-muted-foreground hover:text-primary hover:bg-secondary rounded p-0.5"><Pencil className="w-3.5 h-3.5" /></button></td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
