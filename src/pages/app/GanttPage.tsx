import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import { useMilestones } from "@/hooks/useMilestones";

const statusColor: Record<string, "green" | "blue" | "amber" | "gray"> = {
  active: "green", draft: "gray", paused: "amber", completed: "blue", cancelled: "gray",
};

export default function GanttPage() {
  const { data: projects, isLoading: lp } = useProjects();
  const { data: milestones, isLoading: lm } = useMilestones();

  const loading = lp || lm;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Gantt" subtitle="Vue chronologique des projets et jalons" actions={<GhButton variant="ghost">📅 Calendrier</GhButton>} />
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-4">
          {(!projects || projects.length === 0) ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">Aucun projet à afficher</div>
          ) : projects.map(p => {
            const pMilestones = milestones?.filter(m => m.project_id === p.id) ?? [];
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-foreground">{p.name}</span>
                    <span className="ml-2 font-mono text-[10px] text-muted-foreground">{p.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill color={statusColor[p.status] ?? "gray"}>{p.status}</Pill>
                    <div className="w-24 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress ?? 0}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{p.progress ?? 0}%</span>
                  </div>
                </div>
                {pMilestones.length > 0 && (
                  <div className="px-4 py-2 flex flex-wrap gap-2">
                    {pMilestones.map(m => (
                      <div key={m.id} className={`text-[11px] px-2.5 py-1 rounded-lg border ${m.status === "completed" ? "bg-primary/10 border-primary/20 text-primary" : "bg-surface-2 border-border text-muted-foreground"}`}>
                        {m.title}
                        {m.due_date && <span className="ml-1 font-mono text-[9px]">· {new Date(m.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="px-4 py-2 bg-secondary text-[11px] text-muted-foreground flex gap-4">
                  <span>Début: {p.start_date ? new Date(p.start_date).toLocaleDateString("fr-FR") : "—"}</span>
                  <span>Fin: {p.end_date ? new Date(p.end_date).toLocaleDateString("fr-FR") : "—"}</span>
                  <span>Jalons: {pMilestones.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
