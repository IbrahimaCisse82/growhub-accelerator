import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import StatCard from "@/components/shared/StatCard";
import { useStartupsCount } from "@/hooks/useStartups";
import { useGrants } from "@/hooks/useGrants";
import { useProjects } from "@/hooks/useProjects";
import { useCohorts } from "@/hooks/useCohorts";
import { exportToJSON, exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { Triangle, Target, FolderKanban, TrendingUp, FileText, Download, Printer, type LucideIcon } from "lucide-react";

const reports: { id: string; title: string; description: string; Icon: LucideIcon }[] = [
  { id: "startups", title: "Rapport Entreprises", description: "Vue d'ensemble des entreprises accompagnées, secteurs, stades et scores", Icon: Triangle },
  { id: "financial", title: "Rapport Financier", description: "Synthèse des grants, budgets, décaissements et taux d'utilisation", Icon: Target },
  { id: "programs", title: "Rapport Programmes", description: "Performance des programmes, cohortes et taux de complétion", Icon: FolderKanban },
  { id: "impact", title: "Rapport d'Impact", description: "Métriques d'impact : emplois créés, levées de fonds, croissance", Icon: TrendingUp },
];

export default function RapportsPage() {
  const { data: startupsCount } = useStartupsCount();
  const { data: grants } = useGrants();
  const { data: projects } = useProjects();
  const { data: cohorts } = useCohorts();

  const activeGrants = grants?.filter(g => g.status === "active" || g.status === "disbursing") ?? [];
  const totalFunding = activeGrants.reduce((a, g) => a + g.amount_total, 0);

  const handleExportJSON = (reportId: string) => {
    const data = {
      generatedAt: new Date().toISOString(),
      reportType: reportId,
      summary: { totalStartups: startupsCount ?? 0, totalGrants: grants?.length ?? 0, totalFunding, totalProjects: projects?.length ?? 0, totalCohorts: cohorts?.length ?? 0 },
    };
    exportToJSON(data, `rapport-${reportId}-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportCSV = (reportId: string) => {
    if (reportId === "financial" && grants) {
      exportToCSV(grants, `rapport-financier-${new Date().toISOString().slice(0, 10)}`, [
        { key: "name", label: "Nom" }, { key: "code", label: "Code" }, { key: "amount_total", label: "Montant total" },
        { key: "amount_disbursed", label: "Décaissé" }, { key: "status", label: "Statut" },
      ]);
    } else if (reportId === "programs" && cohorts) {
      exportToCSV(cohorts, `rapport-programmes-${new Date().toISOString().slice(0, 10)}`, [
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
    } else if (reportId === "programs" && projects) {
      exportToPDF("Rapport Programmes", projects, [
        { key: "name", label: "Projet" }, { key: "status", label: "Statut" }, { key: "progress", label: "Avancement %" },
      ]);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Rapports" subtitle="Génération et export de rapports" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Entreprises" value={String(startupsCount ?? 0)} note="" color="green" />
        <StatCard label="Grants actifs" value={String(activeGrants.length)} note="" color="blue" />
        <StatCard label="Projets" value={String(projects?.length ?? 0)} note="" color="amber" />
        <StatCard label="Cohortes" value={String(cohorts?.length ?? 0)} note="" color="purple" />
      </div>
      <GhCard title="📋 Rapport de Livraison GrowHub" className="mb-4">
        <p className="text-[12px] text-muted-foreground mb-4">Rapport complet de la plateforme avec captures d'écran de tous les modules, architecture technique, sécurité et guide d'utilisation.</p>
        <div className="flex flex-wrap gap-2">
          <a href="/rapport/RAPPORT_LIVRAISON_GROWHUB.html" target="_blank" rel="noopener noreferrer">
            <GhButton variant="primary">📄 Ouvrir le rapport de livraison</GhButton>
          </a>
        </div>
      </GhCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(r => (
          <GhCard key={r.id} title={r.title}>
            <p className="text-[12px] text-muted-foreground mb-4">{r.description}</p>
            <div className="flex flex-wrap gap-2">
              <GhButton variant="primary" onClick={() => handleExportJSON(r.id)}>⤓ JSON</GhButton>
              <GhButton variant="secondary" onClick={() => handleExportCSV(r.id)}>⤓ CSV</GhButton>
              <GhButton variant="ghost" onClick={() => handleExportPDF(r.id)}>⎙ PDF</GhButton>
            </div>
          </GhCard>
        ))}
      </div>
    </motion.div>
  );
}
