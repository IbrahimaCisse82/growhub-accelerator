import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import StatCard from "@/components/shared/StatCard";
import GhButton from "@/components/shared/GhButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgets } from "@/hooks/useBudgets";

function formatXOF(n: number) { return new Intl.NumberFormat("fr-FR").format(n) + " XOF"; }

export default function BudgetsPage() {
  const { data: budgets, isLoading } = useBudgets();
  const totalPlanned = budgets?.reduce((a, b) => a + (b.amount_planned ?? 0), 0) ?? 0;
  const totalSpent = budgets?.reduce((a, b) => a + (b.amount_spent ?? 0), 0) ?? 0;
  const utilization = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Budgets" subtitle="Suivi budgétaire et dépenses" actions={<GhButton variant="ghost">⤓ Exporter</GhButton>} />
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Budget planifié" value={formatXOF(totalPlanned)} note="" color="blue" />
        <StatCard label="Dépensé" value={formatXOF(totalSpent)} note="" color="amber" />
        <StatCard label="Utilisation" value={`${utilization}%`} note="" color={utilization > 80 ? "rose" : "green"} />
        <StatCard label="Lignes budgétaires" value={String(budgets?.length ?? 0)} note="" color="purple" />
      </div>
      <GhCard title="Lignes budgétaires" badge={String(budgets?.length ?? 0)} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-secondary">
                {["Libellé", "Catégorie", "Projet", "Grant", "Planifié", "Dépensé", "%"].map(h => (
                  <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-3.5 py-2.5 border-b border-border"><Skeleton className="h-4 w-16" /></td>)}</tr>)
              ) : !budgets || budgets.length === 0 ? (
                <tr><td colSpan={7} className="px-3.5 py-8 text-center text-muted-foreground text-sm">Aucune ligne budgétaire</td></tr>
              ) : budgets.map(b => {
                const pct = (b.amount_planned ?? 0) > 0 ? Math.round(((b.amount_spent ?? 0) / (b.amount_planned ?? 1)) * 100) : 0;
                return (
                  <tr key={b.id} className="hover:bg-secondary transition-colors">
                    <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{b.label}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground">{b.category}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground">{(b as any).projects?.name ?? "—"}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground">{(b as any).grants?.name ?? "—"}</td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{formatXOF(b.amount_planned ?? 0)}</td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{formatXOF(b.amount_spent ?? 0)}</td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-primary">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GhCard>
    </motion.div>
  );
}
