import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import StatCard from "@/components/shared/StatCard";
import { useStartupsCount } from "@/hooks/useStartups";
import { useGrants } from "@/hooks/useGrants";
import { useProjects } from "@/hooks/useProjects";
import { useCohorts } from "@/hooks/useCohorts";
import { useCoachingSessions } from "@/hooks/useCoachingSessions";
import { exportToPDF } from "@/lib/exportUtils";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const COLORS = ["hsl(165,100%,41%)", "hsl(199,90%,48%)", "hsl(37,91%,55%)", "hsl(258,73%,62%)", "hsl(348,90%,60%)"];

export default function AnalyticsPage() {
  const { data: startupsCount } = useStartupsCount();
  const { data: grants } = useGrants();
  const { data: projects } = useProjects();
  const { data: cohorts } = useCohorts();
  const { data: sessions } = useCoachingSessions();

  const totalFunding = grants?.reduce((a, g) => a + g.amount_total, 0) ?? 0;
  const totalSessions = sessions?.length ?? 0;
  const completedSessions = sessions?.filter(s => s.status === "completed").length ?? 0;
  const avgProgress = projects && projects.length > 0 ? Math.round(projects.reduce((a, p) => a + (p.progress ?? 0), 0) / projects.length) : 0;

  const projectsByStatus = ["active", "draft", "completed", "paused", "cancelled"].map(s => ({
    name: s, value: projects?.filter(p => p.status === s).length ?? 0,
  })).filter(d => d.value > 0);

  const grantsByStatus = ["active", "disbursing", "draft", "closing", "closed"].map(s => ({
    name: s, value: grants?.filter(g => g.status === s).length ?? 0,
  })).filter(d => d.value > 0);

  const sessionsByStatus = ["planned", "confirmed", "completed", "cancelled"].map(s => ({
    name: s, value: sessions?.filter(se => se.status === s).length ?? 0,
  })).filter(d => d.value > 0);

  const grantBars = grants?.slice(0, 8).map(g => ({
    name: g.code.slice(0, 8), total: g.amount_total, spent: g.amount_disbursed ?? 0,
  })) ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Analytics" subtitle="Performances et métriques de la plateforme"
        actions={<GhButton variant="ghost" onClick={() => {
          const summary = [
            { metric: "Startups", value: startupsCount ?? 0 },
            { metric: "Financement total", value: totalFunding },
            { metric: "Cohortes", value: cohorts?.length ?? 0 },
            { metric: "Sessions coaching", value: totalSessions },
            { metric: "Avancement moyen", value: `${avgProgress}%` },
          ];
          exportToPDF("Analytics — GrowHub", summary, [{ key: "metric", label: "Métrique" }, { key: "value", label: "Valeur" }]);
        }}>⎙ PDF</GhButton>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Startups totales" value={String(startupsCount ?? 0)} note="" color="green" />
        <StatCard label="Financement total" value={new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(totalFunding)} note="XOF" color="blue" />
        <StatCard label="Cohortes" value={String(cohorts?.length ?? 0)} note={`${cohorts?.filter(c => c.status === "active").length ?? 0} actives`} color="amber" />
        <StatCard label="Sessions coaching" value={String(totalSessions)} note={`${completedSessions} terminées`} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <GhCard title="Projets par statut">
          {projectsByStatus.length === 0 ? <div className="text-sm text-muted-foreground text-center py-4">Aucun projet</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={projectsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {projectsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GhCard>
        <GhCard title="Financements — Budget vs Décaissé">
          {grantBars.length === 0 ? <div className="text-sm text-muted-foreground text-center py-4">Aucun financement</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={grantBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="total" fill="hsl(199,90%,48%)" radius={[4, 4, 0, 0]} name="Budget" />
                <Bar dataKey="spent" fill="hsl(165,100%,41%)" radius={[4, 4, 0, 0]} name="Décaissé" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GhCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <GhCard title="Avancement moyen">
          <div className="text-center py-4">
            <div className="font-mono text-4xl font-bold text-primary">{avgProgress}%</div>
            <div className="text-sm text-muted-foreground mt-2">Progression moyenne des projets</div>
            <div className="mt-3 h-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${avgProgress}%` }} /></div>
          </div>
        </GhCard>
        <GhCard title="Grants par statut">
          {grantsByStatus.length === 0 ? <div className="text-sm text-muted-foreground text-center py-4">—</div> : (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={grantsByStatus} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {grantsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GhCard>
        <GhCard title="Sessions par statut">
          {sessionsByStatus.length === 0 ? <div className="text-sm text-muted-foreground text-center py-4">—</div> : (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={sessionsByStatus} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {sessionsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GhCard>
      </div>
    </motion.div>
  );
}
