import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppBreadcrumb from "@/components/shared/AppBreadcrumb";
import SectionHeader from "@/components/shared/SectionHeader";
import Pill from "@/components/shared/Pill";
import GhButton from "@/components/shared/GhButton";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio, usePortfolioPrograms } from "@/hooks/usePortfolios";
import { useProjects } from "@/hooks/useProjects";
import { useGrants } from "@/hooks/useGrants";
import { useRisks } from "@/hooks/useRisks";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useAssignableUsers";
import { EditPortfolioDialog } from "@/components/dialogs/EditEntityDialogs";
import ValidateEntityDialog from "@/components/dialogs/ValidateEntityDialog";

const statusMap: Record<string, { label: string; color: "green" | "blue" | "amber" | "gray" }> = {
  active: { label: "Actif", color: "green" },
  draft: { label: "Brouillon", color: "gray" },
  paused: { label: "En pause", color: "amber" },
  completed: { label: "Terminé", color: "blue" },
  cancelled: { label: "Annulé", color: "gray" },
};

export default function PortfolioDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: portfolio, isLoading } = usePortfolio(id);
  const { data: programs, isLoading: loadingPrograms } = usePortfolioPrograms(id);
  const { data: coordinator } = useUserProfile(portfolio?.owner_id);
  const { data: allProjects } = useProjects();
  const { data: allGrants } = useGrants();
  const { data: allRisks } = useRisks();
  const [editOpen, setEditOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);

  // Aggregated KPIs
  const programIds = useMemo(() => new Set(programs?.map(p => p.id) ?? []), [programs]);
  const portfolioProjects = useMemo(() => allProjects?.filter(p => p.program_id && programIds.has(p.program_id)) ?? [], [allProjects, programIds]);
  const portfolioGrants = useMemo(() => allGrants?.filter(g => g.program_id && programIds.has(g.program_id)) ?? [], [allGrants, programIds]);
  const portfolioRisks = useMemo(() => {
    const projectIds = new Set(portfolioProjects.map(p => p.id));
    return allRisks?.filter(r => r.project_id && projectIds.has(r.project_id)) ?? [];
  }, [allRisks, portfolioProjects]);

  const totalBudget = portfolioGrants.reduce((s, g) => s + (g.amount_total ?? 0), 0);
  const totalDisbursed = portfolioGrants.reduce((s, g) => s + (g.amount_disbursed ?? 0), 0);
  const avgProgress = portfolioProjects.length > 0
    ? Math.round(portfolioProjects.reduce((s, p) => s + (p.progress ?? 0), 0) / portfolioProjects.length)
    : 0;
  const highRisks = portfolioRisks.filter(r => r.level === "high" || r.level === "critical").length;

  if (isLoading) return <div className="p-8"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-[300px] rounded-xl" /></div>;
  if (!portfolio) return <div className="text-center py-12 text-muted-foreground">Portefeuille introuvable</div>;

  const st = statusMap[portfolio.status] ?? statusMap.draft;
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <AppBreadcrumb items={[
        { label: "Portefeuilles", href: "/app/portefeuilles" },
        { label: portfolio.name },
      ]} />
      <SectionHeader
        title={portfolio.name}
        subtitle={portfolio.description ?? portfolio.code}
        actions={
          <div className="flex items-center gap-2">
            <Pill color={st.color}>● {st.label}</Pill>
            {isAdmin && (
              <>
                <GhButton variant="secondary" size="sm" onClick={() => setEditOpen(true)}>Modifier ✏️</GhButton>
                {portfolio.status !== "active" && (
                  <GhButton variant="primary" size="sm" onClick={() => setValidateOpen(true)}>Valider ✓</GhButton>
                )}
              </>
            )}
          </div>
        }
      />

      {/* KPIs agrégés */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 mb-6">
        <StatCard label="Programmes" value={String(programs?.length ?? 0)} note="" color="blue" />
        <StatCard label="Projets" value={String(portfolioProjects.length)} note="" color="green" />
        <StatCard label="Budget cumulé" value={fmt(totalBudget)} note="XOF" color="amber" />
        <StatCard label="Décaissé" value={fmt(totalDisbursed)} note={totalBudget > 0 ? `${Math.round((totalDisbursed / totalBudget) * 100)}%` : ""} color="purple" />
        <StatCard label="Progression" value={`${avgProgress}%`} note="moyenne projets" color="green" />
        <StatCard label="Risques élevés" value={String(highRisks)} note={`/ ${portfolioRisks.length} total`} color="rose" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Code</div>
          <div className="text-foreground font-semibold">{portfolio.code}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Coordinateur</div>
          <div className="text-foreground font-semibold">{coordinator?.full_name ?? "Non assigné"}</div>
          {coordinator?.email && <div className="text-[10px] text-muted-foreground mt-0.5">{coordinator.email}</div>}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Période</div>
          <div className="text-foreground font-semibold">
            {portfolio.start_date ? new Date(portfolio.start_date).toLocaleDateString("fr-FR") : "—"} → {portfolio.end_date ? new Date(portfolio.end_date).toLocaleDateString("fr-FR") : "—"}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Grants</div>
          <div className="text-foreground font-mono text-lg font-semibold">{portfolioGrants.length}</div>
        </div>
      </div>

      {/* Consolidated risks */}
      {portfolioRisks.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Risques consolidés ({portfolioRisks.length})</div>
          <div className="flex flex-wrap gap-2">
            {portfolioRisks.slice(0, 8).map(r => (
              <div key={r.id} className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2.5 py-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${r.level === "critical" ? "bg-destructive" : r.level === "high" ? "bg-destructive/70" : r.level === "medium" ? "bg-gh-amber" : "bg-primary"}`} />
                <span className="text-[11px] text-foreground">{r.title}</span>
                <span className="text-[9px] text-muted-foreground">({r.projects?.name})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {portfolio.objectives && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Objectifs</div>
          <p className="text-[13px] text-foreground whitespace-pre-line">{portfolio.objectives}</p>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-foreground">Programmes du portefeuille</h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {loadingPrograms ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)
        ) : programs?.length === 0 ? (
          <div className="col-span-3 text-center text-muted-foreground py-8 text-sm">Aucun programme rattaché</div>
        ) : (
          programs?.map((p) => {
            const pst = statusMap[p.status] ?? statusMap.draft;
            return (
              <div key={p.id} onClick={() => navigate(`/app/programmes/${p.id}`)} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className={`h-[3px] ${pst.color === "green" ? "bg-primary" : pst.color === "blue" ? "bg-accent" : "bg-muted"}`} />
                <div className="p-4">
                  <div className="font-display text-[14px] font-bold text-foreground">{p.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{p.code} {p.funder ? `· ${p.funder}` : ""}</div>
                </div>
                <div className="px-4 py-2 bg-secondary border-t border-border flex justify-between items-center">
                  <Pill color={pst.color}>● {pst.label}</Pill>
                  <GhButton variant="ghost">→</GhButton>
                </div>
              </div>
            );
          })
        )}
      </div>

      <EditPortfolioDialog open={editOpen} onOpenChange={setEditOpen} portfolio={portfolio} />
      <ValidateEntityDialog open={validateOpen} onOpenChange={setValidateOpen} entityType="portfolios" entityId={portfolio.id} entityName={portfolio.name} />
    </motion.div>
  );
}
