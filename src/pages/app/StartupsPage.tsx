import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";

const startups = [
  { name: "FinTech SN", founder: "Amadou Diallo", sector: "Fintech", sectorColor: "blue" as const, cohort: "2026-A", stage: "Accélération", stageColor: "green" as const, score: 87, mentor: "Fatou D.", kpi: "+32%" },
  { name: "AgriHub", founder: "Mariam Coulibaly", sector: "Agritech", sectorColor: "green" as const, cohort: "2026-B", stage: "Croissance", stageColor: "blue" as const, score: 79, mentor: "Jean-Marc L.", kpi: "+18%" },
  { name: "EduTech CI", founder: "Sophie Koffi", sector: "EdTech", sectorColor: "purple" as const, cohort: "2026-A", stage: "MVP", stageColor: "amber" as const, score: 65, mentor: "Paul T.", kpi: "+8%" },
  { name: "PayStart", founder: "Ibrahima Sy", sector: "Fintech", sectorColor: "blue" as const, cohort: "2025-C", stage: "Scale", stageColor: "green" as const, score: 92, mentor: "Clara B.", kpi: "+55%" },
  { name: "GreenDev", founder: "Aissatou Ba", sector: "CleanTech", sectorColor: "green" as const, cohort: "2026-B", stage: "Incubation", stageColor: "amber" as const, score: 71, mentor: "Nathan K.", kpi: "+22%" },
  { name: "MedConnect", founder: "Dr. Cheikh Fall", sector: "HealthTech", sectorColor: "rose" as const, cohort: "2025-C", stage: "Accélération", stageColor: "green" as const, score: 84, mentor: "Fatou D.", kpi: "+41%" },
];

export default function StartupsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Startups"
        subtitle="Répertoire et suivi des entreprises accompagnées"
        actions={
          <>
            <input className="bg-surface-2 border border-border rounded-lg px-3 py-[7px] text-[12.5px] text-foreground outline-none focus:border-gh-blue w-[200px] placeholder:text-text-tertiary" placeholder="Rechercher une startup…" />
            <GhButton variant="ghost">Filtrer ▾</GhButton>
            <GhButton>+ Ajouter</GhButton>
          </>
        }
      />
      <GhCard title="Toutes les startups" badge={String(startups.length)} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-surface-2">
                {["Startup", "Secteur", "Cohorte", "Stade", "Score", "Mentor", "KPI ↑", "Actions"].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {startups.map((s) => (
                <tr key={s.name} className="hover:bg-surface-2 transition-colors">
                  <td className="px-3.5 py-2.5 border-b border-border">
                    <div className="font-semibold text-foreground">{s.name}</div>
                    <div className="text-[11px] text-text-secondary">{s.founder}</div>
                  </td>
                  <td className="px-3.5 py-2.5 border-b border-border"><Pill color={s.sectorColor}>{s.sector}</Pill></td>
                  <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{s.cohort}</td>
                  <td className="px-3.5 py-2.5 border-b border-border"><Pill color={s.stageColor}>{s.stage}</Pill></td>
                  <td className="px-3.5 py-2.5 border-b border-border font-mono text-primary">{s.score}/100</td>
                  <td className="px-3.5 py-2.5 border-b border-border text-foreground">{s.mentor}</td>
                  <td className="px-3.5 py-2.5 border-b border-border font-mono text-primary">{s.kpi}</td>
                  <td className="px-3.5 py-2.5 border-b border-border"><GhButton variant="ghost">→</GhButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GhCard>
    </motion.div>
  );
}
