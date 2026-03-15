import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppBreadcrumb from "@/components/shared/AppBreadcrumb";
import SectionHeader from "@/components/shared/SectionHeader";
import Pill from "@/components/shared/Pill";
import GhButton from "@/components/shared/GhButton";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useCohort, useCohortStartups, useCohortApplications } from "@/hooks/useCohortDetail";

const statusMap: Record<string, { label: string; color: "green" | "blue" | "amber" | "gray" }> = {
  active: { label: "Active", color: "green" },
  draft: { label: "Brouillon", color: "gray" },
  paused: { label: "En pause", color: "amber" },
  completed: { label: "Terminée", color: "blue" },
  cancelled: { label: "Annulée", color: "gray" },
};

const appStepColor: Record<string, "blue" | "amber" | "purple" | "green" | "rose" | "gray"> = {
  submitted: "gray", screening: "amber", interview: "blue",
  due_diligence: "purple", accepted: "green", rejected: "rose",
};

export default function CohortDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: cohort, isLoading } = useCohort(id);
  const { data: startups, isLoading: loadingStartups } = useCohortStartups(id);
  const { data: applications } = useCohortApplications(id);

  if (isLoading) return <div className="p-8"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-[300px] rounded-xl" /></div>;
  if (!cohort) return <div className="text-center py-12 text-muted-foreground">Cohorte introuvable</div>;

  const st = statusMap[cohort.status] ?? statusMap.draft;
  const project = cohort.projects;
  const program = project?.programs;
  const portfolio = program?.portfolios;

  const crumbs = [
    { label: "Portefeuilles", href: "/app/portefeuilles" },
    ...(portfolio ? [{ label: portfolio.name, href: `/app/portefeuilles/${portfolio.id}` }] : []),
    ...(program ? [{ label: program.name, href: `/app/programmes/${program.id}` }] : []),
    ...(project ? [{ label: project.name, href: `/app/projets/${project.id}` }] : []),
    { label: cohort.name },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <AppBreadcrumb items={crumbs} />
      <SectionHeader
        title={cohort.name}
        subtitle={cohort.description ?? "Cohorte d'accompagnement"}
        actions={<Pill color={st.color}>● {st.label}</Pill>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <StatCard label="Entreprises" value={String(startups?.length ?? 0)} note={`/ ${cohort.max_startups ?? "—"}`} color="green" />
        <StatCard label="Projet" value={project?.name ?? "—"} note="" color="blue" />
        <StatCard label="Début" value={cohort.start_date ? new Date(cohort.start_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "—"} note="" color="amber" />
        <StatCard label="Candidatures" value={String(applications?.length ?? 0)} note="" color="purple" />
      </div>

      {/* Startups */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm font-bold text-foreground">Entreprises de la cohorte</h3>
          <GhButton variant="ghost" onClick={() => navigate("/app/entreprises")}>Voir tout →</GhButton>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingStartups ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)
          ) : startups?.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-8 text-sm">Aucune entreprise dans cette cohorte</div>
          ) : (
            startups?.map((s) => (
              <div key={s.id} onClick={() => navigate(`/app/entreprises/${s.id}`)} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="h-[3px] bg-primary" />
                <div className="p-4">
                  <div className="font-display text-[14px] font-bold text-foreground">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.sector ?? "—"} · {s.city ?? s.country ?? "—"}</div>
                  {s.score != null && <div className="mt-2 font-mono text-sm text-primary">{s.score}/100</div>}
                </div>
                <div className="px-4 py-2 bg-secondary border-t border-border flex justify-between items-center">
                  <Pill color={s.stage === "croissance" || s.stage === "scale" ? "green" : "amber"}>{s.stage ?? "—"}</Pill>
                  <GhButton variant="ghost">→</GhButton>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Candidatures */}
      {applications && applications.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold text-foreground">Candidatures ({applications.length})</h3>
            <GhButton variant="ghost" onClick={() => navigate("/app/candidatures")}>Voir tout →</GhButton>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full border-collapse text-[12.5px]">
              <thead><tr className="bg-secondary">
                {["Entreprise", "Étape", "Score", "Date"].map(h => <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left">{h}</th>)}
              </tr></thead>
              <tbody>
                {applications.map(a => (
                  <tr key={a.id} className="hover:bg-secondary transition-colors cursor-pointer" onClick={() => a.startup_id && navigate(`/app/entreprises/${a.startup_id}`)}>
                    <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{a.startups?.name ?? "—"}</td>
                    <td className="px-3.5 py-2.5 border-b border-border"><Pill color={appStepColor[a.status] ?? "gray"}>{a.status}</Pill></td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-primary">{a.score != null ? `${a.score}/100` : "—"}</td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{new Date(a.submitted_at).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
