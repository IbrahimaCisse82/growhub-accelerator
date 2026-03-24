import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import Pill from "@/components/shared/Pill";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlumni } from "@/hooks/useAlumni";
import CertificateDialog from "@/components/alumni/CertificateDialog";

export default function AlumniPage() {
  const { data: alumni, isLoading } = useAlumni();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = alumni?.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.sector?.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Alumni" subtitle="Suivi des entreprises diplômées du programme" />

      <div className="mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une entreprise alumni…"
          className="w-full max-w-sm px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : !filtered.length ? (
        <EmptyState icon="🎓" title="Aucune entreprise alumni" description="Les entreprises ayant complété un programme apparaîtront ici." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map(a => {
            const cohort = a.cohorts as any;
            const program = cohort?.projects?.programs?.name;
            return (
              <div
                key={a.id}
                onClick={() => navigate(`/app/entreprises/${a.id}`)}
                className="bg-card border border-border rounded-xl p-4 hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-foreground truncate">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground">{a.sector ?? "—"} · {a.city ?? ""}, {a.country ?? ""}</div>
                  </div>
                  <Pill color="green">🎓 Alumni</Pill>
                </div>
                {a.alumni_date && (
                  <div className="text-[10px] text-muted-foreground mt-1">Diplômée le {new Date(a.alumni_date).toLocaleDateString("fr-FR")}</div>
                )}
                {program && <div className="text-[10px] text-muted-foreground mt-1">Programme : <span className="text-foreground">{program}</span></div>}
                {cohort?.name && <div className="text-[10px] text-muted-foreground">Cohorte : <span className="text-foreground">{cohort.name}</span></div>}
                {a.alumni_notes && <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{a.alumni_notes}</p>}
                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border">
                  <div className="text-[10px] text-muted-foreground">Score: <span className="text-foreground font-medium">{a.score ?? "—"}</span></div>
                  <div className="text-[10px] text-muted-foreground">Équipe: <span className="text-foreground font-medium">{a.team_size ?? "—"}</span></div>
                  {a.revenue_monthly && <div className="text-[10px] text-muted-foreground">Revenu: <span className="text-foreground font-medium">{new Intl.NumberFormat("fr-FR").format(a.revenue_monthly)} XOF</span></div>}
                  <div className="ml-auto">
                    <CertificateDialog
                      startupName={a.name}
                      programName={program}
                      cohortName={cohort?.name}
                      alumniDate={a.alumni_date}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats summary */}
      {filtered.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox icon="🎓" label="Total Alumni" value={String(filtered.length)} />
          <StatBox icon="👥" label="Emplois créés" value={String(filtered.reduce((s, a) => s + (a.team_size ?? 0), 0))} />
          <StatBox icon="💰" label="Revenu total" value={`${new Intl.NumberFormat("fr-FR").format(filtered.reduce((s, a) => s + (a.revenue_monthly ?? 0), 0))} XOF/mois`} />
          <StatBox icon="⭐" label="Score moyen" value={filtered.filter(a => a.score).length ? (filtered.reduce((s, a) => s + (a.score ?? 0), 0) / filtered.filter(a => a.score).length).toFixed(0) + "/100" : "—"} />
        </div>
      )}
    </motion.div>
  );
}

function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
      <span className="text-lg">{icon}</span>
      <div className="min-w-0">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-foreground font-semibold text-sm mt-0.5 truncate">{value}</div>
      </div>
    </div>
  );
}
