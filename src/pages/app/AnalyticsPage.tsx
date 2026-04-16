import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import StatCard from "@/components/shared/StatCard";
import { useStartups, useStartupsCount } from "@/hooks/useStartups";
import { useGrants } from "@/hooks/useGrants";
import { useProjects } from "@/hooks/useProjects";
import { useCohorts } from "@/hooks/useCohorts";
import { useCoachingSessions } from "@/hooks/useCoachingSessions";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, AreaChart, Area, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import TopStartupsTable from "@/components/analytics/TopStartupsTable";
import DateRangePicker from "@/components/shared/DateRangePicker";
import { fr } from "date-fns/locale";

const COLORS = ["hsl(165,100%,41%)", "hsl(199,90%,48%)", "hsl(37,91%,55%)", "hsl(258,73%,62%)", "hsl(348,90%,60%)", "hsl(280,60%,50%)"];
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" };
const fmtNum = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

function useAllKpis() {
  return useQuery({
    queryKey: ["all-kpis-analytics"],
    queryFn: async () => {
      const { data } = await supabase.from("startup_kpis").select("*").order("recorded_at", { ascending: false });
      return data ?? [];
    },
  });
}

function useApplications() {
  return useQuery({
    queryKey: ["applications-analytics"],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("id, status, created_at, program_id, project_id").order("created_at");
      return data ?? [];
    },
  });
}

export default function AnalyticsPage() {
  const { data: startupsCount } = useStartupsCount();
  const { data: startups } = useStartups();
  const { data: grants } = useGrants();
  const { data: projects } = useProjects();
  const { data: cohorts } = useCohorts();
  const { data: sessions } = useCoachingSessions();
  const { data: applications } = useApplications();
  const { data: allKpis } = useAllKpis();
  const [period, setPeriod] = useState<"30d" | "90d" | "12m" | "all">("12m");

  // Impact KPIs
  const impactKpis = useMemo(() => {
    if (!allKpis || allKpis.length === 0) return { jobs: 0, revenue: 0, funding: 0 };
    const latestMap = new Map<string, typeof allKpis[0]>();
    for (const kpi of allKpis) {
      const key = `${kpi.startup_id}-${kpi.metric_name}`;
      if (!latestMap.has(key)) latestMap.set(key, kpi);
    }
    const latest = Array.from(latestMap.values());
    const sum = (m: string) => latest.filter(k => k.metric_name?.toLowerCase().includes(m)).reduce((s, k) => s + (Number(k.metric_value) || 0), 0);
    return {
      jobs: sum("emploi") + sum("job") + sum("effectif"),
      revenue: sum("chiffre") + sum("revenue") + sum("ca"),
      funding: sum("levée") + sum("fundrais") + sum("funding"),
    };
  }, [allKpis]);

  const inPeriod = (dateLike?: string | null) => {
    if (!dateLike || period === "all") return true;
    const date = new Date(dateLike).getTime();
    const now = Date.now();
    const days = period === "30d" ? 30 : period === "90d" ? 90 : 365;
    return now - date <= days * 24 * 60 * 60 * 1000;
  };

  const projectsFiltered = useMemo(() => (projects ?? []).filter(p => inPeriod(p.created_at)), [projects, period]);
  const grantsFiltered = useMemo(() => (grants ?? []).filter(g => inPeriod(g.created_at)), [grants, period]);
  const sessionsFiltered = useMemo(() => (sessions ?? []).filter(s => inPeriod(s.created_at)), [sessions, period]);

  const totalFunding = grantsFiltered.reduce((a, g) => a + g.amount_total, 0);
  const totalSessions = sessionsFiltered.length;
  const completedSessions = sessionsFiltered.filter(s => s.status === "completed").length;
  const avgProgress = projectsFiltered.length > 0 ? Math.round(projectsFiltered.reduce((a, p) => a + (p.progress ?? 0), 0) / projectsFiltered.length) : 0;

  const projectsByStatus = ["active", "draft", "completed", "paused", "cancelled"].map(s => ({
    name: s, value: projectsFiltered.filter(p => p.status === s).length,
  })).filter(d => d.value > 0);

  const grantsByStatus = ["active", "disbursing", "draft", "closing", "closed"].map(s => ({
    name: s, value: grantsFiltered.filter(g => g.status === s).length,
  })).filter(d => d.value > 0);

  const grantBars = grantsFiltered.slice(0, 8).map(g => ({
    name: g.code.slice(0, 8), total: g.amount_total, spent: g.amount_disbursed ?? 0,
  }));

  // Monthly trend (last 12 months)
  const monthlyTrend = useMemo(() => {
    const months: { month: string; startups: number; applications: number; sessions: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = startOfMonth(subMonths(new Date(), i));
      const end = endOfMonth(start);
      const label = format(start, "MMM yy", { locale: fr });
      months.push({
        month: label,
        startups: (startups ?? []).filter(s => {
          try { return isWithinInterval(parseISO(s.created_at), { start, end }); } catch { return false; }
        }).length,
        applications: (applications ?? []).filter(a => {
          try { return isWithinInterval(parseISO(a.created_at), { start, end }); } catch { return false; }
        }).length,
        sessions: (sessions ?? []).filter(s => {
          try { return isWithinInterval(parseISO(s.created_at), { start, end }); } catch { return false; }
        }).length,
      });
    }
    return months;
  }, [startups, applications, sessions]);

  // Cohort retention analysis
  const cohortRetention = useMemo(() => {
    if (!cohorts || !startups) return [];
    return cohorts.filter(c => c.status === "active" || c.status === "completed").map(c => {
      const cohortStartups = startups.filter(s => s.cohort_id === c.id);
      const total = cohortStartups.length;
      const graduated = cohortStartups.filter(s => s.stage === "growth" || s.stage === "scale").length;
      const active = cohortStartups.filter(s => !s.is_alumni).length;
      return {
        name: c.name.length > 15 ? c.name.slice(0, 15) + "…" : c.name,
        total,
        active,
        graduated,
        retentionPct: total > 0 ? Math.round((active / total) * 100) : 0,
        gradPct: total > 0 ? Math.round((graduated / total) * 100) : 0,
      };
    }).filter(c => c.total > 0);
  }, [cohorts, startups]);

  // Application funnel
  const appFunnel = useMemo(() => {
    if (!applications) return [];
    const statuses = ["submitted", "screening", "interview", "due_diligence", "accepted", "rejected"];
    return statuses.map(s => ({
      name: s === "submitted" ? "Soumises" : s === "screening" ? "Présélection" : s === "interview" ? "Entretien" : s === "due_diligence" ? "Due Diligence" : s === "accepted" ? "Acceptées" : "Rejetées",
      value: applications.filter(a => a.status === s).length,
    }));
  }, [applications]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <SectionHeader title="Analytics" subtitle="Performances, tendances et rétention"
        actions={<div className="flex items-center gap-2">
          <GhButton variant="ghost" onClick={() => {
            const rows = [
              { metric: "Entreprises", value: startupsCount ?? 0 },
              { metric: "Financement total (XOF)", value: totalFunding },
              { metric: "Cohortes", value: cohorts?.length ?? 0 },
              { metric: "Sessions coaching", value: totalSessions },
              { metric: "Avancement moyen", value: `${avgProgress}%` },
              { metric: "Emplois créés", value: impactKpis.jobs },
              { metric: "CA cumulé (XOF)", value: impactKpis.revenue },
              { metric: "Fonds levés (XOF)", value: impactKpis.funding },
            ];
            exportToCSV(rows, `analytics-${new Date().toISOString().slice(0, 10)}`, [
              { key: "metric", label: "Métrique" }, { key: "value", label: "Valeur" },
            ]);
          }}><Download size={13} className="mr-1" />CSV</GhButton>
          <GhButton variant="ghost" onClick={() => {
            const summary = [
              { metric: "Entreprises", value: startupsCount ?? 0 },
              { metric: "Financement total", value: totalFunding },
              { metric: "Cohortes", value: cohorts?.length ?? 0 },
              { metric: "Sessions coaching", value: totalSessions },
              { metric: "Avancement moyen", value: `${avgProgress}%` },
            ];
            exportToPDF("Analytics — Grow Hub", summary, [{ key: "metric", label: "Métrique" }, { key: "value", label: "Valeur" }]);
          }}>⎙ PDF</GhButton>
        </div>} />

      {/* Period filter */}
      <div className="flex items-center gap-2">
        {([
          { key: "30d", label: "30j" }, { key: "90d", label: "90j" }, { key: "12m", label: "12m" }, { key: "all", label: "Tout" },
        ] as const).map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${period === p.key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Entreprises" value={String(startupsCount ?? 0)} note="" color="green" />
        <StatCard label="Financement" value={new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(totalFunding)} note="XOF" color="blue" />
        <StatCard label="Cohortes" value={String(cohorts?.length ?? 0)} note={`${cohorts?.filter(c => c.status === "active").length ?? 0} actives`} color="amber" />
        <StatCard label="Coaching" value={String(totalSessions)} note={`${completedSessions} terminées`} color="purple" />
        <StatCard label="Candidatures" value={String(applications?.length ?? 0)} note={`${applications?.filter(a => a.status === "accepted").length ?? 0} acceptées`} color="green" />
      </div>

      {/* Impact KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Emplois créés" value={String(impactKpis.jobs)} note="estimés via KPIs" color="amber" />
        <StatCard label="CA cumulé" value={fmtNum(impactKpis.revenue)} note="XOF" color="green" />
        <StatCard label="Fonds levés" value={fmtNum(impactKpis.funding)} note="XOF" color="purple" />
      </div>

      {/* Monthly trend */}
      <GhCard title="📈 Tendance mensuelle (12 mois)">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="startups" fill="hsl(165,100%,41%)" stroke="hsl(165,100%,41%)" fillOpacity={0.2} name="Entreprises" />
            <Area type="monotone" dataKey="applications" fill="hsl(199,90%,48%)" stroke="hsl(199,90%,48%)" fillOpacity={0.2} name="Candidatures" />
            <Area type="monotone" dataKey="sessions" fill="hsl(258,73%,62%)" stroke="hsl(258,73%,62%)" fillOpacity={0.2} name="Sessions" />
          </AreaChart>
        </ResponsiveContainer>
      </GhCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project status */}
        <GhCard title="Projets par statut">
          {projectsByStatus.length === 0 ? <div className="text-sm text-muted-foreground text-center py-4">Aucun projet</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={projectsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {projectsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GhCard>

        {/* Financial bar */}
        <GhCard title="Financements — Budget vs Décaissé">
          {grantBars.length === 0 ? <div className="text-sm text-muted-foreground text-center py-4">Aucun financement</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={grantBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="total" fill="hsl(199,90%,48%)" radius={[4, 4, 0, 0]} name="Budget" />
                <Bar dataKey="spent" fill="hsl(165,100%,41%)" radius={[4, 4, 0, 0]} name="Décaissé" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GhCard>
      </div>

      {/* Cohort retention + Application funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GhCard title="🎯 Rétention par cohorte">
          {cohortRetention.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">Aucune donnée de cohorte</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cohortRetention} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="total" fill="hsl(var(--muted))" name="Total" radius={[0, 4, 4, 0]} />
                <Bar dataKey="active" fill="hsl(165,100%,41%)" name="Actives" radius={[0, 4, 4, 0]} />
                <Bar dataKey="graduated" fill="hsl(199,90%,48%)" name="Graduées" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GhCard>

        <GhCard title="📊 Funnel candidatures">
          {appFunnel.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">Aucune candidature</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={appFunnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="hsl(37,91%,55%)" radius={[4, 4, 0, 0]} name="Candidatures" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GhCard>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GhCard>
        <GhCard title="Taux de conversion">
          <div className="text-center py-4">
            <div className="font-mono text-4xl font-bold text-primary">
              {applications && applications.length > 0
                ? `${Math.round((applications.filter(a => a.status === "accepted").length / applications.length) * 100)}%`
                : "—"}
            </div>
            <div className="text-sm text-muted-foreground mt-2">Candidatures → Acceptées</div>
          </div>
        </GhCard>
      </div>

      {/* Top 10 Startups */}
      <TopStartupsTable />

      {/* Trend indicators */}
      <GhCard title="Indicateurs de tendance">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Entreprises", current: startupsCount ?? 0, icon: "green" as const },
            { label: "Candidatures", current: applications?.length ?? 0, icon: "blue" as const },
            { label: "Sessions", current: totalSessions, icon: "purple" as const },
            { label: "Projets", current: projectsFiltered.length, icon: "amber" as const },
          ].map(item => {
            const trend = item.current > 0 ? "up" : item.current === 0 ? "flat" : "down";
            return (
              <div key={item.label} className="flex items-center gap-3 bg-surface-2 rounded-lg p-3">
                {trend === "up" ? <TrendingUp size={16} className="text-gh-green" /> : trend === "down" ? <TrendingDown size={16} className="text-gh-rose" /> : <Minus size={16} className="text-muted-foreground" />}
                <div>
                  <div className="text-[11px] text-muted-foreground">{item.label}</div>
                  <div className="text-sm font-bold text-foreground">{item.current}</div>
                </div>
              </div>
            );
          })}
        </div>
      </GhCard>
    </motion.div>
  );
}
