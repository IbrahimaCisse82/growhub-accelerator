import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";

const mentors = [
  { initials: "FD", name: "Fatou Diallo", expertise: "Fintech · Stratégie", tags: ["Fintech", "Levée fonds", "Go-to-market"], sessions: 42, rating: "4.9★", startups: 5, status: "Disponible", statusColor: "green" as const, gradient: "from-gh-green to-gh-blue" },
  { initials: "JL", name: "Jean-Marc Laurent", expertise: "Agritech · Tech", tags: ["Agriculture", "IoT", "Scalabilité"], sessions: 31, rating: "4.7★", startups: 3, status: "Partiel", statusColor: "amber" as const, gradient: "from-gh-amber to-gh-rose" },
  { initials: "CB", name: "Clara Bernard", expertise: "Marketing · Growth", tags: ["Growth", "Branding", "Digital"], sessions: 58, rating: "5.0★", startups: 7, status: "Disponible", statusColor: "green" as const, gradient: "from-gh-purple to-gh-blue" },
  { initials: "NK", name: "Nathan Kante", expertise: "CleanTech · Impact", tags: ["ESG", "Impact", "CleanTech"], sessions: 24, rating: "4.6★", startups: 4, status: "Indisponible", statusColor: "rose" as const, gradient: "from-gh-rose to-gh-amber" },
  { initials: "PT", name: "Paul Tran", expertise: "EdTech · Pédagogie", tags: ["LMS", "EdTech", "Curriculum"], sessions: 37, rating: "4.8★", startups: 6, status: "Disponible", statusColor: "green" as const, gradient: "from-gh-green to-gh-purple" },
];

export default function MentorsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Mentors"
        subtitle="Réseau d'experts et matching avec les startups"
        actions={<><GhButton variant="ghost">⚙ Matching auto</GhButton><GhButton>+ Inviter mentor</GhButton></>}
      />
      <div className="grid grid-cols-3 gap-4">
        {mentors.map((m) => (
          <div key={m.name} className="bg-card border border-border rounded-xl p-[18px] hover:border-gh-blue/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-3.5">
              <div className={`w-[42px] h-[42px] rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0`}>
                {m.initials}
              </div>
              <div>
                <div className="text-[13px] font-bold text-foreground">{m.name}</div>
                <div className="text-[11px] text-text-secondary mt-px">{m.expertise}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {m.tags.map((t) => (
                <span key={t} className="font-mono text-[10px] bg-surface-3 text-text-secondary px-2 py-px rounded">{t}</span>
              ))}
            </div>
            <div className="flex gap-3.5 text-[11px] text-text-secondary">
              <span>Sessions: <span className="font-mono font-semibold text-foreground">{m.sessions}</span></span>
              <span>Note: <span className="font-mono font-semibold text-gh-amber">{m.rating}</span></span>
              <span>Startups: <span className="font-mono font-semibold text-foreground">{m.startups}</span></span>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <Pill color={m.statusColor}>● {m.status}</Pill>
              <GhButton variant="accent" disabled={m.statusColor === "rose"}>Matcher →</GhButton>
            </div>
          </div>
        ))}
        {/* Add mentor card */}
        <div className="bg-card border border-border border-dashed rounded-xl flex items-center justify-center min-h-[180px] cursor-pointer hover:border-border/80 transition-colors">
          <div className="text-center text-text-tertiary">
            <div className="text-[28px] mb-2">+</div>
            <div className="text-xs">Inviter un mentor</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
