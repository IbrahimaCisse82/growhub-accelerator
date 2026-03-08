import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/shared/StatCard";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useStartupsCount, useStartups } from "@/hooks/useStartups";
import { useProjects } from "@/hooks/useProjects";
import { useGrants } from "@/hooks/useGrants";
import { useApplicationsPipeline } from "@/hooks/useApplications";
import { useCohorts } from "@/hooks/useCohorts";
import { useCoachingSessions } from "@/hooks/useCoachingSessions";
import { useCourses } from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import { exportToCSV } from "@/lib/exportUtils";

const statusColor: Record<string, "green" | "blue" | "amber" | "gray"> = {
  active: "green", draft: "gray", paused: "amber", completed: "blue", cancelled: "gray",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { roles, isAdmin, profile } = useAuth();
  const isMentor = roles.includes("mentor");
  const isEntrepreneur = roles.includes("entrepreneur");

  const { data: startupsCount, isLoading: loadingStartups } = useStartupsCount();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: grants, isLoading: loadingGrants } = useGrants();
  const { data: pipeline } = useApplicationsPipeline();
  const { data: cohorts } = useCohorts();
  const { data: sessions } = useCoachingSessions();
  const { data: courses } = useCourses();
  const { data: startups } = useStartups();

  const activeGrants = grants?.filter((g) => g.status === "active" || g.status === "disbursing") ?? [];
  const totalFunding = activeGrants.reduce((a, g) => a + g.amount_total, 0);
  const activeCohorts = cohorts?.filter((c) => c.status === "active").length ?? 0;

  const pipelineSteps = [
    { key: "submitted", label: "Reçues" },
    { key: "screening", label: "Examen" },
    { key: "interview", label: "Entretien" },
    { key: "due_diligence", label: "Due Diligence" },
    { key: "accepted", label: "Acceptées" },
  ];

  // Mentor-specific data
  const mySessions = sessions?.filter(s => s.mentor_id === profile?.user_id) ?? [];
  const upcomingSessions = mySessions.filter(s => s.status === "planned" || s.status === "confirmed");

  // Entrepreneur-specific data
  const myStartup = startups?.find(s => s.founder_id === profile?.user_id);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <SectionHeader
        title={`Bienvenue${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        subtitle={isAdmin ? "Vue d'ensemble — Administration" : isMentor ? "Vue d'ensemble — Espace Mentor" : isEntrepreneur ? "Vue d'ensemble — Espace Entrepreneur" : "GrowHub Accelerator"}
        actions={
          <>
            <GhButton variant="secondary" onClick={() => {
              if (projects) exportToCSV(projects, "dashboard-projets", [
                { key: "name", label: "Projet" }, { key: "status", label: "Statut" }, { key: "progress", label: "%" },
              ]);
            }}>⤓ Exporter</GhButton>
            <GhButton variant="primary" onClick={() => navigate("/app/startups")}>+ Créer</GhButton>
          </>
        }
      />

      {/* KPI Stats — role-adapted */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        {isAdmin ? (
          <>
            <div onClick={() => navigate("/app/startups")} className="cursor-pointer"><StatCard label="Startups Actives" value={loadingStartups ? "…" : String(startupsCount)} note="" icon="△" color="green" /></div>
            <div onClick={() => navigate("/app/grants")} className="cursor-pointer"><StatCard label="Financements (XOF)" value={loadingGrants ? "…" : new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(totalFunding)} note={`${activeGrants.length} grants actifs`} icon="◎" color="blue" /></div>
            <div onClick={() => navigate("/app/projets")} className="cursor-pointer"><StatCard label="Projets" value={loadingProjects ? "…" : String(projects?.length ?? 0)} note="" icon="◑" color="amber" /></div>
            <div onClick={() => navigate("/app/cohortes")} className="cursor-pointer"><StatCard label="Cohortes actives" value={String(activeCohorts)} note="" icon="◉" color="purple" /></div>
          </>
        ) : isMentor ? (
          <>
            <StatCard label="Mes sessions" value={String(mySessions.length)} note={`${upcomingSessions.length} à venir`} icon="◎" color="blue" />
            <StatCard label="Startups suivies" value={String(new Set(mySessions.map(s => s.startup_id)).size)} note="" icon="△" color="green" />
            <StatCard label="Sessions terminées" value={String(mySessions.filter(s => s.status === "completed").length)} note="" icon="◑" color="amber" />
            <StatCard label="Cours disponibles" value={String(courses?.filter(c => c.is_published).length ?? 0)} note="" icon="◇" color="purple" />
          </>
        ) : (
          <>
            <StatCard label="Ma startup" value={myStartup?.name ?? "—"} note={myStartup?.stage ?? ""} icon="△" color="green" />
            <StatCard label="Score" value={myStartup?.score != null ? `${myStartup.score}/100` : "—"} note="" icon="◎" color="blue" />
            <StatCard label="Projets" value={String(projects?.filter(p => p.startup_id === myStartup?.id).length ?? 0)} note="" icon="◑" color="amber" />
            <StatCard label="Cours disponibles" value={String(courses?.filter(c => c.is_published).length ?? 0)} note="" icon="◇" color="purple" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        {/* Main content — role-adapted */}
        {isMentor && !isAdmin ? (
          <GhCard title="Prochaines sessions" badge={String(upcomingSessions.length)} action={<GhButton variant="ghost" onClick={() => navigate("/app/coaching")}>Voir tout →</GhButton>} noPadding>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead><tr className="bg-secondary">
                  {["Session", "Date", "Statut"].map(h => <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody>
                  {upcomingSessions.length === 0 ? (
                    <tr><td colSpan={3} className="px-3.5 py-8 text-center text-muted-foreground text-sm">Aucune session à venir</td></tr>
                  ) : upcomingSessions.slice(0, 6).map(s => (
                    <tr key={s.id} className="hover:bg-secondary transition-colors">
                      <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{s.title}</td>
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{new Date(s.scheduled_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-3.5 py-2.5 border-b border-border"><Pill color={s.status === "confirmed" ? "green" : "amber"}>{s.status}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GhCard>
        ) : (
          <GhCard title="Projets Actifs" badge={String(projects?.length ?? 0)} action={<GhButton variant="ghost" onClick={() => navigate("/app/projets")}>Voir tout →</GhButton>} noPadding>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-secondary">
                    {["Projet", "Startup", "Statut", "Avancement", "Échéance"].map((h) => (
                      <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingProjects ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-3.5 py-2.5 border-b border-border"><Skeleton className="h-4 w-20" /></td>)}</tr>
                    ))
                  ) : projects?.length === 0 ? (
                    <tr><td colSpan={5} className="px-3.5 py-8 text-center text-muted-foreground text-sm">Aucun projet</td></tr>
                  ) : (
                    (isEntrepreneur && myStartup ? projects?.filter(p => p.startup_id === myStartup.id) : projects)?.slice(0, 6).map((p) => (
                      <tr key={p.id} className="hover:bg-secondary transition-colors">
                        <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{p.name}</td>
                        <td className="px-3.5 py-2.5 border-b border-border text-foreground">{p.startups?.name ?? "—"}</td>
                        <td className="px-3.5 py-2.5 border-b border-border"><Pill color={statusColor[p.status] ?? "gray"}>{p.status}</Pill></td>
                        <td className="px-3.5 py-2.5 border-b border-border">
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all duration-600" style={{ width: `${p.progress ?? 0}%` }} />
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">
                          {p.end_date ? new Date(p.end_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GhCard>
        )}

        {/* Sidebar card — role-adapted */}
        {isAdmin ? (
          <GhCard title="Pipeline Candidatures" action={<GhButton variant="ghost" onClick={() => navigate("/app/candidatures")}>Voir tout →</GhButton>}>
            <div className="flex flex-col gap-2">
              {pipelineSteps.map((step) => (
                <div key={step.key} className="flex justify-between items-center py-1.5 border-b border-border last:border-b-0">
                  <span className="text-[11.5px] text-muted-foreground">{step.label}</span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {pipeline ? pipeline[step.key as keyof typeof pipeline] ?? 0 : "—"}
                  </span>
                </div>
              ))}
            </div>
          </GhCard>
        ) : (
          <GhCard title="Accès rapides">
            <div className="flex flex-col gap-2">
              {[
                { label: "Mes cours", path: "/app/lms", icon: "📚" },
                { label: "Événements", path: "/app/evenements", icon: "📅" },
                { label: "Ressources", path: "/app/ressources", icon: "📁" },
                { label: "Mon profil", path: "/app/profil", icon: "👤" },
              ].map(item => (
                <div key={item.path} onClick={() => navigate(item.path)} className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[12.5px] font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </GhCard>
        )}
      </div>

      {/* Financements — only for admin */}
      {isAdmin && (
        <GhCard title="Financements Actifs" action={<GhButton variant="ghost" onClick={() => navigate("/app/grants")}>Voir tout →</GhButton>}>
          <div className="flex flex-col gap-2.5">
            {loadingGrants ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 rounded" />)
            ) : activeGrants.length === 0 ? (
              <div className="text-[11.5px] text-muted-foreground text-center py-4">Aucun financement actif</div>
            ) : (
              activeGrants.map((g) => {
                const pct = g.amount_total > 0 ? Math.round(((g.amount_disbursed ?? 0) / g.amount_total) * 100) : 0;
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{g.organization ?? g.name}</span>
                      <span className="font-mono">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-accent transition-all duration-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GhCard>
      )}
    </motion.div>
  );
}
