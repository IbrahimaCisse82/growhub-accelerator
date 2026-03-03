import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";

const pipeline = [
  { num: 24, label: "Reçues" },
  { num: 16, label: "Examen" },
  { num: 9, label: "Entretien" },
  { num: 5, label: "Due Diligence" },
  { num: 3, label: "Acceptées" },
  { num: 2, label: "Refusées" },
];

const candidatures = [
  { startup: "SunEnergy", founder: "Moussa Traoré", sector: "CleanTech", sectorColor: "green" as const, program: "GIZ 2026", score: 81, step: "Entretien", stepColor: "blue" as const, evaluator: "Éval. A" },
  { startup: "DataFarm", founder: "Khadija Ndiaye", sector: "AgriData", sectorColor: "blue" as const, program: "AFD 2026", score: 68, step: "Examen", stepColor: "amber" as const, evaluator: "Éval. B" },
  { startup: "EcoLog", founder: "Serigne Mbaye", sector: "Logistique", sectorColor: "green" as const, program: "ENABEL", score: 76, step: "Entretien", stepColor: "blue" as const, evaluator: "Éval. C" },
  { startup: "CashFlow AI", founder: "Astou Diouf", sector: "Fintech", sectorColor: "blue" as const, program: "AFD 2026", score: 88, step: "Due Dil.", stepColor: "purple" as const, evaluator: "Éval. A" },
];

export default function CandidaturesPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Candidatures"
        subtitle="Évaluation et sélection des startups candidates"
        actions={<><GhButton variant="ghost">Filtrer ▾</GhButton><GhButton>+ Ouvrir appel</GhButton></>}
      />
      <div className="flex border border-border rounded-xl overflow-hidden mb-5">
        {pipeline.map((step, i) => (
          <div key={i} className={`flex-1 min-w-[80px] py-3.5 text-center border-r border-border last:border-r-0 relative hover:bg-surface-2 cursor-pointer transition-colors ${i === 0 ? "bg-primary/8" : ""}`}>
            {i === 0 && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            <div className="font-mono text-xl font-semibold text-foreground">{step.num}</div>
            <div className="text-[11px] text-text-secondary mt-1">{step.label}</div>
          </div>
        ))}
      </div>
      <GhCard title="Candidatures en attente" badge="8" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-surface-2">
                {["Startup", "Fondateur", "Secteur", "Programme", "Score", "Étape", "Assigné", "Actions"].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidatures.map((c) => (
                <tr key={c.startup} className="hover:bg-surface-2 transition-colors">
                  <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{c.startup}</td>
                  <td className="px-3.5 py-2.5 border-b border-border text-foreground">{c.founder}</td>
                  <td className="px-3.5 py-2.5 border-b border-border"><Pill color={c.sectorColor}>{c.sector}</Pill></td>
                  <td className="px-3.5 py-2.5 border-b border-border text-foreground">{c.program}</td>
                  <td className="px-3.5 py-2.5 border-b border-border font-mono text-primary">{c.score}/100</td>
                  <td className="px-3.5 py-2.5 border-b border-border"><Pill color={c.stepColor}>{c.step}</Pill></td>
                  <td className="px-3.5 py-2.5 border-b border-border text-foreground">{c.evaluator}</td>
                  <td className="px-3.5 py-2.5 border-b border-border"><GhButton variant="primary">Évaluer</GhButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GhCard>
    </motion.div>
  );
}
