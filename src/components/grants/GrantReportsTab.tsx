import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useGrantReports, useDeleteReport, type GrantReport } from "@/hooks/useGrantDetail";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

const statusMap: Record<string, { label: string; color: "green" | "amber" | "blue" | "gray" }> = {
  draft: { label: "Brouillon", color: "gray" }, submitted: { label: "Soumis", color: "blue" },
  validated: { label: "Validé", color: "green" }, rejected: { label: "Rejeté", color: "amber" },
};

export { useGrantReports };

export default function GrantReportsTab({ grantId }: { grantId: string }) {
  const { user } = useAuth();
  const deleteMutation = useDeleteReport(grantId);
  const { data: reports, isLoading } = useGrantReports(grantId);
  const [showForm, setShowForm] = useState(false);
  const [editReport, setEditReport] = useState<GrantReport | null>(null);
  const [deleteReport, setDeleteReport] = useState<GrantReport | null>(null);

  const totalDeclared = reports?.reduce((s, r) => s + (r.amount_declared ?? 0), 0) ?? 0;
  const totalValidated = reports?.reduce((s, r) => s + (r.amount_validated ?? 0), 0) ?? 0;
  const totalReceived = reports?.reduce((s, r) => s + (r.amount_received ?? 0), 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground font-mono uppercase">Déclaré</div><div className="text-lg font-bold font-mono text-foreground">{fmt(totalDeclared)} €</div></div>
        <div className="bg-card border border-border rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground font-mono uppercase">Validé</div><div className="text-lg font-bold font-mono text-primary">{fmt(totalValidated)} €</div></div>
        <div className="bg-card border border-border rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground font-mono uppercase">Reçu</div><div className="text-lg font-bold font-mono text-green-500">{fmt(totalReceived)} €</div></div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">Rapports financiers</span>
        <GhButton onClick={() => { setEditReport(null); setShowForm(true); }}>+ Nouveau rapport</GhButton>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : !reports || reports.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="text-2xl mb-2">📊</div><div className="text-sm text-muted-foreground mb-3">Aucun rapport financier</div>
          <GhButton onClick={() => { setEditReport(null); setShowForm(true); }}>+ Premier rapport</GhButton>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead><tr className="bg-secondary">
                {["Période", "Type", "Déclaré", "Validé", "Reçu", "Statut", ""].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-mono uppercase text-muted-foreground tracking-wider border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {reports.map(r => {
                  const st = statusMap[r.status] ?? statusMap.draft;
                  return (
                    <tr key={r.id} className="hover:bg-secondary/50 transition-colors group">
                      <td className="px-3 py-2.5 border-b border-border font-semibold text-foreground">{r.period_label}</td>
                      <td className="px-3 py-2.5 border-b border-border text-muted-foreground capitalize">{r.period_type === "quarterly" ? "Trimestriel" : r.period_type === "semiannual" ? "Semestriel" : r.period_type === "annual" ? "Annuel" : r.period_type}</td>
                      <td className="px-3 py-2.5 border-b border-border font-mono text-foreground">{fmt(r.amount_declared ?? 0)} €</td>
                      <td className="px-3 py-2.5 border-b border-border font-mono text-primary">{fmt(r.amount_validated ?? 0)} €</td>
                      <td className="px-3 py-2.5 border-b border-border font-mono text-green-500">{fmt(r.amount_received ?? 0)} €</td>
                      <td className="px-3 py-2.5 border-b border-border"><Pill color={st.color}>{st.label}</Pill></td>
                      <td className="px-3 py-2.5 border-b border-border">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditReport(r); setShowForm(true); }} className="text-[11px] text-muted-foreground hover:text-foreground">✏️</button>
                          <button onClick={() => setDeleteReport(r)} className="text-[11px] text-muted-foreground hover:text-destructive">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ReportFormDialog open={showForm} onOpenChange={setShowForm} grantId={grantId} editData={editReport} userId={user?.id} />

      <AlertDialog open={!!deleteReport} onOpenChange={(o) => { if (!o) setDeleteReport(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Supprimer ce rapport ?</AlertDialogTitle><AlertDialogDescription>Le rapport « {deleteReport?.period_label} » sera définitivement supprimé.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => deleteReport && deleteMutation.mutate(deleteReport.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReportFormDialog({ open, onOpenChange, grantId, editData, userId }: {
  open: boolean; onOpenChange: (o: boolean) => void; grantId: string; editData: GrantReport | null; userId?: string;
}) {
  const qc = useQueryClient();
  const isEdit = !!editData;
  const [periodLabel, setPeriodLabel] = useState("");
  const [periodType, setPeriodType] = useState("quarterly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [amountDeclared, setAmountDeclared] = useState("");
  const [amountValidated, setAmountValidated] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");

  const handleOpenChange = (o: boolean) => {
    if (o && editData) {
      setPeriodLabel(editData.period_label ?? ""); setPeriodType(editData.period_type ?? "quarterly");
      setStartDate(editData.start_date ?? ""); setEndDate(editData.end_date ?? "");
      setAmountDeclared(String(editData.amount_declared ?? "")); setAmountValidated(String(editData.amount_validated ?? ""));
      setAmountReceived(String(editData.amount_received ?? "")); setStatus(editData.status ?? "draft"); setNotes(editData.notes ?? "");
    } else if (o) {
      setPeriodLabel(""); setPeriodType("quarterly"); setStartDate(""); setEndDate("");
      setAmountDeclared(""); setAmountValidated(""); setAmountReceived(""); setStatus("draft"); setNotes("");
    }
    onOpenChange(o);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        grant_id: grantId, period_label: periodLabel, period_type: periodType,
        start_date: startDate || null, end_date: endDate || null,
        amount_declared: parseFloat(amountDeclared) || 0, amount_validated: parseFloat(amountValidated) || 0,
        amount_received: parseFloat(amountReceived) || 0, status, notes: notes || null, submitted_by: userId ?? null,
      };
      if (isEdit) { const { error } = await supabase.from("grant_reports").update(payload).eq("id", editData.id); if (error) throw error; }
      else { const { error } = await supabase.from("grant_reports").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grant_reports", grantId] }); onOpenChange(false); toast({ title: isEdit ? "Rapport modifié" : "Rapport créé" }); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">{isEdit ? "Modifier le rapport" : "Nouveau rapport financier"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Période *</label><input value={periodLabel} onChange={e => setPeriodLabel(e.target.value)} required className={inputCls} placeholder="Ex: T1 2026" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Type</label>
              <select value={periodType} onChange={e => setPeriodType(e.target.value)} className={inputCls}>
                <option value="quarterly">Trimestriel</option><option value="semiannual">Semestriel</option><option value="annual">Annuel</option>
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Déclaré (€)</label><input type="number" value={amountDeclared} onChange={e => setAmountDeclared(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Validé (€)</label><input type="number" value={amountValidated} onChange={e => setAmountValidated(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Reçu (€)</label><input type="number" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Statut</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
              <option value="draft">Brouillon</option><option value="submitted">Soumis</option><option value="validated">Validé</option><option value="rejected">Rejeté</option>
            </select></div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputCls + " h-auto"} /></div>
          <button type="submit" disabled={saveMutation.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {saveMutation.isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le rapport"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
