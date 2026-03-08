import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useGrantActivities, useDeleteActivity, type GrantActivity } from "@/hooks/useGrantDetail";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

const statusMap: Record<string, { label: string; color: "green" | "amber" | "blue" | "gray" }> = {
  planned: { label: "Planifié", color: "gray" }, in_progress: { label: "En cours", color: "blue" },
  completed: { label: "Terminé", color: "green" }, delayed: { label: "En retard", color: "amber" },
};
const priorityMap: Record<string, { label: string; color: "green" | "amber" | "blue" | "gray" }> = {
  low: { label: "Basse", color: "gray" }, medium: { label: "Moyenne", color: "blue" },
  high: { label: "Haute", color: "amber" }, critical: { label: "Critique", color: "green" },
};

export { useGrantActivities };

export default function GrantActivitiesTab({ grantId }: { grantId: string }) {
  const { data: activities, isLoading } = useGrantActivities(grantId);
  const deleteMutation = useDeleteActivity(grantId);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<GrantActivity | null>(null);
  const [deleteItem, setDeleteItem] = useState<GrantActivity | null>(null);

  const totalProgress = activities && activities.length > 0
    ? Math.round(activities.reduce((s, a) => s + (a.progress ?? 0), 0) / activities.length) : 0;

  return (
    <div className="space-y-4">
      {activities && activities.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground uppercase">Avancement global</span>
            <span className="font-mono text-sm font-bold text-primary">{totalProgress}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${totalProgress}%` }} />
          </div>
          <div className="flex gap-4 mt-2 text-[10px] font-mono text-muted-foreground">
            <span>✓ {activities.filter(a => a.status === "completed").length} terminées</span>
            <span>▶ {activities.filter(a => a.status === "in_progress").length} en cours</span>
            <span>⏳ {activities.filter(a => a.status === "planned").length} planifiées</span>
            <span className="text-amber-500">⚠ {activities.filter(a => a.status === "delayed").length} en retard</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">Plan de travail</span>
        <GhButton onClick={() => { setEditItem(null); setShowForm(true); }}>+ Nouvelle activité</GhButton>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : !activities || activities.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="text-2xl mb-2">📅</div>
          <div className="text-sm text-muted-foreground mb-3">Aucune activité planifiée</div>
          <GhButton onClick={() => { setEditItem(null); setShowForm(true); }}>+ Première activité</GhButton>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map(a => {
            const st = statusMap[a.status] ?? statusMap.planned;
            const pr = priorityMap[a.priority ?? "medium"] ?? priorityMap.medium;
            return (
              <div key={a.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{a.title}</span>
                      <Pill color={st.color}>{st.label}</Pill>
                      <Pill color={pr.color}>{pr.label}</Pill>
                    </div>
                    {a.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>}
                    <div className="flex gap-4 mt-2 text-[10px] font-mono text-muted-foreground">
                      {a.responsible && <span>👤 {a.responsible}</span>}
                      {(a.start_date || a.end_date) && <span>📅 {a.start_date ?? "—"} → {a.end_date ?? "—"}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-bold text-primary">{a.progress ?? 0}%</div>
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${a.progress ?? 0}%` }} />
                    </div>
                  </div>
                </div>
                {a.start_date && a.end_date && (
                  <div className="mt-3"><div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${a.status === "completed" ? "bg-green-500" : a.status === "delayed" ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${a.progress ?? 0}%` }} />
                  </div></div>
                )}
                {a.deliverables && <div className="mt-2 text-[10px] text-muted-foreground"><span className="font-semibold">Livrables:</span> {a.deliverables}</div>}
                <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditItem(a); setShowForm(true); }} className="text-[11px] px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors">✏️ Modifier</button>
                  <button onClick={() => setDeleteItem(a)} className="text-[11px] px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-destructive transition-colors">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ActivityFormDialog open={showForm} onOpenChange={setShowForm} grantId={grantId} editData={editItem} />

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => { if (!o) setDeleteItem(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Supprimer cette activité ?</AlertDialogTitle><AlertDialogDescription>L'activité « {deleteItem?.title} » sera définitivement supprimée.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActivityFormDialog({ open, onOpenChange, grantId, editData }: {
  open: boolean; onOpenChange: (o: boolean) => void; grantId: string; editData: GrantActivity | null;
}) {
  const qc = useQueryClient();
  const isEdit = !!editData;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [responsible, setResponsible] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("planned");
  const [priority, setPriority] = useState("medium");
  const [progress, setProgress] = useState("0");
  const [deliverables, setDeliverables] = useState("");

  const handleOpenChange = (o: boolean) => {
    if (o && editData) {
      setTitle(editData.title ?? ""); setDescription(editData.description ?? ""); setResponsible(editData.responsible ?? "");
      setStartDate(editData.start_date ?? ""); setEndDate(editData.end_date ?? ""); setStatus(editData.status ?? "planned");
      setPriority(editData.priority ?? "medium"); setProgress(String(editData.progress ?? 0)); setDeliverables(editData.deliverables ?? "");
    } else if (o) {
      setTitle(""); setDescription(""); setResponsible(""); setStartDate(""); setEndDate("");
      setStatus("planned"); setPriority("medium"); setProgress("0"); setDeliverables("");
    }
    onOpenChange(o);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        grant_id: grantId, title, description: description || null, responsible: responsible || null,
        start_date: startDate || null, end_date: endDate || null, status, priority,
        progress: parseFloat(progress) || 0, deliverables: deliverables || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("grant_activities").update(payload).eq("id", editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("grant_activities").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grant_activities", grantId] }); onOpenChange(false); toast({ title: isEdit ? "Activité modifiée" : "Activité créée" }); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">{isEdit ? "Modifier l'activité" : "Nouvelle activité"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Titre *</label><input value={title} onChange={e => setTitle(e.target.value)} required className={inputCls} /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputCls + " h-auto"} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                <option value="planned">Planifié</option><option value="in_progress">En cours</option><option value="completed">Terminé</option><option value="delayed">En retard</option>
              </select></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Priorité</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
                <option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="critical">Critique</option>
              </select></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Progrès %</label><input type="number" min="0" max="100" value={progress} onChange={e => setProgress(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Responsable</label><input value={responsible} onChange={e => setResponsible(e.target.value)} className={inputCls} /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Livrables</label><textarea value={deliverables} onChange={e => setDeliverables(e.target.value)} rows={2} className={inputCls + " h-auto"} /></div>
          <button type="submit" disabled={saveMutation.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {saveMutation.isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer l'activité"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
