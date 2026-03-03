import { motion } from "framer-motion";
import StatCard from "@/components/shared/StatCard";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";

const cohorts = [
  { name: "Cohorte 2026-A", program: "Programme Digitalisation PME · ENABEL", startups: 18, mentors: 8, progress: "82%", status: "Active", statusColor: "green" as const, stripe: "bg-gh-green" },
  { name: "Cohorte 2026-B", program: "Agritech 2026 · AFD", startups: 15, mentors: 6, progress: "34%", status: "Démarrage", statusColor: "blue" as const, stripe: "bg-gh-blue" },
  { name: "Cohorte 2025-C", program: "E-Santé · World Bank", startups: 14, mentors: 10, progress: "96%", status: "Finalisation", statusColor: "amber" as const, stripe: "bg-gh-amber" },
];

export default function CohortesPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Cohortes"
        subtitle="Gestion des cohortes de startups accompagnées"
        actions={<><GhButton variant="ghost">⤓ Exporter</GhButton><GhButton>+ Nouvelle cohorte</GhButton></>}
      />
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Cohortes Actives" value="3" note="+2 démarrent Q2 2026" color="green" />
        <StatCard label="Startups totales" value="47" note="Toutes cohortes" color="blue" />
        <StatCard label="Taux complétion" value="78%" note="Objectif 80%" color="amber" />
        <StatCard label="Mentors assignés" value="24" note="Actifs" color="purple" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {cohorts.map((c) => (
          <div key={c.name} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className={`h-[3px] ${c.stripe}`} />
            <div className="p-4">
              <div className="font-display text-[15px] font-bold text-foreground">{c.name}</div>
              <div className="text-[11px] text-text-secondary mt-0.5">{c.program}</div>
              <div className="grid grid-cols-3 gap-2 mt-3.5">
                {[
                  { val: c.startups, label: "Startups" },
                  { val: c.mentors, label: "Mentors" },
                  { val: c.progress, label: "Avancement" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="font-mono text-lg font-semibold text-foreground">{s.val}</div>
                    <div className="text-[10px] text-text-tertiary mt-px">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-2.5 bg-surface-2 border-t border-border flex justify-between items-center">
              <Pill color={c.statusColor}>● {c.status}</Pill>
              <GhButton variant="ghost">Détails →</GhButton>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
