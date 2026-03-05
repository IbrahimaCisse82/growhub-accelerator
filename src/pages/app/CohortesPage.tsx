import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/shared/StatCard";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useCohorts } from "@/hooks/useCohorts";

const statusMap: Record<string, { label: string; color: "green" | "blue" | "amber" | "gray"; stripe: string }> = {
  active: { label: "Active", color: "green", stripe: "bg-gh-green" },
  draft: { label: "Brouillon", color: "gray", stripe: "bg-surface-3" },
  paused: { label: "En pause", color: "amber", stripe: "bg-gh-amber" },
  completed: { label: "Terminée", color: "blue", stripe: "bg-gh-blue" },
  cancelled: { label: "Annulée", color: "gray", stripe: "bg-surface-3" },
};

export default function CohortesPage() {
  const { data: cohorts, isLoading } = useCohorts();
  const navigate = useNavigate();
  const activeCount = cohorts?.filter((c) => c.status === "active").length ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Cohortes"
        subtitle="Gestion des cohortes de startups accompagnées"
        actions={<><GhButton variant="ghost">⤓ Exporter</GhButton><GhButton>+ Nouvelle cohorte</GhButton></>}
      />
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Cohortes Actives" value={String(activeCount)} note="" color="green" />
        <StatCard label="Total Cohortes" value={String(cohorts?.length ?? 0)} note="" color="blue" />
        <StatCard label="Taux complétion" value="—" note="" color="amber" />
        <StatCard label="Mentors assignés" value="—" note="" color="purple" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))
        ) : cohorts?.length === 0 ? (
          <div className="col-span-3 text-center text-text-secondary py-12 text-sm">Aucune cohorte pour le moment</div>
        ) : (
          cohorts?.map((c) => {
            const st = statusMap[c.status] ?? statusMap.draft;
            return (
              <div key={c.id} onClick={() => navigate(`/app/cohortes/${c.id}`)} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className={`h-[3px] ${st.stripe}`} />
                <div className="p-4">
                  <div className="font-display text-[15px] font-bold text-foreground">{c.name}</div>
                  <div className="text-[11px] text-text-secondary mt-0.5">
                    {c.programs?.name ?? "—"} {c.programs?.funder ? `· ${c.programs.funder}` : ""}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3.5">
                    <div className="text-center">
                      <div className="font-mono text-lg font-semibold text-foreground">{c.max_startups ?? "—"}</div>
                      <div className="text-[10px] text-text-tertiary mt-px">Max Startups</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-lg font-semibold text-foreground">{c.start_date ? new Date(c.start_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "—"}</div>
                      <div className="text-[10px] text-text-tertiary mt-px">Début</div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2.5 bg-surface-2 border-t border-border flex justify-between items-center">
                  <Pill color={st.color}>● {st.label}</Pill>
                  <GhButton variant="ghost">Détails →</GhButton>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
