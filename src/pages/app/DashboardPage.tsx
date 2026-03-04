import { motion } from "framer-motion";
import StatCard from "@/components/shared/StatCard";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useStartupsCount } from "@/hooks/useStartups";
import { useProjects } from "@/hooks/useProjects";
import { useGrants } from "@/hooks/useGrants";
import { useApplicationsPipeline } from "@/hooks/useApplications";
import { useCohorts } from "@/hooks/useCohorts";

const statusColor: Record<string, "green" | "blue" | "amber" | "gray"> = {
  active: "green", draft: "gray", paused: "amber", completed: "blue", cancelled: "gray",
};

export default function DashboardPage() {
  const { data: startupsCount, isLoading: loadingStartups } = useStartupsCount();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: grants, isLoading: loadingGrants } = useGrants();
  const { data: pipeline } = useApplicationsPipeline();
  const { data: cohorts } = useCohorts();

  const activeGrants = grants?.filter((g) => g.status === "active" || g.status === "disbursing") ?? [];
  const totalFunding = activeGrants.reduce((a, g) => a + g.amount_total, 0);
  const activeCohorts = cohorts?.filter((c) => c.status === "active").length ?? 0;

  const pipelineSteps = [
    { key: "submitted", label: "Reçues" },
    { key: "screening", label: "Examen" },
    { key: "interview", label: "Entretien" },
    { key: "due_diligence", label: "Due Diligence" },
    { key: "accepted", label: "Acceptées" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <SectionHeader
        title="Vue d'ensemble"
        subtitle="Plateforme GrowHubLink — Tableau de bord unifié"
        actions={
          <>
            <GhButton variant="secondary">⤓ Exporter</GhButton>
            <GhButton variant="primary">+ Créer</GhButton>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Startups Actives" value={loadingStartups ? "…" : String(startupsCount)} note="" icon="△" color="green" />
        <StatCard label="Financements (XOF)" value={loadingGrants ? "…" : new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(totalFunding)} note={`${activeGrants.length} grants actifs`} icon="◎" color="blue" />
        <StatCard label="Projets" value={loadingProjects ? "…" : String(projects?.length ?? 0)} note="" icon="◑" color="amber" />
        <StatCard label="Cohortes actives" value={String(activeCohorts)} note="" icon="◉" color="purple" />
      </div>

      {/* Projects table + Pipeline */}
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <GhCard title="Projets Actifs" badge={String(projects?.length ?? 0)} action={<GhButton variant="ghost">Voir tout →</GhButton>} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-surface-2">
                  {["Projet", "Startup", "Statut", "Avancement", "Échéance"].map((h) => (
                    <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingProjects ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-3.5 py-2.5 border-b border-border"><Skeleton className="h-4 w-20" /></td>)}</tr>
                  ))
                ) : projects?.length === 0 ? (
                  <tr><td colSpan={5} className="px-3.5 py-8 text-center text-text-secondary text-sm">Aucun projet</td></tr>
                ) : (
                  projects?.slice(0, 6).map((p) => {
                    const sc = statusColor[p.status] ?? "gray";
                    return (
                      <tr key={p.id} className="hover:bg-surface-2 transition-colors">
                        <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{p.name}</td>
                        <td className="px-3.5 py-2.5 border-b border-border text-foreground">{p.startups?.name ?? "—"}</td>
                        <td className="px-3.5 py-2.5 border-b border-border"><Pill color={sc}>{p.status}</Pill></td>
                        <td className="px-3.5 py-2.5 border-b border-border">
                          <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gh-green transition-all duration-600" style={{ width: `${p.progress ?? 0}%` }} />
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">
                          {p.end_date ? new Date(p.end_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GhCard>

        <GhCard title="Pipeline Candidatures" action={<GhButton variant="ghost">Voir tout →</GhButton>}>
          <div className="flex flex-col gap-2">
            {pipelineSteps.map((step) => (
              <div key={step.key} className="flex justify-between items-center py-1.5 border-b border-border last:border-b-0">
                <span className="text-[11.5px] text-text-secondary">{step.label}</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {pipeline ? (pipeline as any)[step.key] ?? 0 : "—"}
                </span>
              </div>
            ))}
          </div>
        </GhCard>
      </div>

      {/* Grants */}
      <GhCard title="Financements Actifs" action={<GhButton variant="ghost">Voir tout →</GhButton>}>
        <div className="flex flex-col gap-2.5">
          {loadingGrants ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 rounded" />)
          ) : activeGrants.length === 0 ? (
            <div className="text-[11.5px] text-text-secondary text-center py-4">Aucun financement actif</div>
          ) : (
            activeGrants.map((g) => {
              const pct = g.amount_total > 0 ? Math.round(((g.amount_disbursed ?? 0) / g.amount_total) * 100) : 0;
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-[10px] text-text-tertiary mb-1">
                    <span>{g.organization ?? g.name}</span>
                    <span className="font-mono">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gh-blue transition-all duration-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GhCard>
    </motion.div>
  );
}
