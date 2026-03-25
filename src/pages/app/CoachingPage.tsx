import { motion } from "framer-motion";
import { useState } from "react";
import StatCard from "@/components/shared/StatCard";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoachingSessions } from "@/hooks/useCoachingSessions";
import CreateSessionDialog from "@/components/dialogs/CreateSessionDialog";
import CoachingInviteComposer from "@/components/coaching/CoachingInviteComposer";
import CoachingEvaluationPanel from "@/components/coaching/CoachingEvaluationPanel";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const statusMap: Record<string, { label: string; color: "green" | "amber" | "blue" | "gray" | "rose" }> = {
  planned: { label: "Planifié", color: "blue" },
  confirmed: { label: "Confirmé", color: "green" },
  in_progress: { label: "En cours", color: "amber" },
  completed: { label: "Terminé", color: "gray" },
  cancelled: { label: "Annulé", color: "rose" },
};

// ── Notes & Tasks Hooks ──
function useCoachingNotes(sessionId?: string) {
  return useQuery({
    queryKey: ["coaching-notes", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_notes")
        .select("*")
        .eq("session_id", sessionId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useCoachingTasks(sessionId?: string) {
  return useQuery({
    queryKey: ["coaching-tasks", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_tasks")
        .select("*")
        .eq("session_id", sessionId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

// ── Session Detail Dialog ──
function SessionDetailDialog({ session }: { session: any }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: notes } = useCoachingNotes(session.id);
  const { data: tasks } = useCoachingTasks(session.id);
  const [newNote, setNewNote] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [tab, setTab] = useState<"notes" | "tasks" | "feedback" | "evaluation">("notes");
  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coaching_notes").insert({
        session_id: session.id,
        author_id: user!.id,
        content: newNote,
        is_private: isPrivate,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coaching-notes", session.id] }); setNewNote(""); toast({ title: "✓ Note ajoutée" }); },
  });

  const addTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coaching_tasks").insert({
        session_id: session.id,
        title: newTaskTitle,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coaching-tasks", session.id] }); setNewTaskTitle(""); toast({ title: "✓ Tâche ajoutée" }); },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("coaching_tasks").update({
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coaching-tasks", session.id] }),
  });

  const saveFeedback = useMutation({
    mutationFn: async ({ feedback, rating }: { feedback: string; rating: number }) => {
      const { error } = await supabase.from("coaching_sessions").update({ feedback, rating }).eq("id", session.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coaching-sessions"] }); toast({ title: "✓ Feedback enregistré" }); },
  });

  const [feedback, setFeedback] = useState(session.feedback ?? "");
  const [rating, setRating] = useState(session.rating ?? 0);

  const st = statusMap[session.status] ?? statusMap.planned;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <GhButton variant="secondary" size="sm">📝 Détails</GhButton>
      </DialogTrigger>
        <DialogContent className="max-w-[900px] bg-card border-border max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            {session.title} <Pill color={st.color}>{st.label}</Pill>
          </DialogTitle>
        </DialogHeader>

        {/* Session info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-[9px] font-mono text-muted-foreground uppercase">Entreprise</div>
            <div className="text-[12.5px] font-semibold text-foreground mt-0.5">{session.startups?.name ?? "—"}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-[9px] font-mono text-muted-foreground uppercase">Date</div>
            <div className="text-[12.5px] font-semibold text-foreground mt-0.5">{format(new Date(session.scheduled_at), "dd MMM yyyy · HH:mm", { locale: fr })}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-[9px] font-mono text-muted-foreground uppercase">Durée</div>
            <div className="text-[12.5px] font-semibold text-foreground mt-0.5">{session.duration_minutes} min</div>
          </div>
          {session.meeting_url && (
            <div className="bg-surface-2 rounded-lg p-3">
              <div className="text-[9px] font-mono text-muted-foreground uppercase">Lien</div>
              <a href={session.meeting_url} target="_blank" rel="noopener noreferrer" className="text-[12.5px] text-primary hover:underline mt-0.5 block truncate">{session.meeting_url}</a>
            </div>
          )}
        </div>

        {/* Tabs */}
          <div className="flex border-b border-border mb-3">
          {(["notes", "tasks", "evaluation", "feedback"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-[11.5px] font-medium transition-colors relative ${tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "notes" ? `📝 Notes (${notes?.length ?? 0})` : t === "tasks" ? `☑ Tâches (${tasks?.length ?? 0})` : t === "evaluation" ? "📊 Évaluation" : "⭐ Feedback"}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        {tab === "notes" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex gap-2">
              <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                placeholder="Ajouter une note de réunion…"
                className="flex-1 bg-surface-2 border border-border rounded-lg p-2.5 text-[12px] text-foreground resize-none h-16" />
              <div className="flex flex-col gap-1">
                <GhButton onClick={() => addNote.mutate()} disabled={!newNote || addNote.isPending} size="sm">Ajouter</GhButton>
                <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="w-3 h-3" />
                  Privée
                </label>
              </div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {notes?.map(n => (
              <div key={n.id} className="bg-surface-2 rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] text-muted-foreground font-mono">{format(new Date(n.created_at), "dd/MM HH:mm")}</div>
                  {n.is_private && <Pill color="amber">Privée</Pill>}
                </div>
                <div className="text-[12px] text-foreground whitespace-pre-wrap">{n.content}</div>
              </div>
            ))}
            {(!notes || notes.length === 0) && <div className="text-center text-muted-foreground text-[11px] py-4">Aucune note pour cette session</div>}
            </div>
          </div>
        )}

        {tab === "tasks" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Nouvelle tâche de suivi…"
                className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-foreground"
                onKeyDown={e => { if (e.key === "Enter" && newTaskTitle) addTask.mutate(); }} />
              <GhButton onClick={() => addTask.mutate()} disabled={!newTaskTitle || addTask.isPending} size="sm">+ Ajouter</GhButton>
            </div>
            {tasks?.map(t => (
              <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary transition-colors">
                <button onClick={() => toggleTask.mutate({ id: t.id, completed: !t.is_completed })}
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] flex-shrink-0 ${t.is_completed ? "bg-gh-green/20 border-gh-green text-gh-green" : "border-border text-transparent hover:border-primary"}`}>
                  ✓
                </button>
                <span className={`text-[12px] flex-1 ${t.is_completed ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.title}</span>
                {t.due_date && <span className="text-[10px] font-mono text-muted-foreground">{format(new Date(t.due_date), "dd/MM")}</span>}
              </div>
            ))}
            {(!tasks || tasks.length === 0) && <div className="text-center text-muted-foreground text-[11px] py-4">Aucune tâche de suivi</div>}
          </div>
        )}

        {tab === "evaluation" && (
          <CoachingEvaluationPanel
            sessionId={session.id}
            existingScores={(() => { try { const parsed = JSON.parse(session.notes ?? "{}"); return parsed.evaluation_scores; } catch { return undefined; } })()}
            existingComment={(() => { try { const parsed = JSON.parse(session.notes ?? "{}"); return parsed.evaluation_comment; } catch { return undefined; } })()}
          />
        )}

        {tab === "feedback" && (
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Note</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)}
                    className={`text-xl transition-colors ${star <= rating ? "text-gh-amber" : "text-border hover:text-gh-amber/50"}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
              placeholder="Feedback sur la session…"
              className="w-full bg-surface-2 border border-border rounded-lg p-3 text-[12px] text-foreground resize-none h-24" />
            <GhButton onClick={() => saveFeedback.mutate({ feedback, rating })} disabled={saveFeedback.isPending}>
              Enregistrer le feedback
            </GhButton>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──
export default function CoachingPage() {
  const { data: sessions, isLoading } = useCoachingSessions();
  const total = sessions?.length ?? 0;
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("coaching_sessions").update({ status: status as Database["public"]["Enums"]["session_status"] }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coaching-sessions"] }); toast({ title: "✓ Session mise à jour" }); },
  });

  const filteredSessions = statusFilter ? sessions?.filter(s => s.status === statusFilter) : sessions;
  const avgRating = sessions?.filter(s => s.rating).reduce((sum, s, _, arr) => sum + (s.rating ?? 0) / arr.length, 0) ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Coaching & Sessions"
        subtitle="Planification, notes de réunion, tâches de suivi et évaluations"
        actions={<div className="flex gap-2">
          <CoachingInviteComposer><GhButton variant="secondary">📧 Inviter</GhButton></CoachingInviteComposer>
          <CreateSessionDialog><GhButton>+ Planifier session</GhButton></CreateSessionDialog>
        </div>}
      />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-5">
        <StatCard label="Sessions totales" value={String(total)} note="" color="green" />
        <StatCard label="Confirmées" value={String(sessions?.filter(s => s.status === "confirmed").length ?? 0)} note="" color="blue" />
        <StatCard label="Planifiées" value={String(sessions?.filter(s => s.status === "planned").length ?? 0)} note="" color="amber" />
        <StatCard label="Terminées" value={String(sessions?.filter(s => s.status === "completed").length ?? 0)} note="" color="purple" />
        <StatCard label="Note moyenne" value={avgRating > 0 ? `${avgRating.toFixed(1)}/5` : "—"} note="" color="rose" />
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap ui-panel p-2">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Statut :</span>
        <button onClick={() => setStatusFilter(null)} className={`text-[11px] px-2.5 py-1 rounded-lg ${!statusFilter ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>Tous</button>
        {Object.entries(statusMap).map(([key, val]) => (
          <button key={key} onClick={() => setStatusFilter(statusFilter === key ? null : key)}
            className={`text-[11px] px-2.5 py-1 rounded-lg ${statusFilter === key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>
            {val.label}
          </button>
        ))}
      </div>

      <GhCard title="Sessions" badge={String(filteredSessions?.length ?? 0)} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-secondary/70">
                {["Date", "Entreprise", "Titre", "Durée", "Note", "Statut", "Actions"].map(h => (
                  <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-3.5 py-2.5 border-b border-border"><Skeleton className="h-4 w-20" /></td>)}</tr>
                ))
              ) : !filteredSessions || filteredSessions.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon="🎯" title="Aucune session" description="Planifiez votre première session de coaching" /></td></tr>
              ) : (
                filteredSessions.map(s => {
                  const st = statusMap[s.status] ?? statusMap.planned;
                  return (
                    <tr key={s.id} className="hover:bg-secondary/60 transition-colors">
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">
                        {format(new Date(s.scheduled_at), "dd MMM HH:mm", { locale: fr })}
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border text-foreground">{s.startups?.name ?? "—"}</td>
                      <td className="px-3.5 py-2.5 border-b border-border text-foreground">{s.title}</td>
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{s.duration_minutes}min</td>
                      <td className="px-3.5 py-2.5 border-b border-border">
                        {s.rating ? (
                          <span className="text-gh-amber font-mono">{s.rating}/5 ★</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border"><Pill color={st.color}>{st.label}</Pill></td>
                      <td className="px-3.5 py-2.5 border-b border-border">
                        <div className="flex gap-1 flex-wrap">
                          <SessionDetailDialog session={s} />
                          {s.status === "planned" && <GhButton variant="primary" size="sm" onClick={() => updateStatus.mutate({ id: s.id, status: "confirmed" })}>Confirmer</GhButton>}
                          {s.status === "confirmed" && <GhButton variant="accent" size="sm" onClick={() => updateStatus.mutate({ id: s.id, status: "completed" })}>Terminer</GhButton>}
                          {(s.status === "planned" || s.status === "confirmed") && <GhButton variant="ghost" size="sm" onClick={() => updateStatus.mutate({ id: s.id, status: "cancelled" })}>Annuler</GhButton>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GhCard>
    </motion.div>
  );
}
