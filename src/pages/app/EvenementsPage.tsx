import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/hooks/useEvents";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const typeColor: Record<string, "green" | "blue" | "purple" | "amber" | "rose" | "gray"> = {
  demo_day: "green", workshop: "blue", networking: "purple",
  hackathon: "amber", committee: "rose", webinar: "blue", other: "gray",
};
const typeLabel: Record<string, string> = {
  demo_day: "Demo Day", workshop: "Workshop", networking: "Networking",
  hackathon: "Hackathon", committee: "Comité", webinar: "Webinar", other: "Autre",
};

export default function EvenementsPage() {
  const { data: events, isLoading } = useEvents();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Événements"
        subtitle="Calendrier des événements et activités du réseau"
        actions={<><GhButton variant="ghost">📅 Vue calendrier</GhButton><GhButton>+ Créer événement</GhButton></>}
      />
      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[80px] rounded-xl" />)
        ) : events?.length === 0 ? (
          <div className="text-center text-text-secondary py-12 text-sm">Aucun événement pour le moment</div>
        ) : (
          events?.map((e) => {
            const d = new Date(e.start_at);
            return (
              <div key={e.id} className="bg-surface-2 border border-border rounded-[10px] p-4 flex items-center gap-3.5 cursor-pointer hover:border-border/80 transition-colors">
                <div className="text-center flex-shrink-0 w-[46px] bg-card rounded-lg py-2 px-1.5 border border-border">
                  <div className="font-mono text-xl font-bold text-foreground leading-none">{format(d, "dd")}</div>
                  <div className="font-mono text-[9px] text-text-tertiary uppercase mt-0.5">{format(d, "MMM", { locale: fr })}</div>
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-foreground">{e.title}</div>
                  <div className="text-[11.5px] text-text-secondary mt-0.5">
                    {e.location ?? (e.is_online ? "En ligne" : "—")}
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    <Pill color={typeColor[e.event_type] ?? "gray"}>{typeLabel[e.event_type] ?? e.event_type}</Pill>
                  </div>
                </div>
                <GhButton variant="ghost">Détails →</GhButton>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
