import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/hooks/useTasks";
import CreateTaskDialog from "@/components/dialogs/CreateTaskDialog";
import CreateProjectDialog from "@/components/dialogs/CreateProjectDialog";
import { exportToCSV } from "@/lib/exportUtils";

const columns = [
  { key: "todo", title: "À faire" },
  { key: "in_progress", title: "En cours" },
  { key: "in_review", title: "En revue" },
  { key: "done", title: "Terminé" },
] as const;

const priorityColor: Record<string, string> = { low: "bg-primary", medium: "bg-gh-amber", high: "bg-destructive", critical: "bg-destructive" };

export default function ProjetsPage() {
  const { data: tasks, isLoading } = useTasks();
  const grouped = columns.map((col) => ({ ...col, cards: tasks?.filter((t) => t.status === col.key) ?? [] }));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Projets & Tâches" subtitle="Kanban et suivi des projets en cours"
        actions={<>
          <GhButton variant="ghost" onClick={() => tasks && exportToCSV(tasks, "taches", [
            { key: "title", label: "Titre" }, { key: "status", label: "Statut" },
            { key: "priority", label: "Priorité" }, { key: "due_date", label: "Échéance" },
          ])}>⤓ CSV</GhButton>
          <CreateProjectDialog><GhButton variant="secondary">+ Projet</GhButton></CreateProjectDialog>
          <CreateTaskDialog><GhButton>+ Tâche</GhButton></CreateTaskDialog>
        </>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[300px] rounded-xl" />) : grouped.map((col) => (
          <div key={col.key} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{col.title}</span>
              <span className="font-mono text-[10px] bg-surface-3 text-muted-foreground px-[7px] py-px rounded-full">{col.cards.length}</span>
            </div>
            <div className="p-2.5 flex flex-col gap-2 min-h-[120px]">
              {col.cards.length === 0 ? <div className="text-[11px] text-muted-foreground text-center py-4">Aucune tâche</div> : col.cards.map((card) => (
                <div key={card.id} className="bg-surface-2 border border-border rounded-lg p-3 cursor-pointer hover:border-border/80 hover:-translate-y-px transition-all">
                  <div className="text-xs font-semibold text-foreground mb-2">{card.title}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1 flex-wrap">{(card.tags ?? []).map((t) => <span key={t} className="font-mono text-[9px] bg-surface-3 text-muted-foreground px-1.5 py-px rounded">{t}</span>)}</div>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityColor[card.priority] ?? "bg-gh-amber"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
