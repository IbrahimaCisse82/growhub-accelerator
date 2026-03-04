import { motion } from "framer-motion";
import StatCard from "@/components/shared/StatCard";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoachingSessions } from "@/hooks/useCoachingSessions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusMap: Record<string, { label: string; color: "green" | "amber" | "blue" | "gray" }> = {
  planned: { label: "Planifié", color: "blue" },
  confirmed: { label: "Confirmé", color: "green" },
  in_progress: { label: "En cours", color: "amber" },
  completed: { label: "Terminé", color: "gray" },
  cancelled: { label: "Annulé", color: "gray" },
};

export default function CoachingPage() {
  const { data: sessions, isLoading } = useCoachingSessions();
  const total = sessions?.length ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Coaching & Sessions"
        subtitle="Planification et suivi des sessions d'accompagnement"
        actions={<><GhButton variant="ghost">📅 Calendrier</GhButton><GhButton>+ Planifier session</GhButton></>}
      />
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Sessions totales" value={String(total)} note="" color="green" />
        <StatCard label="Confirmées" value={String(sessions?.filter((s) => s.status === "confirmed").length ?? 0)} note="" color="blue" />
        <StatCard label="Planifiées" value={String(sessions?.filter((s) => s.status === "planned").length ?? 0)} note="" color="amber" />
        <StatCard label="Terminées" value={String(sessions?.filter((s) => s.status === "completed").length ?? 0)} note="" color="purple" />
      </div>
      <GhCard title="Sessions" action={<GhButton variant="ghost">Voir tout →</GhButton>} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-surface-2">
                {["Date", "Startup", "Titre", "Durée", "Statut", "Actions"].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-3.5 py-2.5 border-b border-border"><Skeleton className="h-4 w-20" /></td>)}</tr>
                ))
              ) : sessions?.length === 0 ? (
                <tr><td colSpan={6} className="px-3.5 py-8 text-center text-text-secondary text-sm">Aucune session pour le moment</td></tr>
              ) : (
                sessions?.map((s) => {
                  const st = statusMap[s.status] ?? statusMap.planned;
                  return (
                    <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">
                        {format(new Date(s.scheduled_at), "dd MMM HH:mm", { locale: fr })}
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border text-foreground">{s.startups?.name ?? "—"}</td>
                      <td className="px-3.5 py-2.5 border-b border-border text-foreground">{s.title}</td>
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{s.duration_minutes}min</td>
                      <td className="px-3.5 py-2.5 border-b border-border"><Pill color={st.color}>{st.label}</Pill></td>
                      <td className="px-3.5 py-2.5 border-b border-border">
                        <GhButton variant={st.color === "amber" ? "accent" : "ghost"}>
                          {st.color === "amber" ? "Confirmer" : "Détails"}
                        </GhButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GhCard>
    </motion.div>
  );
}
