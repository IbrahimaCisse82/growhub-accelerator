import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import StatCard from "@/components/shared/StatCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useGrants } from "@/hooks/useGrants";
import { useBudgets } from "@/hooks/useBudgets";
import CreateGrantDialog from "@/components/dialogs/CreateGrantDialog";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

const statusMap: Record<string, { label: string; color: "green" | "amber" | "blue" | "gray" }> = {
  draft: { label: "Brouillon", color: "gray" },
  active: { label: "Active", color: "green" },
  disbursing: { label: "Décaissement", color: "blue" },
  closing: { label: "Clôture", color: "amber" },
  closed: { label: "Clôturé", color: "gray" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

const exportCols = [
  { key: "name", label: "Nom" }, { key: "code", label: "Code" }, { key: "organization", label: "Organisation" },
  { key: "amount_total", label: "Montant" }, { key: "amount_disbursed", label: "Décaissé" }, { key: "status", label: "Statut" },
];

export default function GrantsPage() {
  const navigate = useNavigate();
  const { data: grants, isLoading } = useGrants();
  const { data: budgets } = useBudgets();
  const [search, setSearch] = useState("");

  const activeGrants = grants?.filter(g => g.status === "active" || g.status === "disbursing") ?? [];
  const budgetTotal = grants?.reduce((s, g) => s + (g.amount_total ?? 0), 0) ?? 0;
  const totalDisbursed = grants?.reduce((s, g) => s + (g.amount_disbursed ?? 0), 0) ?? 0;
  const totalSpent = budgets?.reduce((s, b) => s + (b.amount_spent ?? 0), 0) ?? 0;

  const filtered = search
    ? grants?.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.code.toLowerCase().includes(search.toLowerCase()) ||
        (g.organization ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : grants;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <SectionHeader
        title="Grants Tracking System"
        subtitle="Portefeuille de subventions — vue consolidée multi-projets"
        actions={
          <>
            <GhButton variant="ghost" onClick={() => grants && exportToCSV(grants, "grants", exportCols)}>⤓ CSV</GhButton>
            <GhButton variant="ghost" onClick={() => grants && exportToPDF("Grants Tracking System", grants, exportCols)}>⎙ PDF</GhButton>
            <CreateGrantDialog><GhButton>+ Nouveau projet</GhButton></CreateGrantDialog>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard label="Projets actifs" value={`${activeGrants.length}`} note="conventions en cours" color="blue" />
        <StatCard label="Budget total" value={`${fmt(budgetTotal)} €`} note="tous projets" color="green" />
        <StatCard label="Dépenses engagées" value={`${fmt(totalSpent)} €`} note={`${budgets?.length ?? 0} transactions saisies`} color="amber" />
        <StatCard label="Décaissé" value={`${fmt(totalDisbursed)} €`} note={`${activeGrants.length > 0 ? Math.round((totalDisbursed / (budgetTotal || 1)) * 100) : 0}% du budget`} color="purple" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Rechercher un projet…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm bg-surface-2 border-border text-sm"
        />
        <span className="text-[11px] text-muted-foreground font-mono">{filtered?.length ?? 0} projet(s)</span>
      </div>

      {/* Grant cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[280px] rounded-xl" />)}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="text-3xl mb-3">📂</div>
          <div className="text-sm font-semibold text-foreground mb-1">Aucun projet</div>
          <div className="text-xs text-muted-foreground mb-4">Créez votre premier projet de subvention</div>
          <CreateGrantDialog><GhButton>+ Nouveau projet</GhButton></CreateGrantDialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((g) => {
            const st = statusMap[g.status] ?? statusMap.draft;
            const pct = g.amount_total > 0 ? Math.round(((g.amount_disbursed ?? 0) / g.amount_total) * 100) : 0;
            // Count budget lines for this grant
            const grantBudgets = budgets?.filter(b => b.grant_id === g.id) ?? [];
            const grantSpent = grantBudgets.reduce((s, b) => s + (b.amount_spent ?? 0), 0);
            const grantPlanned = grantBudgets.reduce((s, b) => s + (b.amount_planned ?? 0), 0);

            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/app/grants/${g.id}`)}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer group"
              >
                {/* Header */}
                <div className="px-4 py-3.5 border-b border-border flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] bg-primary/10 text-primary px-[7px] py-px rounded font-semibold">{g.code}</span>
                    <div className="text-[13px] font-bold text-foreground mt-1.5 truncate group-hover:text-primary transition-colors">{g.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{g.organization ?? "—"}</div>
                  </div>
                  <Pill color={st.color}>{st.label}</Pill>
                </div>

                {/* Financial metrics */}
                <div className="px-4 py-3">
                  {[
                    { label: "Budget total", val: `${fmt(g.amount_total)} €` },
                    { label: "Décaissé", val: `${fmt(g.amount_disbursed ?? 0)} €` },
                    { label: "Dépensé", val: `${fmt(grantSpent)} €` },
                    { label: "Consommation", val: `${pct}%` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center text-[11.5px] py-1.5 border-b border-border last:border-b-0">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-mono font-semibold text-foreground">{row.val}</span>
                    </div>
                  ))}
                </div>

                {/* Period */}
                {(g.start_date || g.end_date) && (
                  <div className="px-4 py-2 border-t border-border">
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {g.start_date ?? "—"} → {g.end_date ?? "—"}
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="px-4 py-2.5 bg-secondary/50 border-t border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground font-mono">Utilisation</span>
                    <span className="text-[10px] font-mono font-semibold text-primary">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct > 80 ? "bg-destructive" : pct > 50 ? "bg-amber-500" : "bg-primary"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
