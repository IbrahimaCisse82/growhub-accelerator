import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SectionHeader from "@/components/shared/SectionHeader";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import GhButton from "@/components/shared/GhButton";
import { exportToCSV } from "@/lib/exportUtils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area,
  RadialBarChart, RadialBar,
} from "recharts";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(346 77% 50%)",
  "hsl(262 83% 58%)",
  "hsl(199 89% 48%)",
  "hsl(25 95% 53%)",
];

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  active: "Actif",
  disbursing: "Décaissement",
  closing: "Clôture",
  closed: "Clôturé",
};

function useGrantsAnalyticsData() {
  const grants = useQuery({
    queryKey: ["grants_analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grants").select("*, programs(name, code)").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const transactions = useQuery({
    queryKey: ["grants_analytics_transactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grant_transactions").select("*").order("transaction_date");
      if (error) throw error;
      return data;
    },
  });

  const disbursements = useQuery({
    queryKey: ["grants_analytics_disbursements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grant_disbursements").select("*");
      if (error) throw error;
      return data;
    },
  });

  const activities = useQuery({
    queryKey: ["grants_analytics_activities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grant_activities").select("*");
      if (error) throw error;
      return data;
    },
  });

  const indicators = useQuery({
    queryKey: ["grants_analytics_indicators"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grant_indicators").select("*");
      if (error) throw error;
      return data;
    },
  });

  const reports = useQuery({
    queryKey: ["grants_analytics_reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grant_reports").select("*");
      if (error) throw error;
      return data;
    },
  });

  return {
    grants: grants.data ?? [],
    transactions: transactions.data ?? [],
    disbursements: disbursements.data ?? [],
    activities: activities.data ?? [],
    indicators: indicators.data ?? [],
    reports: reports.data ?? [],
    isLoading: grants.isLoading,
  };
}

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "11px",
    fontFamily: "monospace",
  },
  labelStyle: { color: "hsl(var(--foreground))", fontWeight: 600 },
};

export default function GrantsAnalyticsPage() {
  const { grants, transactions, disbursements, activities, indicators, reports, isLoading } = useGrantsAnalyticsData();

  // KPIs
  const [compareGrants, setCompareGrants] = useState<string[]>([]);

  const totalBudget = grants.reduce((s, g) => s + (g.amount_total ?? 0), 0);
  const totalDisbursed = grants.reduce((s, g) => s + (g.amount_disbursed ?? 0), 0);
  const totalSpent = transactions.reduce((s, t) => s + (t.amount ?? 0), 0);
  const activeGrants = grants.filter(g => g.status === "active" || g.status === "disbursing").length;
  const avgConsumption = totalBudget > 0 ? Math.round((totalDisbursed / totalBudget) * 100) : 0;
  const pendingDisbursements = disbursements.filter(d => d.status === "pending").length;

  // (forecast moved after monthlySpending)

  // Grant comparison data
  const comparisonData = useMemo(() => {
    if (compareGrants.length < 2) return [];
    return compareGrants.map(id => {
      const g = grants.find(gr => gr.id === id);
      if (!g) return null;
      const spent = transactions.filter(t => t.grant_id === id).reduce((s, t) => s + (t.amount ?? 0), 0);
      const gActs = activities.filter(a => a.grant_id === id);
      const pct = g.amount_total > 0 ? Math.round(((g.amount_disbursed ?? 0) / g.amount_total) * 100) : 0;
      return { code: g.code, name: g.name, budget: g.amount_total, disbursed: g.amount_disbursed ?? 0, spent, pct, activities: gActs.length, completedActs: gActs.filter(a => a.status === "completed").length };
    }).filter(Boolean) as any[];
  }, [compareGrants, grants, transactions, activities]);

  // Chart 1: Budget par grant (bar)
  const budgetByGrant = useMemo(() =>
    grants.map(g => ({
      name: g.code,
      fullName: g.name,
      budget: g.amount_total ?? 0,
      décaissé: g.amount_disbursed ?? 0,
      dépensé: transactions.filter(t => t.grant_id === g.id).reduce((s, t) => s + (t.amount ?? 0), 0),
    })),
    [grants, transactions]
  );

  // Chart 2: Répartition par statut (pie)
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    grants.forEach(g => { counts[g.status] = (counts[g.status] ?? 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: statusLabels[status] ?? status,
      value: count,
    }));
  }, [grants]);

  // Chart 3: Dépenses mensuelles (area)
  const monthlySpending = useMemo(() => {
    const months: Record<string, number> = {};
    transactions.forEach(t => {
      const month = t.transaction_date?.slice(0, 7);
      if (month) months[month] = (months[month] ?? 0) + (t.amount ?? 0);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        mois: month,
        dépenses: total,
      }));
  }, [transactions]);

  // Forecast: project spending trend forward
  const forecast = useMemo(() => {
    if (monthlySpending.length < 3) return [];
    const last3 = monthlySpending.slice(-3);
    const avgMonthly = last3.reduce((s, m) => s + m.dépenses, 0) / 3;
    const lastMonth = last3[last3.length - 1]?.mois ?? "";
    const result = [...monthlySpending];
    for (let i = 1; i <= 6; i++) {
      const [y, m] = (lastMonth || "2026-01").split("-").map(Number);
      const nm = m + i > 12 ? m + i - 12 : m + i;
      const ny = m + i > 12 ? y + 1 : y;
      result.push({ mois: `${ny}-${String(nm).padStart(2, "0")}`, dépenses: 0, prévision: Math.round(avgMonthly) } as any);
    }
    return result;
  }, [monthlySpending]);

  // Chart 4: Avancement des activités par grant (radial)
  const activityProgress = useMemo(() => {
    const byGrant: Record<string, { total: number; sum: number; name: string }> = {};
    activities.forEach(a => {
      const grant = grants.find(g => g.id === a.grant_id);
      if (!byGrant[a.grant_id]) byGrant[a.grant_id] = { total: 0, sum: 0, name: grant?.code ?? "?" };
      byGrant[a.grant_id].total += 1;
      byGrant[a.grant_id].sum += (a.progress ?? 0);
    });
    return Object.values(byGrant).map((v, i) => ({
      name: v.name,
      progress: v.total > 0 ? Math.round(v.sum / v.total) : 0,
      fill: COLORS[i % COLORS.length],
    }));
  }, [activities, grants]);

  // Chart 5: Décaissements par statut
  const disbursementsByStatus = useMemo(() => {
    const statusMap: Record<string, number> = {};
    disbursements.forEach(d => {
      statusMap[d.status] = (statusMap[d.status] ?? 0) + (d.amount_requested ?? 0);
    });
    const labels: Record<string, string> = { pending: "En attente", approved: "Approuvé", received: "Reçu", rejected: "Rejeté" };
    return Object.entries(statusMap).map(([status, amount]) => ({
      name: labels[status] ?? status,
      montant: amount,
    }));
  }, [disbursements]);

  // Chart 6: Indicateurs - atteinte des cibles
  const indicatorAttainment = useMemo(() => {
    return indicators.slice(0, 10).map(ind => ({
      name: ind.name?.length > 20 ? ind.name.slice(0, 18) + "…" : ind.name,
      cible: ind.target_value ?? 0,
      actuel: ind.current_value ?? 0,
    }));
  }, [indicators]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <SectionHeader
        title="Analytics Grants"
        subtitle="Vue consolidée multi-projets — performance financière et opérationnelle"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Grants actifs" value={`${activeGrants}`} note={`${grants.length} total`} color="blue" />
        <StatCard label="Budget total" value={`${fmt(totalBudget)}`} note="tous projets" color="green" />
        <StatCard label="Décaissé" value={`${fmt(totalDisbursed)}`} note={`${avgConsumption}% du budget`} color="purple" />
        <StatCard label="Dépenses réelles" value={`${fmt(totalSpent)}`} note={`${transactions.length} transactions`} color="amber" />
        <StatCard label="Activités" value={`${activities.length}`} note={`${activities.filter(a => a.status === "completed").length} terminées`} color="green" />
        <StatCard label="Décaissements" value={`${disbursements.length}`} note={`${pendingDisbursements} en attente`} color="rose" />
      </div>

      {/* Row 1: Budget par grant + Statuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Budget vs Décaissé vs Dépensé" subtitle="Par projet" className="lg:col-span-2">
          {budgetByGrant.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetByGrant} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => fmt(v)} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="budget" name="Budget" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="décaissé" name="Décaissé" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="dépensé" name="Dépensé" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Répartition par statut" subtitle="Nombre de grants">
          {statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name} (${value})`}>
                  {statusDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Row 2: Dépenses mensuelles + Décaissements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Évolution des dépenses" subtitle="Montant mensuel">
          {monthlySpending.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlySpending} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => fmt(v)} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="dépenses" stroke={COLORS[0]} fill="url(#gradDep)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Décaissements par statut" subtitle="Montant total par état">
          {disbursementsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={disbursementsByStatus} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => fmt(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="montant" fill={COLORS[5]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Row 3: Activités + Indicateurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Avancement des activités" subtitle="% moyen par projet">
          {activityProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={activityProgress} startAngle={180} endAngle={0}>
                <RadialBar dataKey="progress" background cornerRadius={6} label={{ position: "insideStart", fill: "hsl(var(--foreground))", fontSize: 10 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} formatter={(value: string, entry: any) => `${entry.payload.name} — ${entry.payload.progress}%`} />
                <Tooltip {...tooltipStyle} />
              </RadialBarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Indicateurs — Cible vs Actuel" subtitle="Top 10 indicateurs">
          {indicatorAttainment.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={indicatorAttainment} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="cible" name="Cible" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="actuel" name="Actuel" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Tableau récapitulatif */}
      <ChartCard title="Synthèse par projet" subtitle="Vue consolidée">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-secondary">
                {["Code", "Nom", "Statut", "Budget", "Décaissé", "Dépensé", "Taux", "Activités", "Indicateurs"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-mono uppercase text-muted-foreground tracking-wider border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grants.map(g => {
                const spent = transactions.filter(t => t.grant_id === g.id).reduce((s, t) => s + (t.amount ?? 0), 0);
                const pct = g.amount_total > 0 ? Math.round(((g.amount_disbursed ?? 0) / g.amount_total) * 100) : 0;
                const grantActivities = activities.filter(a => a.grant_id === g.id);
                const grantIndicators = indicators.filter(i => i.grant_id === g.id);
                const st = statusLabels[g.status] ?? g.status;
                return (
                  <tr key={g.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-3 py-2.5 border-b border-border font-mono text-primary font-semibold">{g.code}</td>
                    <td className="px-3 py-2.5 border-b border-border font-semibold text-foreground max-w-[200px] truncate">{g.name}</td>
                    <td className="px-3 py-2.5 border-b border-border">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        g.status === "active" ? "bg-green-500/10 text-green-600" :
                        g.status === "disbursing" ? "bg-blue-500/10 text-blue-600" :
                        "bg-muted text-muted-foreground"
                      }`}>{st}</span>
                    </td>
                    <td className="px-3 py-2.5 border-b border-border font-mono text-foreground">{fmt(g.amount_total)}</td>
                    <td className="px-3 py-2.5 border-b border-border font-mono text-foreground">{fmt(g.amount_disbursed ?? 0)}</td>
                    <td className="px-3 py-2.5 border-b border-border font-mono text-foreground">{fmt(spent)}</td>
                    <td className="px-3 py-2.5 border-b border-border">
                      <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${pct > 80 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{pct}%</span>
                    </td>
                    <td className="px-3 py-2.5 border-b border-border text-center font-mono text-muted-foreground">
                      {grantActivities.filter(a => a.status === "completed").length}/{grantActivities.length}
                    </td>
                    <td className="px-3 py-2.5 border-b border-border text-center font-mono text-muted-foreground">
                      {grantIndicators.length}
                    </td>
                  </tr>
                );
              })}
              {grants.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground text-sm">Aucun grant enregistré</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </motion.div>
  );
}

function ChartCard({ title, subtitle, children, className = "" }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-border">
        <div className="text-xs font-bold text-foreground">{title}</div>
        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{subtitle}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
      <div className="text-center">
        <div className="text-2xl mb-2">📊</div>
        <div>Aucune donnée disponible</div>
      </div>
    </div>
  );
}
