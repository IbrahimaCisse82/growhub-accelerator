import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import StatCard from "@/components/shared/StatCard";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import { useStartupsCount } from "@/hooks/useStartups";
import { useGrants } from "@/hooks/useGrants";
import { useProjects } from "@/hooks/useProjects";
import { useCohorts } from "@/hooks/useCohorts";
import { useCoachingSessions } from "@/hooks/useCoachingSessions";

export default function AnalyticsPage() {
  const { data: startupsCount } = useStartupsCount();
  const { data: grants } = useGrants();
  const { data: projects } = useProjects();
  const { data: cohorts } = useCohorts();
  const { data: sessions } = useCoachingSessions();

  const totalFunding = grants?.reduce((a, g) => a + g.amount_total, 0) ?? 0;
  const completedProjects = projects?.filter(p => p.status === "completed").length ?? 0;
  const totalSessions = sessions?.length ?? 0;
  const completedSessions = sessions?.filter(s => s.status === "completed").length ?? 0;
  const avgProgress = projects && projects.length > 0 ? Math.round(projects.reduce((a, p) => a + (p.progress ?? 0), 0) / projects.length) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Analytics" subtitle="Performances et métriques de la plateforme"
        actions={<GhButton variant="ghost">⤓ Exporter</GhButton>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Startups totales" value={String(startupsCount ?? 0)} note="" color="green" />
        <StatCard label="Financement total" value={new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(totalFunding)} note="XOF" color="blue" />
        <StatCard label="Cohortes" value={String(cohorts?.length ?? 0)} note={`${cohorts?.filter(c => c.status === "active").length ?? 0} actives`} color="amber" />
        <StatCard label="Sessions coaching" value={String(totalSessions)} note={`${completedSessions} terminées`} color="purple" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <GhCard title="Projets">
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total projets</span><span className="font-mono font-semibold text-foreground">{projects?.length ?? 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Complétés</span><span className="font-mono font-semibold text-primary">{completedProjects}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avancement moyen</span><span className="font-mono font-semibold text-foreground">{avgProgress}%</span></div>
            <div className="h-2 bg-surface-3 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${avgProgress}%` }} /></div>
          </div>
        </GhCard>
        <GhCard title="Financements">
          <div className="space-y-3">
            {grants?.slice(0, 5).map(g => {
              const pct = g.amount_total > 0 ? Math.round(((g.amount_disbursed ?? 0) / g.amount_total) * 100) : 0;
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1"><span>{g.name}</span><span className="font-mono">{pct}%</span></div>
                  <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
            {(!grants || grants.length === 0) && <div className="text-sm text-muted-foreground text-center py-4">Aucun financement</div>}
          </div>
        </GhCard>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GhCard title="Répartition par statut">
          <div className="space-y-2">
            {["active", "draft", "completed", "paused"].map(s => {
              const count = projects?.filter(p => p.status === s).length ?? 0;
              return <div key={s} className="flex justify-between text-sm"><span className="text-muted-foreground capitalize">{s}</span><span className="font-mono font-semibold text-foreground">{count}</span></div>;
            })}
          </div>
        </GhCard>
        <GhCard title="Grants par statut">
          <div className="space-y-2">
            {["active", "disbursing", "draft", "closed"].map(s => {
              const count = grants?.filter(g => g.status === s).length ?? 0;
              return <div key={s} className="flex justify-between text-sm"><span className="text-muted-foreground capitalize">{s}</span><span className="font-mono font-semibold text-foreground">{count}</span></div>;
            })}
          </div>
        </GhCard>
        <GhCard title="Sessions par statut">
          <div className="space-y-2">
            {["planned", "confirmed", "completed", "cancelled"].map(s => {
              const count = sessions?.filter(se => se.status === s).length ?? 0;
              return <div key={s} className="flex justify-between text-sm"><span className="text-muted-foreground capitalize">{s}</span><span className="font-mono font-semibold text-foreground">{count}</span></div>;
            })}
          </div>
        </GhCard>
      </div>
    </motion.div>
  );
}
