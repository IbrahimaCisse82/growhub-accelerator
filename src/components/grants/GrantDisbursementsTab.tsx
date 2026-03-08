import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useGrantDisbursements, useDeleteDisbursement, type GrantDisbursement } from "@/hooks/useGrantDetail";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

const statusMap: Record<string, { label: string; color: "green" | "amber" | "blue" | "gray" }> = {
  pending: { label: "En attente", color: "amber" }, approved: { label: "Approuvé", color: "blue" },
  received: { label: "Reçu", color: "green" }, rejected: { label: "Rejeté", color: "gray" },
};

export { useGrantDisbursements };

export default function GrantDisbursementsTab({ grantId, grantTotal }: { grantId: string; grantTotal: number }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: disbursements, isLoading } = useGrantDisbursements(grantId);
  const deleteMut = useDeleteDisbursement(grantId);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<GrantDisbursement | null>(null);
  const [deleteItem, setDeleteItem] = useState<GrantDisbursement | null>(null);

  const totalRequested = disbursements?.reduce((s, d) => s + (d.amount_requested ?? 0), 0) ?? 0;
  const totalApproved = disbursements?.reduce((s, d) => s + (d.amount_approved ?? 0), 0) ?? 0;
  const totalReceived = disbursements?.reduce((s, d) => s + (d.amount_received ?? 0), 0) ?? 0;

  const approveMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { error } = await supabase.from("grant_disbursements").update({
        status: "approved", amount_approved: amount, approved_by: user?.id ?? null, approved_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grant_disbursements", grantId] }); toast({ title: "Décaissement approuvé" }); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const receiveMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { error } = await supabase.from("grant_disbursements").update({
        status: "received", amount_received: amount, received_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grant_disbursements", grantId] }); toast({ title: "Réception confirmée" }); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const pctReceived = grantTotal > 0 ? Math.round((totalReceived / grantTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-muted-foreground uppercase">Pipeline de décaissement</span>
          <span className="font-mono text-sm font-bold text-primary">{pctReceived}% reçu</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${grantTotal > 0 ? Math.round((totalRequested / grantTotal) * 100) : 0}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-mono text-muted-foreground">
          <span>Demandé: {fmt(totalRequested)} €</span><span>Approuvé: {fmt(totalApproved)} €</span><span>Reçu: {fmt(totalReceived)} €</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-foreground">Tranches de décaissement</span>
          <span className="font-mono text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{disbursements?.length ?? 0} tranches</span>
        </div>
        <GhButton onClick={() => { setEditItem(null); setShowForm(true); }}>+ Nouvelle tranche</GhButton>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : !disbursements || disbursements.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="text-2xl mb-2">💸</div>
          <div className="text-sm text-muted-foreground mb-3">Aucune tranche de décaissement</div>
          <GhButton onClick={() => { setEditItem(null); setShowForm(true); }}>+ Première tranche</GhButton>
        </div>
      ) : (
        <div className="space-y-3">
          {disbursements.map(d => {
            const st = statusMap[d.status] ?? statusMap.pending;
            return (
              <div key={d.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">T{d.tranche_number}</span>
                      <span className="text-sm font-semibold text-foreground truncate">{d.label}</span>
                      <Pill color={st.color}>{st.label}</Pill>
                    </div>
                    {d.justification && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{d.justification}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-muted-foreground font-mono">Demandé</div>
                    <div className="font-mono font-bold text-foreground">{fmt(d.amount_requested)} €</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {["pending", "approved", "received"].map((step, i) => {
                    const currentIdx = ["pending", "approved", "received"].indexOf(d.status);
                    return (<div key={step} className="flex items-center gap-1 flex-1"><div className={`h-1.5 flex-1 rounded-full ${i <= currentIdx ? "bg-primary" : "bg-secondary"}`} /></div>);
                  })}
                </div>
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1"><span>Demande</span><span>Approbation</span><span>Réception</span></div>
                <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.status === "pending" && <button onClick={() => approveMutation.mutate({ id: d.id, amount: d.amount_requested })} className="text-[11px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">✓ Approuver</button>}
                  {d.status === "approved" && <button onClick={() => receiveMutation.mutate({ id: d.id, amount: d.amount_approved ?? 0 })} className="text-[11px] px-2 py-1 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors font-medium">✓ Confirmer réception</button>}
                  <button onClick={() => { setEditItem(d); setShowForm(true); }} className="text-[11px] px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors">✏️ Modifier</button>
                  <button onClick={() => setDeleteItem(d)} className="text-[11px] px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-destructive transition-colors">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DisbursementFormDialog open={showForm} onOpenChange={setShowForm} grantId={grantId} editData={editItem} userId={user?.id} nextTranche={(disbursements?.length ?? 0) + 1} />

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => { if (!o) setDeleteItem(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Supprimer cette tranche ?</AlertDialogTitle><AlertDialogDescription>La tranche « {deleteItem?.label} » sera définitivement supprimée.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => deleteItem && deleteMut.mutate(deleteItem.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DisbursementFormDialog({ open, onOpenChange, grantId, editData, userId, nextTranche }: {
  open: boolean; onOpenChange: (o: boolean) => void; grantId: string; editData: GrantDisbursement | null; userId?: string; nextTranche: number;
}) {
  const qc = useQueryClient();
  const isEdit = !!editData;
  const [label, setLabel] = useState("");
  const [trancheNumber, setTrancheNumber] = useState(String(nextTranche));
  const [amountRequested, setAmountRequested] = useState("");
  const [justification, setJustification] = useState("");
  const [notes, setNotes] = useState("");

  const handleOpenChange = (o: boolean) => {
    if (o && editData) {
      setLabel(editData.label ?? ""); setTrancheNumber(String(editData.tranche_number ?? 1));
      setAmountRequested(String(editData.amount_requested ?? "")); setJustification(editData.justification ?? ""); setNotes(editData.notes ?? "");
    } else if (o) { setLabel(""); setTrancheNumber(String(nextTranche)); setAmountRequested(""); setJustification(""); setNotes(""); }
    onOpenChange(o);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { grant_id: grantId, label, tranche_number: parseInt(trancheNumber) || 1, amount_requested: parseFloat(amountRequested) || 0, justification: justification || null, notes: notes || null, requested_by: userId ?? null };
      if (isEdit) { const { error } = await supabase.from("grant_disbursements").update(payload).eq("id", editData.id); if (error) throw error; }
      else { const { error } = await supabase.from("grant_disbursements").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grant_disbursements", grantId] }); onOpenChange(false); toast({ title: isEdit ? "Tranche modifiée" : "Tranche créée" }); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader><DialogTitle className="font-display">{isEdit ? "Modifier la tranche" : "Nouvelle demande de décaissement"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">N° tranche</label><input type="number" value={trancheNumber} onChange={e => setTrancheNumber(e.target.value)} className={inputCls} /></div>
            <div className="col-span-2 space-y-2"><label className="text-sm font-medium text-foreground">Libellé *</label><input value={label} onChange={e => setLabel(e.target.value)} required className={inputCls} placeholder="Ex: Tranche initiale" /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Montant demandé (€) *</label><input type="number" value={amountRequested} onChange={e => setAmountRequested(e.target.value)} required className={inputCls} /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Justification</label><textarea value={justification} onChange={e => setJustification(e.target.value)} rows={2} className={inputCls + " h-auto"} /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputCls + " h-auto"} /></div>
          <button type="submit" disabled={saveMutation.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {saveMutation.isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Soumettre la demande"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
