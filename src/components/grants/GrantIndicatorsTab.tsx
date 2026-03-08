import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useGrantIndicators, useDeleteIndicator, type GrantIndicator } from "@/hooks/useGrantDetail";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GhButton from "@/components/shared/GhButton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";
const categoryLabels: Record<string, string> = { output: "Produit", outcome: "Effet", impact: "Impact" };

export { useGrantIndicators };

export default function GrantIndicatorsTab({ grantId }: { grantId: string }) {
  const { data: indicators, isLoading } = useGrantIndicators(grantId);
  const deleteMutation = useDeleteIndicator(grantId);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<GrantIndicator | null>(null);
  const [deleteItem, setDeleteItem] = useState<GrantIndicator | null>(null);

  const grouped = (indicators ?? []).reduce((acc: Record<string, GrantIndicator[]>, ind) => {
    const cat = ind.category || "output";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ind);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-foreground">Indicateurs de performance</span>
          <span className="font-mono text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{indicators?.length ?? 0} indicateurs</span>
        </div>
        <GhButton onClick={() => { setEditItem(null); setShowForm(true); }}>+ Nouvel indicateur</GhButton>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : !indicators || indicators.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="text-2xl mb-2">📈</div>
          <div className="text-sm text-muted-foreground mb-3">Aucun indicateur défini</div>
          <GhButton onClick={() => { setEditItem(null); setShowForm(true); }}>+ Premier indicateur</GhButton>
        </div>
      ) : (
        <div className="space-y-4">
          {["output", "outcome", "impact"].map(cat => {
            const items = grouped[cat];
            if (!items || items.length === 0) return null;
            return (
              <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-secondary/50"><span className="text-xs font-bold text-foreground">{categoryLabels[cat] ?? cat}</span></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12.5px]">
                    <thead><tr className="bg-secondary">
                      {["Indicateur", "Unité", "Référence", "Cible", "Actuel", "Progrès", ""].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground tracking-wider border-b border-border whitespace-nowrap">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {items.map(ind => {
                        const pct = (ind.target_value ?? 0) > 0 ? Math.round(((ind.current_value ?? 0) / (ind.target_value ?? 1)) * 100) : 0;
                        return (
                          <tr key={ind.id} className="hover:bg-secondary/50 transition-colors group">
                            <td className="px-3 py-2.5 border-b border-border font-semibold text-foreground max-w-[200px]">
                              <div className="truncate">{ind.name}</div>
                              {ind.data_source && <div className="text-[10px] text-muted-foreground">{ind.data_source}</div>}
                            </td>
                            <td className="px-3 py-2.5 border-b border-border text-muted-foreground">{ind.unit ?? "—"}</td>
                            <td className="px-3 py-2.5 border-b border-border font-mono text-foreground">{ind.baseline_value ?? 0}</td>
                            <td className="px-3 py-2.5 border-b border-border font-mono font-semibold text-foreground">{ind.target_value ?? 0}</td>
                            <td className="px-3 py-2.5 border-b border-border font-mono font-semibold text-primary">{ind.current_value ?? 0}</td>
                            <td className="px-3 py-2.5 border-b border-border">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct > 50 ? "bg-primary" : "bg-amber-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <span className="font-mono text-[10px] text-muted-foreground">{pct}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 border-b border-border">
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditItem(ind); setShowForm(true); }} className="text-[11px] text-muted-foreground hover:text-foreground">✏️</button>
                                <button onClick={() => setDeleteItem(ind)} className="text-[11px] text-muted-foreground hover:text-destructive">🗑</button>
                              </div>
                            </td>
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
      )}

      <IndicatorFormDialog open={showForm} onOpenChange={setShowForm} grantId={grantId} editData={editItem} />

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => { if (!o) setDeleteItem(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Supprimer cet indicateur ?</AlertDialogTitle><AlertDialogDescription>L'indicateur « {deleteItem?.name} » sera définitivement supprimé.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function IndicatorFormDialog({ open, onOpenChange, grantId, editData }: {
  open: boolean; onOpenChange: (o: boolean) => void; grantId: string; editData: GrantIndicator | null;
}) {
  const qc = useQueryClient();
  const isEdit = !!editData;
  const [name, setName] = useState("");
  const [category, setCategory] = useState("output");
  const [unit, setUnit] = useState("");
  const [baselineValue, setBaselineValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [frequency, setFrequency] = useState("quarterly");
  const [responsible, setResponsible] = useState("");

  const handleOpenChange = (o: boolean) => {
    if (o && editData) {
      setName(editData.name ?? ""); setCategory(editData.category ?? "output"); setUnit(editData.unit ?? "");
      setBaselineValue(String(editData.baseline_value ?? "")); setTargetValue(String(editData.target_value ?? ""));
      setCurrentValue(String(editData.current_value ?? "")); setDataSource(editData.data_source ?? "");
      setFrequency(editData.frequency ?? "quarterly"); setResponsible(editData.responsible ?? "");
    } else if (o) {
      setName(""); setCategory("output"); setUnit(""); setBaselineValue(""); setTargetValue("");
      setCurrentValue(""); setDataSource(""); setFrequency("quarterly"); setResponsible("");
    }
    onOpenChange(o);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        grant_id: grantId, name, category, unit: unit || null,
        baseline_value: parseFloat(baselineValue) || 0, target_value: parseFloat(targetValue) || 0,
        current_value: parseFloat(currentValue) || 0, data_source: dataSource || null, frequency, responsible: responsible || null,
      };
      if (isEdit) { const { error } = await supabase.from("grant_indicators").update(payload).eq("id", editData.id); if (error) throw error; }
      else { const { error } = await supabase.from("grant_indicators").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grant_indicators", grantId] }); onOpenChange(false); toast({ title: isEdit ? "Indicateur modifié" : "Indicateur créé" }); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">{isEdit ? "Modifier l'indicateur" : "Nouvel indicateur"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Nom *</label><input value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="Ex: Nombre de bénéficiaires formés" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Catégorie</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                <option value="output">Produit</option><option value="outcome">Effet</option><option value="impact">Impact</option>
              </select></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Unité</label><input value={unit} onChange={e => setUnit(e.target.value)} className={inputCls} placeholder="Ex: personnes" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Référence</label><input type="number" value={baselineValue} onChange={e => setBaselineValue(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Cible</label><input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Actuel</label><input type="number" value={currentValue} onChange={e => setCurrentValue(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Fréquence</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} className={inputCls}>
                <option value="monthly">Mensuel</option><option value="quarterly">Trimestriel</option><option value="semiannual">Semestriel</option><option value="annual">Annuel</option>
              </select></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Responsable</label><input value={responsible} onChange={e => setResponsible(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Source de données</label><input value={dataSource} onChange={e => setDataSource(e.target.value)} className={inputCls} placeholder="Ex: Enquête terrain" /></div>
          <button type="submit" disabled={saveMutation.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {saveMutation.isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer l'indicateur"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
