import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import AppBreadcrumb from "@/components/shared/AppBreadcrumb";
import SectionHeader from "@/components/shared/SectionHeader";
import Pill from "@/components/shared/Pill";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useStartup, useStartupMembers } from "@/hooks/useStartupDetail";

export default function StartupDetailPage() {
  const { id } = useParams();
  const { data: startup, isLoading } = useStartup(id);
  const { data: members } = useStartupMembers(id);

  if (isLoading) return <div className="p-8"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-[300px] rounded-xl" /></div>;
  if (!startup) return <div className="text-center py-12 text-muted-foreground">Startup introuvable</div>;

  const cohort = (startup as any).cohorts;
  const program = cohort?.programs;
  const portfolio = program?.portfolios;

  const crumbs = [
    { label: "Portefeuilles", href: "/app/portefeuilles" },
    ...(portfolio ? [{ label: portfolio.name, href: `/app/portefeuilles/${portfolio.id}` }] : []),
    ...(program ? [{ label: program.name, href: `/app/programmes/${program.id}` }] : []),
    ...(cohort ? [{ label: cohort.name, href: `/app/cohortes/${cohort.id}` }] : []),
    { label: startup.name },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <AppBreadcrumb items={crumbs} />
      <SectionHeader
        title={startup.name}
        subtitle={`${startup.sector ?? ""} · ${startup.city ?? ""}, ${startup.country ?? ""}`}
        actions={<Pill color={startup.stage === "croissance" || startup.stage === "scale" ? "green" : "amber"}>{startup.stage ?? "—"}</Pill>}
      />

      <div className="grid grid-cols-4 gap-3.5 mb-6">
        <StatCard label="Score" value={startup.score != null ? `${startup.score}/100` : "—"} note="" color="green" />
        <StatCard label="Équipe" value={String(startup.team_size ?? 1)} note="membres" color="blue" />
        <StatCard label="Revenu mensuel" value={startup.revenue_monthly ? new Intl.NumberFormat("fr-FR").format(startup.revenue_monthly) : "—"} note="XOF" color="amber" />
        <StatCard label="Cohorte" value={cohort?.name ?? "—"} note="" color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Informations</div>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Secteur</span><span className="text-foreground font-medium">{startup.sector ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pays</span><span className="text-foreground font-medium">{startup.country ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ville</span><span className="text-foreground font-medium">{startup.city ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fondée le</span><span className="text-foreground font-medium">{startup.founded_date ? new Date(startup.founded_date).toLocaleDateString("fr-FR") : "—"}</span></div>
            {startup.website && (
              <div className="flex justify-between"><span className="text-muted-foreground">Site web</span><a href={startup.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{startup.website}</a></div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Équipe ({members?.length ?? 0})</div>
          {members?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun membre enregistré</p>
          ) : (
            <div className="space-y-2">
              {members?.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-[13px]">
                  <div>
                    <span className="text-foreground font-medium">{m.full_name}</span>
                    {m.email && <span className="text-muted-foreground ml-2 text-[11px]">{m.email}</span>}
                  </div>
                  {m.role && <Pill color="blue">{m.role}</Pill>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {startup.description && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Description</div>
          <p className="text-[13px] text-foreground whitespace-pre-line">{startup.description}</p>
        </div>
      )}
    </motion.div>
  );
}
