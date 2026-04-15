import { motion } from "framer-motion";
import { useMemo } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import StatCard from "@/components/shared/StatCard";
import { useStartups, useStartupsCount } from "@/hooks/useStartups";
import { useGrants } from "@/hooks/useGrants";
import { useProjects } from "@/hooks/useProjects";
import { useCohorts } from "@/hooks/useCohorts";
import { useStartupKpis } from "@/hooks/useStartupKpis";
import { useCoachingSessions } from "@/hooks/useCoachingSessions";
import { exportToJSON, exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { useEvents } from "@/hooks/useEvents";
import { Triangle, Target, FolderKanban, TrendingUp, FileText, Download, Printer, Users, DollarSign, Briefcase, type LucideIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["hsl(165,100%,41%)", "hsl(199,90%,48%)", "hsl(37,91%,55%)", "hsl(258,73%,62%)", "hsl(348,90%,60%)"];
const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

const reports: { id: string; title: string; description: string; Icon: LucideIcon }[] = [
  { id: "startups", title: "Rapport Entreprises", description: "Vue d'ensemble des entreprises accompagnées, secteurs, stades et scores", Icon: Triangle },
  { id: "financial", title: "Rapport Financier", description: "Synthèse des grants, budgets, décaissements et taux d'utilisation", Icon: Target },
  { id: "programs", title: "Rapport Programmes", description: "Performance des programmes, cohortes et taux de complétion", Icon: FolderKanban },
  { id: "impact", title: "Rapport d'Impact", description: "Métriques d'impact : emplois créés, levées de fonds, croissance", Icon: TrendingUp },
];

function useAllStartupKpis() {
  return useQuery({
    queryKey: ["all-startup-kpis"],
    queryFn: async () => {
      const { data } = await supabase.from("startup_kpis").select("*").order("recorded_at", { ascending: false });
      return data ?? [];
    },
  });
}

export default function RapportsPage() {
  const { data: startupsCount } = useStartupsCount();
  const { data: startups } = useStartups();
  const { data: grants } = useGrants();
  const { data: projects } = useProjects();
  const { data: cohorts } = useCohorts();
  const { data: sessions } = useCoachingSessions();
  const { data: allKpis } = useAllStartupKpis();
  const { data: events } = useEvents();

  const activeGrants = grants?.filter(g => g.status === "active" || g.status === "disbursing") ?? [];
  const totalFunding = activeGrants.reduce((a, g) => a + g.amount_total, 0);

  // Impact KPIs aggregation
  const impactMetrics = useMemo(() => {
    if (!allKpis || allKpis.length === 0) return null;
    // Get latest KPI per startup per metric
    const latestByStartupMetric = new Map<string, typeof allKpis[0]>();
    for (const kpi of allKpis) {
      const key = `${kpi.startup_id}-${kpi.metric_name}`;
      if (!latestByStartupMetric.has(key)) latestByStartupMetric.set(key, kpi);
    }
    const latest = Array.from(latestByStartupMetric.values());

    const sum = (metric: string) => latest.filter(k => k.metric_name?.toLowerCase().includes(metric)).reduce((s, k) => s + (Number(k.metric_value) || 0), 0);

    return {
      totalRevenue: sum("chiffre") + sum("revenue") + sum("ca"),
      totalJobs: sum("emploi") + sum("job") + sum("effectif"),
      totalFundsRaised: sum("levée") + sum("fundrais") + sum("funding"),
      totalClients: sum("client") + sum("customer") + sum("utilisateur"),
    };
  }, [allKpis]);

  // Sector distribution
  const sectorData = useMemo(() => {
    if (!startups) return [];
    const sectors = new Map<string, number>();
    startups.forEach(s => {
      const sector = s.sector ?? "Non défini";
      sectors.set(sector, (sectors.get(sector) ?? 0) + 1);
    });
    return Array.from(sectors.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [startups]);

  // Stage distribution
  const stageData = useMemo(() => {
    if (!startups) return [];
    const stages = new Map<string, number>();
    startups.forEach(s => {
      const stage = s.stage ?? "Non défini";
      stages.set(stage, (stages.get(stage) ?? 0) + 1);
    });
    return Array.from(stages.entries()).map(([name, value]) => ({ name, value }));
  }, [startups]);

  // Coaching stats
  const coachingStats = useMemo(() => {
    if (!sessions) return { total: 0, completed: 0, hours: 0 };
    return {
      total: sessions.length,
      completed: sessions.filter(s => s.status === "completed").length,
      hours: sessions.reduce((s, se) => s + (se.duration_minutes ?? 60), 0) / 60,
    };
  }, [sessions]);

  const handleExportJSON = (reportId: string) => {
    const data = {
      generatedAt: new Date().toISOString(),
      reportType: reportId,
      summary: {
        totalStartups: startupsCount ?? 0, totalGrants: grants?.length ?? 0, totalFunding,
        totalProjects: projects?.length ?? 0, totalCohorts: cohorts?.length ?? 0,
        ...(impactMetrics ?? {}),
      },
    };
    exportToJSON(data, `rapport-${reportId}-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportCSV = (reportId: string) => {
    if (reportId === "financial" && grants) {
      exportToCSV(grants, `rapport-financier`, [
        { key: "name", label: "Nom" }, { key: "code", label: "Code" }, { key: "amount_total", label: "Montant total" },
        { key: "amount_disbursed", label: "Décaissé" }, { key: "status", label: "Statut" },
      ]);
    } else if (reportId === "programs" && cohorts) {
      exportToCSV(cohorts, `rapport-programmes`, [
        { key: "name", label: "Nom" }, { key: "status", label: "Statut" }, { key: "max_startups", label: "Max Entreprises" },
      ]);
    } else {
      handleExportJSON(reportId);
    }
  };

  const handleExportPDF = (reportId: string) => {
    if (reportId === "financial" && grants) {
      exportToPDF("Rapport Financier", grants, [
        { key: "name", label: "Nom" }, { key: "code", label: "Code" }, { key: "amount_total", label: "Montant" },
        { key: "amount_disbursed", label: "Décaissé" }, { key: "status", label: "Statut" },
      ]);
    } else if (reportId === "impact") {
      const impactRows = [
        { metric: "Entreprises accompagnées", value: startupsCount ?? 0 },
        { metric: "Emplois créés", value: impactMetrics?.totalJobs ?? 0 },
        { metric: "CA cumulé (XOF)", value: fmt(impactMetrics?.totalRevenue ?? 0) },
        { metric: "Fonds levés (XOF)", value: fmt(impactMetrics?.totalFundsRaised ?? 0) },
        { metric: "Clients/Utilisateurs", value: impactMetrics?.totalClients ?? 0 },
        { metric: "Heures de coaching", value: Math.round(coachingStats.hours) },
        { metric: "Sessions coaching", value: coachingStats.completed },
        { metric: "Grants actifs", value: activeGrants.length },
        { metric: "Financement total (XOF)", value: fmt(totalFunding) },
        { metric: "Projets", value: projects?.length ?? 0 },
        { metric: "Cohortes", value: cohorts?.length ?? 0 },
        { metric: "Événements", value: events?.length ?? 0 },
      ];
      exportToPDF("Rapport d'Impact Complet — Grow Hub", impactRows, [{ key: "metric", label: "Indicateur" }, { key: "value", label: "Valeur" }]);
    } else if (reportId === "programs" && projects) {
      exportToPDF("Rapport Programmes", projects, [
        { key: "name", label: "Projet" }, { key: "status", label: "Statut" }, { key: "progress", label: "%" },
      ]);
    } else if (reportId === "startups" && startups) {
      exportToPDF("Rapport Entreprises", startups, [
        { key: "name", label: "Nom" }, { key: "sector", label: "Secteur" }, { key: "stage", label: "Stade" },
        { key: "score", label: "Score" }, { key: "country", label: "Pays" },
      ]);
    }
  };

  const handleExportImpactCSV = () => {
    const rows = [
      { indicateur: "Entreprises accompagnées", valeur: startupsCount ?? 0, unité: "nombre" },
      { indicateur: "Emplois créés", valeur: impactMetrics?.totalJobs ?? 0, unité: "nombre" },
      { indicateur: "CA cumulé", valeur: impactMetrics?.totalRevenue ?? 0, unité: "XOF" },
      { indicateur: "Fonds levés", valeur: impactMetrics?.totalFundsRaised ?? 0, unité: "XOF" },
      { indicateur: "Clients/Utilisateurs", valeur: impactMetrics?.totalClients ?? 0, unité: "nombre" },
      { indicateur: "Heures coaching", valeur: Math.round(coachingStats.hours), unité: "heures" },
      { indicateur: "Sessions coaching", valeur: coachingStats.completed, unité: "nombre" },
      { indicateur: "Grants actifs", valeur: activeGrants.length, unité: "nombre" },
      { indicateur: "Financement total", valeur: totalFunding, unité: "XOF" },
      { indicateur: "Projets", valeur: projects?.length ?? 0, unité: "nombre" },
      { indicateur: "Cohortes", valeur: cohorts?.length ?? 0, unité: "nombre" },
      { indicateur: "Événements", valeur: events?.length ?? 0, unité: "nombre" },
    ];
    exportToCSV(rows, `rapport-impact-${new Date().toISOString().slice(0, 10)}`, [
      { key: "indicateur", label: "Indicateur" }, { key: "valeur", label: "Valeur" }, { key: "unité", label: "Unité" },
    ]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <SectionHeader title="Rapports & Impact" subtitle="Vue consolidée des résultats et exports" />

      {/* Impact KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Entreprises" value={String(startupsCount ?? 0)} note="accompagnées" color="green" />
        <StatCard label="Grants actifs" value={String(activeGrants.length)} note={`${fmt(totalFunding)} XOF`} color="blue" />
        <StatCard label="Emplois créés" value={String(impactMetrics?.totalJobs ?? 0)} note="estimés" color="amber" />
        <StatCard label="CA cumulé" value={`${fmt(impactMetrics?.totalRevenue ?? 0)}`} note="XOF" color="purple" />
        <StatCard label="Fonds levés" value={`${fmt(impactMetrics?.totalFundsRaised ?? 0)}`} note="XOF" color="green" />
        <StatCard label="Heures coaching" value={String(Math.round(coachingStats.hours))} note={`${coachingStats.completed} sessions`} color="blue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GhCard title="Répartition par secteur">
          {sectorData.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GhCard>
        <GhCard title="Répartition par stade">
          {stageData.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="value" fill="hsl(165,100%,41%)" radius={[4, 4, 0, 0]} name="Entreprises" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GhCard>
      </div>

      {/* Export impact complet */}
      <GhCard title="📊 Export Rapport d'Impact Complet">
        <p className="text-[12px] text-muted-foreground mb-4">Export consolidé de tous les indicateurs d'impact : entreprises, emplois, financement, coaching, cohortes, événements.</p>
        <div className="flex flex-wrap gap-2">
          <GhButton variant="primary" onClick={handleExportImpactCSV}><Download size={12} className="mr-1" /> CSV Impact</GhButton>
          <GhButton variant="secondary" onClick={() => handleExportPDF("impact")}><Printer size={12} className="mr-1" /> PDF Impact</GhButton>
          <GhButton variant="ghost" onClick={() => handleExportJSON("impact")}><Download size={12} className="mr-1" /> JSON</GhButton>
        </div>
      </GhCard>

      {/* Rapport de livraison */}
      <GhCard title="Rapport de Livraison GrowHub">
        <p className="text-[12px] text-muted-foreground mb-4">Rapport complet de la plateforme avec captures d'écran de tous les modules, architecture technique, sécurité et guide d'utilisation.</p>
        <div className="flex flex-wrap gap-2">
          <a href="/rapport/RAPPORT_LIVRAISON_GROWHUB.html" target="_blank" rel="noopener noreferrer">
            <GhButton variant="primary"><FileText size={13} className="mr-1.5" /> Ouvrir le rapport de livraison</GhButton>
          </a>
        </div>
      </GhCard>

      {/* Export cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(r => (
          <GhCard key={r.id} title={r.title}>
            <div className="flex items-center gap-2 mb-3">
              <r.Icon size={18} className="text-primary" />
              <p className="text-[12px] text-muted-foreground">{r.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <GhButton variant="primary" onClick={() => handleExportJSON(r.id)}><Download size={12} className="mr-1" /> JSON</GhButton>
              <GhButton variant="secondary" onClick={() => handleExportCSV(r.id)}><Download size={12} className="mr-1" /> CSV</GhButton>
              <GhButton variant="ghost" onClick={() => handleExportPDF(r.id)}><Printer size={12} className="mr-1" /> PDF</GhButton>
            </div>
          </GhCard>
        ))}
      </div>
    </motion.div>
  );
}
