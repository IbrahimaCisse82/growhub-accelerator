import { useState } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks, useUpdateTaskStatus } from "@/hooks/useTasks";
import { useSubTasksByTasks } from "@/hooks/useSubTasks";
import SubTaskChecklist from "@/components/tasks/SubTaskChecklist";
import CreateTaskDialog from "@/components/dialogs/CreateTaskDialog";
import { exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];

const columns: { key: TaskStatus; title: string }[] = [
  { key: "todo", title: "À faire" },
  { key: "in_progress", title: "En cours" },
  { key: "in_review", title: "En revue" },
  { key: "done", title: "Terminé" },
];

const priorityColor: Record<string, string> = {
  low: "bg-primary",
  medium: "bg-gh-amber",
  high: "bg-destructive",
  critical: "bg-destructive",
};

const priorityLabel: Record<string, string> = {
  low: "Basse", medium: "Moyenne", high: "Haute", critical: "Critique",
};

const statusLabel: Record<string, string> = {
  todo: "À faire", in_progress: "En cours", in_review: "En revue", done: "Terminé",
};

function TaskCard({ card, isDragOverlay, subTasks }: { card: any; isDragOverlay?: boolean; subTasks?: { completed: number; total: number } }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { status: card.status },
  });
  const [expanded, setExpanded] = useState(false);

  const style = isDragOverlay
    ? undefined
    : { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={style}
      {...(isDragOverlay ? {} : { ...listeners, ...attributes })}
      className={`bg-surface-2 border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-border/80 hover:-translate-y-px transition-all touch-none select-none ${
        isDragOverlay ? "shadow-lg ring-2 ring-primary/30 rotate-[2deg] scale-105" : ""
      }`}
    >
      {card.projects?.name && (
        <div className="text-[10px] font-mono text-muted-foreground mb-1 truncate">📁 {card.projects.name}</div>
      )}
      <div className="text-xs font-semibold text-foreground mb-1">{card.title}</div>
      {card.milestone_title && (
        <div className="text-[10px] text-accent-foreground/70 mb-1 truncate">🏁 {card.milestone_title}</div>
      )}
      {/* Sub-task progress bar */}
      {subTasks && subTasks.total > 0 && (
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round((subTasks.completed / subTasks.total) * 100)}%` }} />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">{subTasks.completed}/{subTasks.total}</span>
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        {card.due_date && (
          <span className="text-[9px] font-mono text-muted-foreground">{new Date(card.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
        )}
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ml-auto ${priorityColor[card.priority] ?? "bg-gh-amber"}`} />
      </div>
      {/* Expand sub-tasks inline */}
      {!isDragOverlay && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-[10px] text-primary hover:underline mt-1.5 cursor-pointer"
        >
          {expanded ? "Masquer ▲" : "Sous-tâches ▼"}
        </button>
      )}
      {expanded && !isDragOverlay && (
        <div className="mt-2 border-t border-border pt-2" onPointerDown={e => e.stopPropagation()}>
          <SubTaskChecklist taskId={card.id} />
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ col, cards }: { col: (typeof columns)[number]; cards: any[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: col.key });

  return (
    <div
      ref={setNodeRef}
      className={`bg-card border rounded-xl overflow-hidden transition-colors ${
        isOver ? "border-primary/50 bg-primary/5" : "border-border"
      }`}
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">{col.title}</span>
        <span className="font-mono text-[10px] bg-surface-3 text-muted-foreground px-[7px] py-px rounded-full">{cards.length}</span>
      </div>
      <div className="p-2.5 flex flex-col gap-2 min-h-[120px]">
        {cards.length === 0 ? (
          <div className="text-[11px] text-muted-foreground text-center py-4">{isOver ? "Déposer ici" : "Aucune tâche"}</div>
        ) : (
          cards.map((card) => <TaskCard key={card.id} card={card} />)
        )}
      </div>
    </div>
  );
}

/* ── List View ── */
function TaskListView({ tasks, onStatusChange }: { tasks: any[]; onStatusChange: (id: string, status: TaskStatus) => void }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="bg-secondary">
            {["Tâche", "Projet", "Jalon", "Priorité", "Statut", "Échéance"].map(h => (
              <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr><td colSpan={6} className="px-3.5 py-8 text-center text-muted-foreground text-sm">Aucune tâche</td></tr>
          ) : (
            tasks.map(t => (
              <tr key={t.id} className="hover:bg-secondary/50 transition-colors">
                <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground max-w-[250px] truncate">{t.title}</td>
                <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground text-[11px]">{t.projects?.name ?? "—"}</td>
                <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground text-[11px]">{t.milestone_title ?? "—"}</td>
                <td className="px-3.5 py-2.5 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${priorityColor[t.priority] ?? "bg-gh-amber"}`} />
                    <span className="text-[11px]">{priorityLabel[t.priority] ?? t.priority}</span>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 border-b border-border">
                  <select
                    value={t.status}
                    onChange={e => onStatusChange(t.id, e.target.value as TaskStatus)}
                    className="bg-surface-2 border border-border rounded-md px-1.5 py-0.5 text-[11px] text-foreground"
                  >
                    {columns.map(c => <option key={c.key} value={c.key}>{c.title}</option>)}
                  </select>
                </td>
                <td className="px-3.5 py-2.5 border-b border-border font-mono text-[11px] text-muted-foreground">
                  {t.due_date ? new Date(t.due_date).toLocaleDateString("fr-FR") : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function TachesPage() {
  const { data: tasks, isLoading } = useTasks();
  const updateStatus = useUpdateTaskStatus();
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const grouped = columns.map((col) => ({
    ...col,
    cards: tasks?.filter((t) => t.status === col.key) ?? [],
  }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(tasks?.find((t) => t.id === event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const currentTask = tasks?.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;
    updateStatus.mutate(
      { id: taskId, status: newStatus },
      { onSuccess: () => toast.success("Statut mis à jour"), onError: () => toast.error("Erreur lors de la mise à jour") }
    );
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateStatus.mutate(
      { id, status },
      { onSuccess: () => toast.success("Statut mis à jour"), onError: () => toast.error("Erreur") }
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Tâches"
        subtitle={viewMode === "kanban" ? "Kanban de suivi des tâches" : "Vue liste des tâches"}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-2 border border-border rounded-lg p-0.5">
              <button onClick={() => setViewMode("kanban")} className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${viewMode === "kanban" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                ▦ Kanban
              </button>
              <button onClick={() => setViewMode("list")} className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                ☰ Liste
              </button>
            </div>
            <GhButton variant="ghost" onClick={() => tasks && exportToCSV(tasks, "taches", [
              { key: "title", label: "Titre" }, { key: "status", label: "Statut" }, { key: "priority", label: "Priorité" }, { key: "due_date", label: "Échéance" },
            ])}>⤓ CSV</GhButton>
            <CreateTaskDialog><GhButton>+ Tâche</GhButton></CreateTaskDialog>
          </div>
        }
      />
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[300px] rounded-xl" />)}
        </div>
      ) : viewMode === "kanban" ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {grouped.map((col) => <KanbanColumn key={col.key} col={col} cards={col.cards} />)}
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
            {activeTask ? <TaskCard card={activeTask} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <TaskListView tasks={tasks ?? []} onStatusChange={handleStatusChange} />
      )}
    </motion.div>
  );
}
