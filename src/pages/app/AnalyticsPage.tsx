import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import StatCard from "@/components/shared/StatCard";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";

const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const startupData = [12, 18, 22, 28, 31, 35, 38, 40, 42, 44, 46, 47];
const coachingData = [45, 62, 78, 95, 110, 120, 125, 130, 135, 138, 0, 0];

export default function AnalyticsPage() {
  const maxStartups = Math.max(...startupData);
  const maxCoaching = Math.max(...coachingData);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Analytics"
        subtitle="Performances et métriques de la plateforme"
        actions={<><GhButton variant="ghost">⤓ Exporter</GhButton><GhButton variant="secondary">📅 Période</GhButton></>}
      />
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Taux de rétention" value="94%" note="Objectif 90%" color="green" />
        <StatCard label="NPS Score" value="72" note="+8 vs Q4" color="blue" />
        <StatCard label="Levées de fonds" value="3.2M" note="XOF · YTD" color="amber" />
        <StatCard label="Emplois créés" value="156" note="Par les startups" color="purple" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <GhCard title="Croissance Startups">
          <div className="flex items-end gap-1.5 h-[120px] pt-2.5">
            {startupData.map((val, i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-1">
                <div
                  className="w-full rounded-t bg-gh-green hover:brightness-120 transition-all min-h-[4px]"
                  style={{ height: `${(val / maxStartups) * 100}%` }}
                />
                <span className="font-mono text-[9px] text-text-tertiary">{months[i]}</span>
              </div>
            ))}
          </div>
        </GhCard>
        <GhCard title="Sessions Coaching / mois">
          <div className="flex items-end gap-1.5 h-[120px] pt-2.5">
            {coachingData.map((val, i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-1">
                <div
                  className="w-full rounded-t bg-gh-blue hover:brightness-120 transition-all min-h-[4px]"
                  style={{ height: `${(val / maxCoaching) * 100}%` }}
                />
                <span className="font-mono text-[9px] text-text-tertiary">{months[i]}</span>
              </div>
            ))}
          </div>
        </GhCard>
      </div>
    </motion.div>
  );
}
