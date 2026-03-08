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
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks, useUpdateTaskStatus } from "@/hooks/useTasks";
import CreateTaskDialog from "@/components/dialogs/CreateTaskDialog";
import CreateProjectDialog from "@/components/dialogs/CreateProjectDialog";
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

// --- Draggable card ---
function TaskCard({ card, isDragOverlay }: { card: any; isDragOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { status: card.status },
  });

  const style = isDragOverlay
    ? undefined
    : {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.35 : 1,
      };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={style}
      {...(isDragOverlay ? {} : { ...listeners, ...attributes })}
      className={`bg-surface-2 border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-border/80 hover:-translate-y-px transition-all touch-none select-none ${
        isDragOverlay ? "shadow-lg ring-2 ring-primary/30 rotate-[2deg] scale-105" : ""
      }`}
    >
      <div className="text-xs font-semibold text-foreground mb-2">{card.title}</div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1 flex-wrap">
          {(card.tags ?? []).map((t: string) => (
            <span key={t} className="font-mono text-[9px] bg-surface-3 text-muted-foreground px-1.5 py-px rounded">
              {t}
            </span>
          ))}
        </div>
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityColor[card.priority] ?? "bg-gh-amber"}`} />
      </div>
    </div>
  );
}

// --- Droppable column ---
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
        <span className="font-mono text-[10px] bg-surface-3 text-muted-foreground px-[7px] py-px rounded-full">
          {cards.length}
        </span>
      </div>
      <div className="p-2.5 flex flex-col gap-2 min-h-[120px]">
        {cards.length === 0 ? (
          <div className="text-[11px] text-muted-foreground text-center py-4">
            {isOver ? "Déposer ici" : "Aucune tâche"}
          </div>
        ) : (
          cards.map((card) => <TaskCard key={card.id} card={card} />)
        )}
      </div>
    </div>
  );
}

export default function ProjetsPage() {
  const { data: tasks, isLoading } = useTasks();
  const updateStatus = useUpdateTaskStatus();
  const [activeTask, setActiveTask] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const grouped = columns.map((col) => ({
    ...col,
    cards: tasks?.filter((t) => t.status === col.key) ?? [],
  }));

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks?.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
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
      {
        onSuccess: () => toast.success("Statut mis à jour"),
        onError: () => toast.error("Erreur lors de la mise à jour"),
      }
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Projets & Tâches"
        subtitle="Kanban et suivi des projets en cours"
        actions={
          <>
            <GhButton
              variant="ghost"
              onClick={() =>
                tasks &&
                exportToCSV(tasks, "taches", [
                  { key: "title", label: "Titre" },
                  { key: "status", label: "Statut" },
                  { key: "priority", label: "Priorité" },
                  { key: "due_date", label: "Échéance" },
                ])
              }
            >
              ⤓ CSV
            </GhButton>
            <CreateProjectDialog>
              <GhButton variant="secondary">+ Projet</GhButton>
            </CreateProjectDialog>
            <CreateTaskDialog>
              <GhButton>+ Tâche</GhButton>
            </CreateTaskDialog>
          </>
        }
      />
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-xl" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {grouped.map((col) => (
              <KanbanColumn key={col.key} col={col} cards={col.cards} />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
            {activeTask ? <TaskCard card={activeTask} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </motion.div>
  );
}
