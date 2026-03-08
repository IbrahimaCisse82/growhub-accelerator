import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useMilestones } from "@/hooks/useMilestones";

const statusColor: Record<string, "green" | "blue" | "amber" | "gray"> = {
  completed: "green", pending: "amber", in_progress: "blue", cancelled: "gray",
};

export default function JalonsPage() {
  const { data: milestones, isLoading } = useMilestones();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Jalons" subtitle="Jalons rattachés aux projets" />
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : !milestones || milestones.length === 0 ? (
        <EmptyState icon="🏁" title="Aucun jalon" description="Les jalons apparaîtront ici une fois créés dans les projets" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Jalon</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Projet</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Échéance</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Terminé le</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map(m => (
                <tr key={m.id} className="border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground text-xs">{m.title}</div>
                    {m.description && <div className="text-[10px] text-muted-foreground truncate max-w-[250px]">{m.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{m.projects?.name ?? "—"}</td>
                  <td className="px-4 py-3"><Pill color={statusColor[m.status ?? "pending"] ?? "gray"}>{m.status ?? "pending"}</Pill></td>
                  <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground">{m.due_date ? new Date(m.due_date).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground">{m.completed_at ? new Date(m.completed_at).toLocaleDateString("fr-FR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
