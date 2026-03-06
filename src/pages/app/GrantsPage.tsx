import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useGrants } from "@/hooks/useGrants";
import CreateGrantDialog from "@/components/dialogs/CreateGrantDialog";

const statusMap: Record<string, { label: string; color: "green" | "amber" | "blue" | "gray" }> = {
  draft: { label: "Brouillon", color: "gray" }, active: { label: "Active", color: "green" },
  disbursing: { label: "Décaissement", color: "blue" }, closing: { label: "Clôture", color: "amber" }, closed: { label: "Clôturé", color: "gray" },
};
function formatXOF(n: number) { return new Intl.NumberFormat("fr-FR").format(n) + " XOF"; }

export default function GrantsPage() {
  const { data: grants, isLoading } = useGrants();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Grants & Subventions" subtitle="Suivi des financements et subventions actives"
        actions={<><GhButton variant="ghost">⤓ Exporter</GhButton><CreateGrantDialog><GhButton>+ Nouveau grant</GhButton></CreateGrantDialog></>} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[240px] rounded-xl" />) : grants?.length === 0 ? (
          <div className="col-span-3 text-center text-muted-foreground py-12 text-sm">Aucun grant</div>
        ) : grants?.map((g) => {
          const st = statusMap[g.status] ?? statusMap.draft;
          const pct = g.amount_total > 0 ? Math.round(((g.amount_disbursed ?? 0) / g.amount_total) * 100) : 0;
          return (
            <div key={g.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer">
              <div className="px-4 py-3.5 border-b border-border flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] bg-surface-3 text-accent px-[7px] py-px rounded font-semibold">{g.code}</span>
                  <div className="text-[13px] font-bold text-foreground mt-1.5">{g.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{g.organization ?? "—"}</div>
                </div>
                <Pill color={st.color}>{st.label}</Pill>
              </div>
              <div className="px-4 py-3.5">
                {[{ label: "Montant total", val: formatXOF(g.amount_total) }, { label: "Décaissé", val: formatXOF(g.amount_disbursed ?? 0) }, { label: "Utilisation", val: `${pct}%` }].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-[11.5px] py-1.5 border-b border-border last:border-b-0">
                    <span className="text-muted-foreground">{row.label}</span><span className="font-mono font-semibold text-foreground">{row.val}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 bg-surface-2 border-t border-border">
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
