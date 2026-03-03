import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";

const kanbanCols = [
  {
    title: "À faire",
    count: 5,
    cards: [
      { title: "Intégration API Paiement", priority: "bg-gh-rose", tags: ["FinTech SN", "Backend"] },
      { title: "Rédiger rapport Q1", priority: "bg-gh-amber", tags: ["Admin", "Reporting"] },
    ],
  },
  {
    title: "En cours",
    count: 4,
    cards: [
      { title: "Dashboard Analytics v2", priority: "bg-gh-amber", tags: ["GreenDev", "Frontend"] },
      { title: "Tests utilisateurs App", priority: "bg-gh-blue", tags: ["AgriHub", "UX"] },
    ],
  },
  {
    title: "En revue",
    count: 3,
    cards: [
      { title: "Pitch Deck Template", priority: "bg-gh-green", tags: ["LMS", "Design"] },
    ],
  },
  {
    title: "Terminé",
    count: 8,
    cards: [
      { title: "Onboarding Cohorte B", priority: "bg-gh-green", tags: ["Cohorte", "Process"] },
      { title: "Setup CI/CD Pipeline", priority: "bg-gh-blue", tags: ["DevOps", "Infra"] },
    ],
  },
];

export default function ProjetsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Projets & Tâches"
        subtitle="Kanban et suivi des projets en cours"
        actions={<><GhButton variant="ghost">📋 Liste</GhButton><GhButton>+ Nouveau projet</GhButton></>}
      />
      <div className="grid grid-cols-4 gap-3.5">
        {kanbanCols.map((col) => (
          <div key={col.title} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{col.title}</span>
              <span className="font-mono text-[10px] bg-surface-3 text-text-secondary px-[7px] py-px rounded-full">{col.count}</span>
            </div>
            <div className="p-2.5 flex flex-col gap-2 min-h-[120px]">
              {col.cards.map((card) => (
                <div key={card.title} className="bg-surface-2 border border-border rounded-lg p-3 cursor-pointer hover:border-border/80 hover:-translate-y-px transition-all hover:shadow-lg hover:shadow-black/30">
                  <div className="text-xs font-semibold text-foreground mb-2">{card.title}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1">
                      {card.tags.map((t) => (
                        <span key={t} className="font-mono text-[9px] bg-surface-3 text-text-secondary px-1.5 py-px rounded">{t}</span>
                      ))}
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${card.priority}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
