import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";

const grants = [
  { code: "ENB-2026-001", name: "Digitalisation PME", org: "ENABEL", amount: "1 200 000 XOF", disbursed: "816 000 XOF", pct: 68, status: "Active", statusColor: "green" as const },
  { code: "AFD-2026-003", name: "Agritech 2026", org: "AFD", amount: "850 000 XOF", disbursed: "348 500 XOF", pct: 41, status: "Active", statusColor: "green" as const },
  { code: "WB-2025-012", name: "E-Santé Afrique", org: "World Bank", amount: "2 000 000 XOF", disbursed: "1 780 000 XOF", pct: 89, status: "Clôture", statusColor: "amber" as const },
];

export default function GrantsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Grants & Subventions"
        subtitle="Suivi des financements et subventions actives"
        actions={<><GhButton variant="ghost">⤓ Exporter</GhButton><GhButton>+ Nouveau grant</GhButton></>}
      />
      <div className="grid grid-cols-3 gap-4">
        {grants.map((g) => (
          <div key={g.code} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="px-4 py-3.5 border-b border-border flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] bg-surface-3 text-gh-blue px-[7px] py-px rounded font-semibold">{g.code}</span>
                <div className="text-[13px] font-bold text-foreground mt-1.5">{g.name}</div>
                <div className="text-[11px] text-text-secondary mt-0.5">{g.org}</div>
              </div>
              <Pill color={g.statusColor}>{g.status}</Pill>
            </div>
            <div className="px-4 py-3.5">
              {[
                { label: "Montant total", val: g.amount },
                { label: "Décaissé", val: g.disbursed },
                { label: "Utilisation", val: `${g.pct}%` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center text-[11.5px] py-1.5 border-b border-border last:border-b-0">
                  <span className="text-text-secondary">{row.label}</span>
                  <span className="font-mono font-semibold text-foreground">{row.val}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 bg-surface-2 border-t border-border">
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gh-blue transition-all" style={{ width: `${g.pct}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
