import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
}

export default function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="bg-card border border-border border-dashed rounded-xl flex items-center justify-center min-h-[300px]">
        <div className="text-center text-text-tertiary">
          <div className="text-4xl mb-3">🚧</div>
          <div className="font-display text-lg font-bold text-text-secondary">Module en développement</div>
          <div className="text-xs mt-1">Ce module sera bientôt disponible</div>
        </div>
      </div>
    </motion.div>
  );
}
