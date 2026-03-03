import { motion } from "framer-motion";
import StatCard from "@/components/shared/StatCard";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";

const courses = [
  { emoji: "💰", title: "Finance & Modèle Économique", meta: "12 modules · 6h · Niveau intermédiaire", enrolled: 89, completion: "78%", gradient: "from-gh-green/20 to-gh-blue/20" },
  { emoji: "🚀", title: "Pitch & Communication", meta: "8 modules · 4h · Tous niveaux", enrolled: 124, completion: "85%", gradient: "from-gh-amber/20 to-gh-rose/20" },
  { emoji: "📊", title: "Data-Driven Decisions", meta: "10 modules · 5h · Avancé", enrolled: 56, completion: "62%", gradient: "from-gh-blue/20 to-gh-purple/20" },
  { emoji: "🌍", title: "Impact Social & ESG", meta: "6 modules · 3h · Débutant", enrolled: 43, completion: "91%", gradient: "from-gh-green/20 to-gh-amber/20" },
  { emoji: "⚙️", title: "Product Management", meta: "14 modules · 7h · Intermédiaire", enrolled: 67, completion: "55%", gradient: "from-gh-purple/20 to-gh-rose/20" },
  { emoji: "📱", title: "Marketing Digital", meta: "9 modules · 4.5h · Tous niveaux", enrolled: 98, completion: "72%", gradient: "from-gh-rose/20 to-gh-amber/20" },
];

export default function LmsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="LMS & Formation"
        subtitle="Bibliothèque de cours et parcours d'apprentissage"
        actions={<><GhButton variant="ghost">📊 Stats apprenants</GhButton><GhButton>+ Créer cours</GhButton></>}
      />
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Cours actifs" value="28" note="" color="blue" />
        <StatCard label="Apprenants inscrits" value="312" note="" color="green" />
        <StatCard label="Taux complétion" value="73%" note="" color="amber" />
        <StatCard label="Certificats émis" value="184" note="" color="purple" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {courses.map((c) => (
          <div key={c.title} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className={`h-[100px] flex items-center justify-center text-[32px] bg-gradient-to-br ${c.gradient}`}>
              {c.emoji}
            </div>
            <div className="p-3.5">
              <div className="text-[13px] font-bold text-foreground">{c.title}</div>
              <div className="text-[11px] text-text-secondary mt-1">{c.meta}</div>
            </div>
            <div className="px-3.5 py-2.5 bg-surface-2 border-t border-border flex justify-between items-center">
              <Pill color="green">● {c.enrolled} inscrits</Pill>
              <span className="font-mono text-[11px] text-gh-amber">{c.completion} complétion</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
