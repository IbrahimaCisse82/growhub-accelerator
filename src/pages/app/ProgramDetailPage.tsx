import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppBreadcrumb from "@/components/shared/AppBreadcrumb";
import SectionHeader from "@/components/shared/SectionHeader";
import Pill from "@/components/shared/Pill";
import GhButton from "@/components/shared/GhButton";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgram, useProgramCohorts } from "@/hooks/usePrograms";

const statusMap: Record<string, { label: string; color: "green" | "blue" | "amber" | "gray" }> = {
  active: { label: "Actif", color: "green" },
  draft: { label: "Brouillon", color: "gray" },
  paused: { label: "En pause", color: "amber" },
  completed: { label: "Terminé", color: "blue" },
  cancelled: { label: "Annulé", color: "gray" },
};

export default function ProgramDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: program, isLoading } = useProgram(id);
  const { data: cohorts, isLoading: loadingCohorts } = useProgramCohorts(id);

  if (isLoading) return <div className="p-8"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-[300px] rounded-xl" /></div>;
  if (!program) return <div className="text-center py-12 text-muted-foreground">Programme introuvable</div>;

  const st = statusMap[program.status] ?? statusMap.draft;
  const portfolio = (program as any).portfolios;

  const crumbs = [
    { label: "Portefeuilles", href: "/app/portefeuilles" },
    ...(portfolio ? [{ label: portfolio.name, href: `/app/portefeuilles/${portfolio.id}` }] : []),
    { label: program.name },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <AppBreadcrumb items={crumbs} />
      <SectionHeader
        title={program.name}
        subtitle={`${program.code} ${program.funder ? `· Bailleur : ${program.funder}` : ""}`}
        actions={<Pill color={st.color}>● {st.label}</Pill>}
      />

      <div className="grid grid-cols-4 gap-3.5 mb-6">
        <StatCard label="Budget Total" value={program.budget_total ? new Intl.NumberFormat("fr-FR").format(program.budget_total) : "—"} note={program.currency ?? "XOF"} color="blue" />
        <StatCard label="Cohortes" value={String(cohorts?.length ?? 0)} note="" color="green" />
        <StatCard label="Début" value={program.start_date ? new Date(program.start_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "—"} note="" color="amber" />
        <StatCard label="Fin" value={program.end_date ? new Date(program.end_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "—"} note="" color="purple" />
      </div>

      {program.description && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Description</div>
          <p className="text-[13px] text-foreground whitespace-pre-line">{program.description}</p>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-foreground">Cohortes du programme</h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {loadingCohorts ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)
        ) : cohorts?.length === 0 ? (
          <div className="col-span-3 text-center text-muted-foreground py-8 text-sm">Aucune cohorte rattachée</div>
        ) : (
          cohorts?.map((c) => {
            const cst = statusMap[c.status] ?? statusMap.draft;
            return (
              <div key={c.id} onClick={() => navigate(`/app/cohortes/${c.id}`)} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className={`h-[3px] ${cst.color === "green" ? "bg-primary" : cst.color === "blue" ? "bg-accent" : "bg-muted"}`} />
                <div className="p-4">
                  <div className="font-display text-[14px] font-bold text-foreground">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Max {c.max_startups ?? "—"} startups</div>
                </div>
                <div className="px-4 py-2 bg-secondary border-t border-border flex justify-between items-center">
                  <Pill color={cst.color}>● {cst.label}</Pill>
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
