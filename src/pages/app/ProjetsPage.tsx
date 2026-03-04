import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/hooks/useTasks";

const columns = [
  { key: "todo", title: "À faire" },
  { key: "in_progress", title: "En cours" },
  { key: "in_review", title: "En revue" },
  { key: "done", title: "Terminé" },
] as const;

const priorityColor: Record<string, string> = {
  low: "bg-gh-green", medium: "bg-gh-amber", high: "bg-gh-rose", critical: "bg-gh-rose",
};

export default function ProjetsPage() {
  const { data: tasks, isLoading } = useTasks();

  const grouped = columns.map((col) => ({
    ...col,
    cards: tasks?.filter((t) => t.status === col.key) ?? [],
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Projets & Tâches"
        subtitle="Kanban et suivi des projets en cours"
        actions={<><GhButton variant="ghost">📋 Liste</GhButton><GhButton>+ Nouveau projet</GhButton></>}
      />
      <div className="grid grid-cols-4 gap-3.5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[300px] rounded-xl" />)
        ) : (
          grouped.map((col) => (
            <div key={col.key} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{col.title}</span>
                <span className="font-mono text-[10px] bg-surface-3 text-text-secondary px-[7px] py-px rounded-full">{col.cards.length}</span>
              </div>
              <div className="p-2.5 flex flex-col gap-2 min-h-[120px]">
                {col.cards.length === 0 ? (
                  <div className="text-[11px] text-text-tertiary text-center py-4">Aucune tâche</div>
                ) : (
                  col.cards.map((card) => (
                    <div key={card.id} className="bg-surface-2 border border-border rounded-lg p-3 cursor-pointer hover:border-border/80 hover:-translate-y-px transition-all hover:shadow-lg hover:shadow-black/30">
                      <div className="text-xs font-semibold text-foreground mb-2">{card.title}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-1">
                          {(card.tags ?? []).map((t) => (
                            <span key={t} className="font-mono text-[9px] bg-surface-3 text-text-secondary px-1.5 py-px rounded">{t}</span>
                          ))}
                        </div>
                        <div className={`w-1.5 h-1.5 rounded-full ${priorityColor[card.priority] ?? "bg-gh-amber"}`} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
