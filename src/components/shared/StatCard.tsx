import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface StatCardProps {
  label: string;
  value: string;
  note: string;
  icon?: ReactNode;
  color: "green" | "blue" | "amber" | "purple" | "rose";
  sparkData?: number[];
}

const colorMap = {
  green: "bg-gh-green",
  blue: "bg-gh-blue",
  amber: "bg-gh-amber",
  purple: "bg-gh-purple",
  rose: "bg-gh-rose",
};

const sparkColorMap = {
  green: { stroke: "hsl(var(--gh-green))", fill: "hsl(var(--gh-green) / 0.15)" },
  blue: { stroke: "hsl(var(--gh-blue))", fill: "hsl(var(--gh-blue) / 0.15)" },
  amber: { stroke: "hsl(var(--gh-amber))", fill: "hsl(var(--gh-amber) / 0.15)" },
  purple: { stroke: "hsl(var(--gh-purple))", fill: "hsl(var(--gh-purple) / 0.15)" },
  rose: { stroke: "hsl(var(--gh-rose))", fill: "hsl(var(--gh-rose) / 0.15)" },
};

export default function StatCard({ label, value, note, icon, color, sparkData }: StatCardProps) {
  const spark = sparkColorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-[16px] relative overflow-hidden hover:border-border/80 hover:-translate-y-px transition-all cursor-default group"
    >
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${colorMap[color]}`} />
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
      {icon && (
        <span className="absolute top-3.5 right-3.5 opacity-20 text-muted-foreground">{icon}</span>
      )}
      <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-[24px] md:text-[26px] font-semibold text-foreground mt-2 mb-1 leading-none">
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{note}</div>

      {sparkData && sparkData.length > 1 && (
        <div className="absolute bottom-2 right-2 w-[60px] h-[24px] opacity-60 group-hover:opacity-90 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData.map((v, i) => ({ v, i }))}>
              <Area type="monotone" dataKey="v" stroke={spark.stroke} fill={spark.fill} strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
