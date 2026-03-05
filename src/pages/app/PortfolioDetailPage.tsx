import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppBreadcrumb from "@/components/shared/AppBreadcrumb";
import SectionHeader from "@/components/shared/SectionHeader";
import Pill from "@/components/shared/Pill";
import GhButton from "@/components/shared/GhButton";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio, usePortfolioPrograms } from "@/hooks/usePortfolios";

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
  const { data: portfolio, isLoading } = usePortfolio(id);
  const { data: programs, isLoading: loadingPrograms } = usePortfolioPrograms(id);

  if (isLoading) return <div className="p-8"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-[300px] rounded-xl" /></div>;
  if (!portfolio) return <div className="text-center py-12 text-muted-foreground">Portefeuille introuvable</div>;

  const st = statusMap[portfolio.status] ?? statusMap.draft;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <AppBreadcrumb items={[
        { label: "Portefeuilles", href: "/app/portefeuilles" },
        { label: portfolio.name },
      ]} />
      <SectionHeader
        title={portfolio.name}
        subtitle={portfolio.description ?? portfolio.code}
        actions={<Pill color={st.color}>● {st.label}</Pill>}
      />

      <div className="grid grid-cols-3 gap-3.5 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Code</div>
          <div className="text-foreground font-semibold">{portfolio.code}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Période</div>
          <div className="text-foreground font-semibold">
            {portfolio.start_date ? new Date(portfolio.start_date).toLocaleDateString("fr-FR") : "—"} → {portfolio.end_date ? new Date(portfolio.end_date).toLocaleDateString("fr-FR") : "—"}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Programmes</div>
          <div className="text-foreground font-mono text-lg font-semibold">{programs?.length ?? 0}</div>
        </div>
      </div>

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
    </motion.div>
  );
}
