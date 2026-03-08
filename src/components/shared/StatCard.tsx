import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  note: string;
  icon?: string;
  color: "green" | "blue" | "amber" | "purple" | "rose";
}

const colorMap = {
  green: "bg-gh-green",
  blue: "bg-gh-blue",
  amber: "bg-gh-amber",
  purple: "bg-gh-purple",
  rose: "bg-gh-rose",
};

export default function StatCard({ label, value, note, icon, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-[18px] relative overflow-hidden hover:border-border/80 hover:-translate-y-px transition-all cursor-default group"
    >
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${colorMap[color]}`} />
      {icon && (
        <span className="absolute top-3.5 right-3.5 text-[22px] opacity-15">{icon}</span>
      )}
      <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-[26px] font-semibold text-foreground mt-2 mb-1 leading-none">
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{note}</div>
    </motion.div>
  );
}
