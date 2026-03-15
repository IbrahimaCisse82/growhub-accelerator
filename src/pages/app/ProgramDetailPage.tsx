import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppBreadcrumb from "@/components/shared/AppBreadcrumb";
import SectionHeader from "@/components/shared/SectionHeader";
import Pill from "@/components/shared/Pill";
import GhButton from "@/components/shared/GhButton";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgram, useProgramGrants, useProgramEvents } from "@/hooks/usePrograms";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusMap: Record<string, { label: string; color: "green" | "blue" | "amber" | "gray" }> = {
  active: { label: "Actif", color: "green" },
  draft: { label: "Brouillon", color: "gray" },
  paused: { label: "En pause", color: "amber" },
  completed: { label: "Terminé", color: "blue" },
  cancelled: { label: "Annulé", color: "gray" },
};

const grantStatusColor: Record<string, "green" | "amber" | "blue" | "gray"> = {
  draft: "gray", active: "green", disbursing: "blue", closing: "amber", closed: "gray",
};

const eventTypeLabel: Record<string, string> = { demo_day: "Demo Day", workshop: "Workshop", networking: "Networking", hackathon: "Hackathon", committee: "Comité", webinar: "Webinar", other: "Autre" };

function formatXOF(n: number) { return new Intl.NumberFormat("fr-FR").format(n) + " XOF"; }

export default function ProgramDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: program, isLoading } = useProgram(id);
  
  const { data: grants } = useProgramGrants(id);
  const { data: events } = useProgramEvents(id);

  if (isLoading) return <div className="p-8"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-[300px] rounded-xl" /></div>;
  if (!program) return <div className="text-center py-12 text-muted-foreground">Programme introuvable</div>;

  const st = statusMap[program.status] ?? statusMap.draft;
  const portfolio = program.portfolios;
  const totalGrantAmount = grants?.reduce((a, g) => a + g.amount_total, 0) ?? 0;

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <StatCard label="Budget Total" value={program.budget_total ? new Intl.NumberFormat("fr-FR").format(program.budget_total) : "—"} note={program.currency ?? "XOF"} color="blue" />
        <StatCard label="Cohortes" value={String(cohorts?.length ?? 0)} note="" color="green" />
        <StatCard label="Grants" value={String(grants?.length ?? 0)} note={totalGrantAmount > 0 ? formatXOF(totalGrantAmount) : ""} color="amber" />
        <StatCard label="Événements" value={String(events?.length ?? 0)} note="" color="purple" />
      </div>

      {program.description && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Description</div>
          <p className="text-[13px] text-foreground whitespace-pre-line">{program.description}</p>
        </div>
      )}

      {/* Cohortes */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm font-bold text-foreground">Cohortes du programme</h3>
          <GhButton variant="ghost" onClick={() => navigate("/app/cohortes")}>Voir tout →</GhButton>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingCohorts ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)
          ) : cohorts?.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-8 text-sm">Aucune cohorte rattachée</div>
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
      </div>

      {/* Grants */}
      {grants && grants.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold text-foreground">Grants & Subventions ({grants.length})</h3>
            <GhButton variant="ghost" onClick={() => navigate("/app/grants")}>Voir tout →</GhButton>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full border-collapse text-[12.5px]">
              <thead><tr className="bg-secondary">
                {["Grant", "Code", "Montant", "Décaissé", "Statut"].map(h => <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left">{h}</th>)}
              </tr></thead>
              <tbody>
                {grants.map(g => {
                  const pct = g.amount_total > 0 ? Math.round(((g.amount_disbursed ?? 0) / g.amount_total) * 100) : 0;
                  return (
                    <tr key={g.id} className="hover:bg-secondary transition-colors cursor-pointer" onClick={() => navigate("/app/grants")}>
                      <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{g.name}</td>
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-muted-foreground">{g.code}</td>
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{formatXOF(g.amount_total)}</td>
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{formatXOF(g.amount_disbursed ?? 0)} ({pct}%)</td>
                      <td className="px-3.5 py-2.5 border-b border-border"><Pill color={grantStatusColor[g.status] ?? "gray"}>{g.status}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Événements */}
      {events && events.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold text-foreground">Événements ({events.length})</h3>
            <GhButton variant="ghost" onClick={() => navigate("/app/evenements")}>Voir tout →</GhButton>
          </div>
          <div className="flex flex-col gap-2">
            {events.slice(0, 5).map(e => {
              const d = new Date(e.start_at);
              return (
                <div key={e.id} className="bg-surface-2 border border-border rounded-[10px] p-3 flex items-center gap-3 cursor-pointer hover:border-border/80 transition-colors" onClick={() => navigate("/app/evenements")}>
                  <div className="text-center flex-shrink-0 w-[42px] bg-card rounded-lg py-2 px-1.5 border border-border">
                    <div className="font-mono text-lg font-bold text-foreground leading-none">{format(d, "dd")}</div>
                    <div className="font-mono text-[9px] text-muted-foreground uppercase mt-0.5">{format(d, "MMM", { locale: fr })}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-foreground truncate">{e.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{eventTypeLabel[e.event_type] ?? e.event_type} · {e.location ?? (e.is_online ? "En ligne" : "—")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
