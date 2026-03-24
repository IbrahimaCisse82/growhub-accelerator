import { useState } from "react";
import { useStartupKpis, useAddStartupKpi } from "@/hooks/useStartupKpis";
import { useAuth } from "@/hooks/useAuth";
import GhButton from "@/components/shared/GhButton";
import EmptyState from "@/components/shared/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultMetrics = ["Chiffre d'affaires", "Nombre de clients", "Employés", "Taux de rétention", "MRR", "Levée de fonds", "CAC", "LTV"];

export default function StartupKpiTab({ startupId }: { startupId: string }) {
  const { data: kpis, isLoading } = useStartupKpis(startupId);
  const addKpi = useAddStartupKpi();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ metric_name: "", metric_value: "", unit: "XOF", period: "monthly", recorded_at: new Date().toISOString().split("T")[0], notes: "" });

  const handleSubmit = () => {
    if (!form.metric_name || !form.metric_value) return;
    addKpi.mutate({ startup_id: startupId, metric_name: form.metric_name, metric_value: Number(form.metric_value), unit: form.unit || undefined, period: form.period, recorded_at: form.recorded_at, notes: form.notes || undefined }, {
      onSuccess: () => { setOpen(false); setForm({ metric_name: "", metric_value: "", unit: "XOF", period: "monthly", recorded_at: new Date().toISOString().split("T")[0], notes: "" }); }
    });
  };

  // Group by metric
  const grouped = (kpis ?? []).reduce<Record<string, typeof kpis>>((acc, k) => {
    if (!acc[k.metric_name]) acc[k.metric_name] = [];
    acc[k.metric_name]!.push(k);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Indicateurs de performance</h3>
        <GhButton size="sm" variant="primary" onClick={() => setOpen(true)}>+ KPI</GhButton>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-secondary rounded-lg" />)}</div>
      ) : !kpis?.length ? (
        <EmptyState icon="📊" title="Aucun KPI" description="Suivez les métriques clés de cette entreprise." />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([name, entries]) => {
            const sorted = entries!.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
            const latest = sorted[sorted.length - 1];
            const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
            const trend = prev ? ((Number(latest.metric_value) - Number(prev.metric_value)) / Number(prev.metric_value)) * 100 : null;

            return (
              <div key={name} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-bold text-foreground">{name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-foreground">{Number(latest.metric_value).toLocaleString("fr-FR")} {latest.unit ?? ""}</span>
                    {trend !== null && (
                      <span className={`text-[11px] font-mono ${trend >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                        {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                {/* Simple sparkline bar chart */}
                <div className="flex items-end gap-1 h-10 mt-2">
                  {sorted.slice(-12).map((entry, i) => {
                    const max = Math.max(...sorted.slice(-12).map(e => Number(e.metric_value)));
                    const pct = max > 0 ? (Number(entry.metric_value) / max) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 min-w-0 group relative">
                        <div className="bg-primary/20 hover:bg-primary/40 rounded-t transition-colors" style={{ height: `${Math.max(pct, 4)}%` }} />
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                          {Number(entry.metric_value).toLocaleString("fr-FR")} · {new Date(entry.recorded_at).toLocaleDateString("fr-FR", { month: "short" })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">
                  {sorted.length} enregistrement{sorted.length > 1 ? "s" : ""} · dernière mise à jour {new Date(latest.recorded_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un KPI</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Métrique *</Label>
              <Select value={form.metric_name} onValueChange={v => setForm(f => ({...f, metric_name: v}))}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {defaultMetrics.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valeur *</Label><Input type="number" value={form.metric_value} onChange={e => setForm(f => ({...f, metric_value: e.target.value}))} /></div>
              <div><Label>Unité</Label><Input value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Période</Label>
                <Select value={form.period} onValueChange={v => setForm(f => ({...f, period: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="quarterly">Trimestriel</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={form.recorded_at} onChange={e => setForm(f => ({...f, recorded_at: e.target.value}))} /></div>
            </div>
          </div>
          <DialogFooter><GhButton variant="primary" onClick={handleSubmit} disabled={addKpi.isPending}>{addKpi.isPending ? "Ajout…" : "Ajouter"}</GhButton></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
