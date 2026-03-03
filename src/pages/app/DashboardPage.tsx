import { motion } from "framer-motion";
import StatCard from "@/components/shared/StatCard";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";

const projects = [
  { hierarchy: "PF-001 › PRG-001", name: "API v2 Backend", startup: "FinTech SN", status: "En cours", statusColor: "green" as const, progress: 68, date: "20 Mar" },
  { hierarchy: "PF-001 › PRG-002", name: "App Mobile AgriHub", startup: "AgriHub", status: "Revue", statusColor: "blue" as const, progress: 82, date: "28 Mar" },
  { hierarchy: "PF-001 › PRG-002", name: "Dashboard Analytics", startup: "GreenDev", status: "Bloqué", statusColor: "amber" as const, progress: 45, date: "05 Avr" },
  { hierarchy: "PF-002 › PRG-004", name: "MedConnect v2", startup: "MedConnect", status: "Finalisation", statusColor: "green" as const, progress: 94, date: "31 Mar" },
  { hierarchy: "PF-001 › PRG-002", name: "Campagne Marketing", startup: "GreenDev", status: "En cours", statusColor: "green" as const, progress: 55, date: "10 Avr" },
];

const progressColors: Record<string, string> = {
  green: "bg-gh-green",
  blue: "bg-gh-blue",
  amber: "bg-gh-amber",
  purple: "bg-gh-purple",
  rose: "bg-gh-rose",
};

const activities = [
  { icon: "✓", bg: "bg-gh-green/15", title: "Candidature acceptée", desc: "FinTech SN — Cohorte 2026-A", time: "Il y a 30 min" },
  { icon: "◎", bg: "bg-gh-blue/15", title: "Grant validé", desc: "ENABEL Phase 2 · 450 000 XOF", time: "Il y a 2h" },
  { icon: "◑", bg: "bg-gh-amber/15", title: "Session coaching", desc: "Mentor Fatou D. × AgriHub", time: "Il y a 4h" },
  { icon: "⚠", bg: "bg-gh-rose/15", title: "Risque signalé", desc: "Retard Pipeline — 2 jours", time: "Il y a 5h" },
  { icon: "▣", bg: "bg-gh-purple/15", title: "Module LMS complété", desc: "12 entrepreneurs · Pitch & Finance", time: "Hier" },
];

const pipeline = [
  { num: 24, label: "Reçues" },
  { num: 16, label: "Examen" },
  { num: 9, label: "Entretien" },
  { num: 5, label: "Due Diligence" },
  { num: 3, label: "Acceptées" },
];

const grants = [
  { name: "ENABEL — Digitalisation PME", pct: 68, color: "bg-gh-blue" },
  { name: "AFD — Agritech 2026", pct: 41, color: "bg-gh-amber" },
  { name: "World Bank — E-Santé", pct: 89, color: "bg-gh-green" },
  { name: "GIZ — CleanTech", pct: 22, color: "bg-gh-purple" },
];

export default function DashboardPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <SectionHeader
        title="Vue d'ensemble"
        subtitle="Plateforme GrowHubLink — Tableau de bord unifié"
        actions={
          <>
            <GhButton variant="secondary">⤓ Exporter</GhButton>
            <GhButton variant="primary">+ Créer</GhButton>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Startups Actives" value="47" note="+12 ce trimestre" icon="△" color="green" />
        <StatCard label="Financements (XOF)" value="2.4M" note="Subventions actives" icon="◎" color="blue" />
        <StatCard label="Sessions Coaching" value="138" note="Ce mois" icon="◑" color="amber" />
        <StatCard label="Cohortes en cours" value="3" note="2 démarrent en Q2" icon="◉" color="purple" />
      </div>

      {/* Projects + Activity */}
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <GhCard title="Projets Actifs" badge="12" action={<GhButton variant="ghost">Voir tout →</GhButton>} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-surface-2">
                  <th className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border text-left whitespace-nowrap">Hiérarchie PPM</th>
                  <th className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border text-left">Projet</th>
                  <th className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border text-left">Startup</th>
                  <th className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border text-left">Statut</th>
                  <th className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border text-left">Avancement</th>
                  <th className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border text-left">Échéance</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => (
                  <tr key={i} className="hover:bg-surface-2 transition-colors">
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-[10px] text-text-tertiary">{p.hierarchy}</td>
                    <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{p.name}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-foreground">{p.startup}</td>
                    <td className="px-3.5 py-2.5 border-b border-border"><Pill color={p.statusColor}>{p.status}</Pill></td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${progressColors[p.statusColor]} transition-all duration-600`} style={{ width: `${p.progress}%` }} />
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GhCard>

        <GhCard title="Activité récente">
          <div className="flex flex-col">
            {activities.map((a, i) => (
              <div key={i} className={`flex gap-3 py-3 ${i < activities.length - 1 ? "border-b border-border" : ""}`}>
                <div className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center text-[13px] flex-shrink-0 mt-px`}>
                  {a.icon}
                </div>
                <div>
                  <div className="text-[12.5px] font-semibold text-foreground">{a.title}</div>
                  <div className="text-[11.5px] text-text-secondary mt-0.5">{a.desc}</div>
                  <div className="font-mono text-[10px] text-text-tertiary mt-1">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </GhCard>
      </div>

      {/* Pipeline + Grants */}
      <div className="grid grid-cols-2 gap-4">
        <GhCard title="Pipeline Candidatures" action={<GhButton variant="ghost">Voir tout →</GhButton>}>
          <div className="flex border border-border rounded-xl overflow-hidden mb-3">
            {pipeline.map((step, i) => (
              <div
                key={i}
                className={`flex-1 min-w-[80px] py-3.5 text-center border-r border-border last:border-r-0 relative transition-colors
                  ${i === 0 ? "bg-primary/8" : "bg-card"} hover:bg-surface-2 cursor-pointer`}
              >
                {i === 0 && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                <div className="font-mono text-xl font-semibold text-foreground">{step.num}</div>
                <div className="text-[11px] text-text-secondary mt-1">{step.label}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-text-secondary">
            Taux de sélection : <b className="text-primary">12.5%</b> · Score moyen : <b className="text-gh-blue">72/100</b>
          </div>
        </GhCard>

        <GhCard title="Financements Actifs" action={<GhButton variant="ghost">Voir tout →</GhButton>}>
          <div className="flex flex-col gap-2.5">
            {grants.map((g, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] text-text-tertiary mb-1">
                  <span>{g.name}</span>
                  <span className="font-mono">{g.pct}%</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${g.color} transition-all duration-600`} style={{ width: `${g.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GhCard>
      </div>
    </motion.div>
  );
}
