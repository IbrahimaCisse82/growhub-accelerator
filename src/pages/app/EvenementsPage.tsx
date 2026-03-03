import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";

const events = [
  { day: "08", month: "MAR", name: "Demo Day — Cohorte 2026-A", detail: "Présentation finale · 18 startups · Dakar Hub", type: "Demo Day", typeColor: "green" as const },
  { day: "12", month: "MAR", name: "Workshop Pitch Deck", detail: "Session interactive · Clara Bernard · En ligne", type: "Workshop", typeColor: "blue" as const },
  { day: "15", month: "MAR", name: "Networking Investisseurs", detail: "Meet & Greet · 12 VCs · Hôtel Teranga", type: "Networking", typeColor: "purple" as const },
  { day: "20", month: "MAR", name: "Hackathon CleanTech", detail: "48h · GIZ Partnership · Campus Numérique", type: "Hackathon", typeColor: "amber" as const },
  { day: "28", month: "MAR", name: "Comité de Sélection Q2", detail: "Évaluation candidatures · ENABEL + AFD", type: "Comité", typeColor: "rose" as const },
];

export default function EvenementsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Événements"
        subtitle="Calendrier des événements et activités du réseau"
        actions={<><GhButton variant="ghost">📅 Vue calendrier</GhButton><GhButton>+ Créer événement</GhButton></>}
      />
      <div className="flex flex-col gap-2.5">
        {events.map((e) => (
          <div key={e.name} className="bg-surface-2 border border-border rounded-[10px] p-4 flex items-center gap-3.5 cursor-pointer hover:border-border/80 transition-colors">
            <div className="text-center flex-shrink-0 w-[46px] bg-card rounded-lg py-2 px-1.5 border border-border">
              <div className="font-mono text-xl font-bold text-foreground leading-none">{e.day}</div>
              <div className="font-mono text-[9px] text-text-tertiary uppercase mt-0.5">{e.month}</div>
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-foreground">{e.name}</div>
              <div className="text-[11.5px] text-text-secondary mt-0.5">{e.detail}</div>
              <div className="flex gap-1.5 mt-1.5">
                <Pill color={e.typeColor}>{e.type}</Pill>
              </div>
            </div>
            <GhButton variant="ghost">Détails →</GhButton>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
