import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionHeader from "@/components/shared/SectionHeader";
import StatCard from "@/components/shared/StatCard";
import Pill from "@/components/shared/Pill";
import GhButton from "@/components/shared/GhButton";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrograms } from "@/hooks/usePrograms";

const statusMap: Record<string, { label: string; color: "green" | "blue" | "amber" | "gray" }> = {
  active: { label: "Actif", color: "green" },
  draft: { label: "Brouillon", color: "gray" },
  paused: { label: "En pause", color: "amber" },
  completed: { label: "Terminé", color: "blue" },
  cancelled: { label: "Annulé", color: "gray" },
};

export default function ProgrammesPage() {
  const { data: programs, isLoading } = usePrograms();
  const navigate = useNavigate();
  const activeCount = programs?.filter((p) => p.status === "active").length ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Programmes"
        subtitle="Coordination des programmes d'accélération"
        actions={<GhButton>+ Nouveau programme</GhButton>}
      />
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Actifs" value={String(activeCount)} note="" color="green" />
        <StatCard label="Total" value={String(programs?.length ?? 0)} note="" color="blue" />
        <StatCard label="Budget Total" value={programs ? new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(programs.reduce((s, p) => s + (p.budget_total ?? 0), 0)) : "—"} note="XOF" color="purple" />
        <StatCard label="Terminés" value={String(programs?.filter((p) => p.status === "completed").length ?? 0)} note="" color="amber" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[200px] rounded-xl" />)
        ) : programs?.length === 0 ? (
          <div className="col-span-3 text-center text-muted-foreground py-12 text-sm">Aucun programme pour le moment</div>
        ) : (
          programs?.map((p) => {
            const st = statusMap[p.status] ?? statusMap.draft;
            return (
              <div key={p.id} onClick={() => navigate(`/app/programmes/${p.id}`)} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className={`h-[3px] ${st.color === "green" ? "bg-primary" : st.color === "blue" ? "bg-accent" : st.color === "amber" ? "bg-warning" : "bg-muted"}`} />
                <div className="p-4">
                  <div className="font-display text-[15px] font-bold text-foreground">{p.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{p.code} {p.funder ? `· ${p.funder}` : ""}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{(p as any).portfolios?.name ?? "Sans portefeuille"}</div>
                  <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{p.description ?? "Aucune description"}</p>
                </div>
                <div className="px-4 py-2.5 bg-secondary border-t border-border flex justify-between items-center">
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
