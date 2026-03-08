import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import CreateProjectDialog from "@/components/dialogs/CreateProjectDialog";
import { exportToCSV } from "@/lib/exportUtils";

const statusColor: Record<string, "green" | "blue" | "amber" | "gray"> = {
  active: "green", draft: "gray", paused: "amber", completed: "blue", cancelled: "gray",
};

export default function ProjetsPage() {
  const { data: projects, isLoading } = useProjects();
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Projets"
        subtitle="Liste des projets rattachés aux programmes"
        actions={
          <>
            <GhButton variant="ghost" onClick={() => projects && exportToCSV(projects, "projets", [
              { key: "name", label: "Nom" }, { key: "code", label: "Code" }, { key: "status", label: "Statut" }, { key: "progress", label: "Progression" },
            ])}>⤓ CSV</GhButton>
            <CreateProjectDialog><GhButton>+ Projet</GhButton></CreateProjectDialog>
          </>
        }
      />
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !projects || projects.length === 0 ? (
        <EmptyState icon="📁" title="Aucun projet" description="Créez un projet pour commencer" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Nom</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Programme</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Progression</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Dates</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-secondary/50 cursor-pointer transition-colors" onClick={() => navigate(`/app/projets/${p.id}`)}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground text-xs">{p.name}</div>
                    {p.code && <div className="text-[10px] font-mono text-muted-foreground">{p.code}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.programs?.name ?? "—"}</td>
                  <td className="px-4 py-3"><Pill color={statusColor[p.status] ?? "gray"}>{p.status}</Pill></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress ?? 0}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{p.progress ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground">
                    {p.start_date ? new Date(p.start_date).toLocaleDateString("fr-FR") : "—"} → {p.end_date ? new Date(p.end_date).toLocaleDateString("fr-FR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
