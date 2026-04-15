import { useBudgetExecution, aggregateByNomenclature } from "@/hooks/useBudgetExecution";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/shared/StatCard";
import { Progress } from "@/components/ui/progress";

interface Props {
  projectId: string | null;
  currency?: string;
  rate?: number;
  fmt?: (n: number) => string;
}

export default function BudgetExecutionTab({ projectId, currency = "USD", rate = 1, fmt: fmtProp }: Props) {
  const { data: rows, isLoading } = useBudgetExecution(projectId);
  const fmt = fmtProp || ((n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n));
  const c = (n: number) => n * rate;

  if (!projectId) return <p className="text-center text-muted-foreground py-8 text-sm">Sélectionnez un projet</p>;
  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;
  if (!rows?.length) return <p className="text-center text-muted-foreground py-8 text-sm">Aucune donnée d'exécution. Liez un grant au projet pour voir le suivi.</p>;

  const byNom = aggregateByNomenclature(rows);
  const totalPlanned = byNom.reduce((s, r) => s + r.planned, 0);
  const totalSpent = byNom.reduce((s, r) => s + r.spent, 0);
  const globalRate = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 1000) / 10 : 0;

  const rateColor = (r: number) => r > 100 ? "text-destructive" : r >= 80 ? "text-amber-600" : "text-primary";
  const barColor = (r: number) => r > 100 ? "bg-destructive" : r >= 80 ? "bg-amber-500" : "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard label="Budget planifié" value={`${fmt(c(totalPlanned))} ${currency}`} note="Total 5 ans" color="blue" />
        <StatCard label="Dépenses réelles" value={`${fmt(c(totalSpent))} ${currency}`} note="Via transactions Grant" color="amber" />
        <StatCard label="Solde disponible" value={`${fmt(c(totalPlanned - totalSpent))} ${currency}`} note="" color="green" />
        <StatCard label="Taux d'exécution" value={`${globalRate}%`} note={globalRate > 100 ? "⚠ Dépassement" : "En cours"} color={globalRate > 100 ? "gray" : "purple"} />
      </div>

      {/* Global progress */}
      <div className="bg-card border border-border rounded-xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Exécution globale</span>
          <span className={`font-mono text-sm font-bold ${rateColor(globalRate)}`}>{globalRate}%</span>
        </div>
        <Progress value={Math.min(globalRate, 100)} className={`h-3 ${barColor(globalRate)}`} />
      </div>

      {/* Detail table by nomenclature */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-primary/5">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Exécution budgétaire par catégorie Enabel ({currency})</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Planifié (Module Budget) vs Réalisé (Transactions Grants) — Nomenclature A32</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-secondary">
                {["Code", "Catégorie Enabel", "Planifié", "Réalisé", "Solde", "Taux", "Progression"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byNom.map(row => (
                <tr key={row.code} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-2"><span className="font-mono text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{row.code}</span></td>
                  <td className="px-3 py-2 text-foreground font-medium">{row.label}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(c(row.planned))}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(c(row.spent))}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(c(row.remaining))}</td>
                  <td className={`px-3 py-2 text-right font-mono font-bold ${rateColor(row.rate)}`}>{row.rate}%</td>
                  <td className="px-3 py-2 w-32">
                    <Progress value={Math.min(row.rate, 100)} className={`h-2 ${barColor(row.rate)}`} />
                  </td>
                </tr>
              ))}
              <tr className="bg-foreground/5">
                <td colSpan={2} className="px-3 py-2.5 text-right text-xs font-bold text-foreground uppercase">TOTAL</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">{fmt(c(totalPlanned))}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">{fmt(c(totalSpent))}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-primary">{fmt(c(totalPlanned - totalSpent))}</td>
                <td className={`px-3 py-2.5 text-right font-mono font-bold ${rateColor(globalRate)}`}>{globalRate}%</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* By WP breakdown */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/50">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Détail par Work Package</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-secondary">
                {["WP", "Code Enabel", "Planifié", "Réalisé", "Solde", "Taux"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-2 font-mono text-foreground font-medium">{row.work_package}</td>
                  <td className="px-3 py-2"><span className="font-mono text-[11px] text-primary">{row.nomenclature_code}</span></td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(c(row.planned_amount))}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(c(row.spent_amount))}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(c(row.remaining))}</td>
                  <td className={`px-3 py-2 text-right font-mono font-bold ${rateColor(row.execution_rate)}`}>{row.execution_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
