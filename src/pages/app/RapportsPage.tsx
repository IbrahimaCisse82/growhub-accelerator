import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import StatCard from "@/components/shared/StatCard";
import { useStartupsCount } from "@/hooks/useStartups";
import { useGrants } from "@/hooks/useGrants";
import { useProjects } from "@/hooks/useProjects";
import { useCohorts } from "@/hooks/useCohorts";

const reports = [
  { id: "startups", title: "Rapport Startups", description: "Vue d'ensemble des startups accompagnées, secteurs, stades et scores", icon: "△" },
  { id: "financial", title: "Rapport Financier", description: "Synthèse des grants, budgets, décaissements et taux d'utilisation", icon: "◎" },
  { id: "programs", title: "Rapport Programmes", description: "Performance des programmes, cohortes et taux de complétion", icon: "◇" },
  { id: "impact", title: "Rapport d'Impact", description: "Métriques d'impact : emplois créés, levées de fonds, croissance", icon: "◈" },
];

export default function RapportsPage() {
  const { data: startupsCount } = useStartupsCount();
  const { data: grants } = useGrants();
  const { data: projects } = useProjects();
  const { data: cohorts } = useCohorts();

  const activeGrants = grants?.filter(g => g.status === "active" || g.status === "disbursing") ?? [];
  const totalFunding = activeGrants.reduce((a, g) => a + g.amount_total, 0);

  const handleExport = (reportId: string) => {
    const data = {
      generatedAt: new Date().toISOString(),
      reportType: reportId,
      summary: {
        totalStartups: startupsCount ?? 0,
        totalGrants: grants?.length ?? 0,
        totalFunding,
        totalProjects: projects?.length ?? 0,
        totalCohorts: cohorts?.length ?? 0,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${reportId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Rapports" subtitle="Génération et export de rapports" />
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Startups" value={String(startupsCount ?? 0)} note="" color="green" />
        <StatCard label="Grants actifs" value={String(activeGrants.length)} note="" color="blue" />
        <StatCard label="Projets" value={String(projects?.length ?? 0)} note="" color="amber" />
        <StatCard label="Cohortes" value={String(cohorts?.length ?? 0)} note="" color="purple" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {reports.map(r => (
          <GhCard key={r.id} title={r.title}>
            <p className="text-[12px] text-muted-foreground mb-4">{r.description}</p>
            <div className="flex gap-2">
              <GhButton variant="primary" onClick={() => handleExport(r.id)}>⤓ Exporter JSON</GhButton>
              <GhButton variant="ghost">Aperçu</GhButton>
            </div>
          </GhCard>
        ))}
      </div>
    </motion.div>
  );
}
