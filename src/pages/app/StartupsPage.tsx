import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useStartups } from "@/hooks/useStartups";
import CreateStartupDialog from "@/components/dialogs/CreateStartupDialog";
import { useState } from "react";

const sectorColor: Record<string, "green" | "blue" | "purple" | "rose" | "amber" | "gray"> = { fintech: "blue", agritech: "green", edtech: "purple", healthtech: "rose", cleantech: "green", logistique: "amber" };
const stageColor: Record<string, "green" | "blue" | "amber" | "gray"> = { mvp: "amber", incubation: "amber", accélération: "green", croissance: "blue", scale: "green" };
function getPillColor(value: string | null, map: Record<string, any>, fallback = "gray" as const) { return !value ? fallback : map[value.toLowerCase()] ?? fallback; }

export default function StartupsPage() {
  const { data: startups, isLoading } = useStartups();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const filtered = startups?.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Startups" subtitle="Répertoire et suivi des entreprises accompagnées"
        actions={<>
          <input className="bg-surface-2 border border-border rounded-lg px-3 py-[7px] text-[12.5px] text-foreground outline-none focus:border-primary/50 w-[200px] placeholder:text-muted-foreground" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          <CreateStartupDialog><GhButton>+ Ajouter</GhButton></CreateStartupDialog>
        </>} />
      <GhCard title="Toutes les startups" badge={String(filtered?.length ?? 0)} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead><tr className="bg-surface-2">{["Startup", "Secteur", "Cohorte", "Stade", "Score", "Pays", ""].map((h) => <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-3.5 py-2.5 border-b border-border"><Skeleton className="h-4 w-20" /></td>)}</tr>) : filtered?.length === 0 ? (
                <tr><td colSpan={7} className="px-3.5 py-8 text-center text-muted-foreground text-sm">Aucune startup</td></tr>
              ) : filtered?.map((s) => (
                <tr key={s.id} onClick={() => navigate(`/app/startups/${s.id}`)} className="hover:bg-surface-2 transition-colors cursor-pointer">
                  <td className="px-3.5 py-2.5 border-b border-border"><div className="font-semibold text-foreground">{s.name}</div><div className="text-[11px] text-muted-foreground">{s.city ?? s.country}</div></td>
                  <td className="px-3.5 py-2.5 border-b border-border"><Pill color={getPillColor(s.sector, sectorColor)}>{s.sector ?? "—"}</Pill></td>
                  <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{s.cohorts?.name ?? "—"}</td>
                  <td className="px-3.5 py-2.5 border-b border-border"><Pill color={getPillColor(s.stage, stageColor)}>{s.stage ?? "—"}</Pill></td>
                  <td className="px-3.5 py-2.5 border-b border-border font-mono text-primary">{s.score != null ? `${s.score}/100` : "—"}</td>
                  <td className="px-3.5 py-2.5 border-b border-border text-foreground">{s.country ?? "—"}</td>
                  <td className="px-3.5 py-2.5 border-b border-border"><GhButton variant="ghost">→</GhButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GhCard>
    </motion.div>
  );
}
