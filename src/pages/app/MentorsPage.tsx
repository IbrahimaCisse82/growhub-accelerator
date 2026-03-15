import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useMentors } from "@/hooks/useMentors";

const availabilityMap: Record<string, { label: string; color: "green" | "amber" | "rose" }> = {
  available: { label: "Disponible", color: "green" },
  partial: { label: "Partiel", color: "amber" },
  unavailable: { label: "Indisponible", color: "rose" },
};

const gradients = [
  "from-gh-green to-gh-blue", "from-gh-amber to-gh-rose",
  "from-gh-purple to-gh-blue", "from-gh-rose to-gh-amber",
  "from-gh-green to-gh-purple",
];

export default function MentorsPage() {
  const { data: mentors, isLoading } = useMentors();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Mentors"
        subtitle="Réseau d'experts et matching avec les entreprises"
        actions={<GhButton>+ Inviter mentor</GhButton>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-xl" />
          ))
        ) : mentors?.length === 0 ? (
          <div className="col-span-full">
            <EmptyState icon="🧑‍🏫" title="Aucun mentor" description="Invitez des experts pour accompagner vos startups" actionLabel="+ Inviter" />
          </div>
        ) : (
          mentors?.map((m, idx) => {
            const mentorName = m.profile.full_name || "Mentor";
            const initials = mentorName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
            const avail = availabilityMap[m.availability ?? "available"] ?? availabilityMap.available;
            return (
              <div key={m.id} className="bg-card border border-border rounded-xl p-[18px] hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3.5">
                  <div className={`w-[42px] h-[42px] rounded-full bg-gradient-to-br ${gradients[idx % gradients.length]} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-foreground">{mentorName}</div>
                    <div className="text-[11px] text-muted-foreground mt-px">{m.bio?.slice(0, 40) ?? "—"}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(m.expertise_areas ?? []).map((t) => (
                    <span key={t} className="font-mono text-[10px] bg-muted text-muted-foreground px-2 py-px rounded">{t}</span>
                  ))}
                </div>
                <div className="flex gap-3.5 text-[11px] text-muted-foreground">
                  <span>Sessions: <span className="font-mono font-semibold text-foreground">{m.total_sessions ?? 0}</span></span>
                  <span>Note: <span className="font-mono font-semibold text-gh-amber">{m.average_rating ?? "—"}★</span></span>
                  <span>Max: <span className="font-mono font-semibold text-foreground">{m.max_startups ?? 5}</span></span>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <Pill color={avail.color}>● {avail.label}</Pill>
                  <GhButton variant="accent" disabled={avail.color === "rose"}>Voir profil →</GhButton>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
