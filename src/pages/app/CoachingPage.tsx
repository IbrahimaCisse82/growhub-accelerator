import { motion } from "framer-motion";
import StatCard from "@/components/shared/StatCard";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";

const sessions = [
  { date: "04 Mar 14:00", startup: "FinTech SN", mentor: "Fatou Diallo", theme: "Pitch Investisseurs", duration: "90min", status: "Confirmé", statusColor: "green" as const },
  { date: "05 Mar 10:00", startup: "AgriHub", mentor: "Jean-Marc L.", theme: "Stratégie Go-to-Market", duration: "60min", status: "Confirmé", statusColor: "green" as const },
  { date: "06 Mar 15:30", startup: "GreenDev", mentor: "Nathan Kante", theme: "Impact ESG & Reporting", duration: "120min", status: "En attente", statusColor: "amber" as const },
  { date: "07 Mar 11:00", startup: "EduTech CI", mentor: "Paul Tran", theme: "Modèle Pédagogique", duration: "90min", status: "Confirmé", statusColor: "green" as const },
  { date: "10 Mar 14:00", startup: "PayStart", mentor: "Clara Bernard", theme: "Growth Hacking", duration: "60min", status: "Planifié", statusColor: "blue" as const },
];

export default function CoachingPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Coaching & Sessions"
        subtitle="Planification et suivi des sessions d'accompagnement"
        actions={<><GhButton variant="ghost">📅 Calendrier</GhButton><GhButton>+ Planifier session</GhButton></>}
      />
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Sessions ce mois" value="138" note="+24 vs mois dernier" color="green" />
        <StatCard label="Heures contribuées" value="276h" note="Tous mentors" color="blue" />
        <StatCard label="Satisfaction moyenne" value="4.8★" note="Objectif 4.5" color="amber" />
        <StatCard label="Tâches complétées" value="89%" note="Objectifs session" color="purple" />
      </div>
      <GhCard title="Sessions à venir" action={<GhButton variant="ghost">Voir tout →</GhButton>} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-surface-2">
                {["Date", "Startup", "Mentor", "Thème", "Durée", "Statut", "Actions"].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={i} className="hover:bg-surface-2 transition-colors">
                  <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{s.date}</td>
                  <td className="px-3.5 py-2.5 border-b border-border text-foreground">{s.startup}</td>
                  <td className="px-3.5 py-2.5 border-b border-border text-foreground">{s.mentor}</td>
                  <td className="px-3.5 py-2.5 border-b border-border text-foreground">{s.theme}</td>
                  <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{s.duration}</td>
                  <td className="px-3.5 py-2.5 border-b border-border"><Pill color={s.statusColor}>{s.status}</Pill></td>
                  <td className="px-3.5 py-2.5 border-b border-border">
                    <GhButton variant={s.statusColor === "amber" ? "accent" : "ghost"}>
                      {s.statusColor === "amber" ? "Confirmer" : "Rejoindre"}
                    </GhButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GhCard>
    </motion.div>
  );
}
