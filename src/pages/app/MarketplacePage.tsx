import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useStartups } from "@/hooks/useStartups";
import { useNavigate } from "react-router-dom";

const sectorColor: Record<string, "green" | "blue" | "purple" | "rose" | "amber" | "gray"> = {
  fintech: "blue", agritech: "green", edtech: "purple", healthtech: "rose", cleantech: "green", logistique: "amber",
};
const stageColor: Record<string, "green" | "blue" | "amber" | "gray"> = {
  mvp: "amber", incubation: "amber", accélération: "green", croissance: "blue", scale: "green",
};
function pill(v: string | null, map: Record<string, any>, fb = "gray" as const) {
  return !v ? fb : map[v.toLowerCase()] ?? fb;
}

type ViewMode = "grid" | "list";

export default function MarketplacePage() {
  const { data: startups, isLoading } = useStartups();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  const sectors = useMemo(() => [...new Set(startups?.map(s => s.sector).filter(Boolean) as string[])].sort(), [startups]);
  const stages = useMemo(() => [...new Set(startups?.map(s => s.stage).filter(Boolean) as string[])].sort(), [startups]);

  const filtered = useMemo(() => {
    return startups?.filter(s => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !(s.description ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (sectorFilter && s.sector !== sectorFilter) return false;
      if (stageFilter && s.stage !== stageFilter) return false;
      return true;
    });
  }, [startups, search, sectorFilter, stageFilter]);

  const totalStartups = startups?.length ?? 0;
  const sectorsCount = sectors.length;
  const avgScore = startups?.length ? Math.round((startups.reduce((a, s) => a + (s.score ?? 0), 0) / startups.length)) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Marketplace Entreprises" subtitle="Annuaire enrichi des entreprises accompagnées — recherche, filtres et profils" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Entreprises" value={String(totalStartups)} note="" color="blue" />
        <StatCard label="Secteurs" value={String(sectorsCount)} note="" color="purple" />
        <StatCard label="Score moyen" value={`${avgScore}/100`} note="" color="green" />
        <StatCard label="Résultats" value={String(filtered?.length ?? 0)} note="" color="amber" />
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <input
          className="bg-surface-2 border border-border rounded-lg px-3 py-[7px] text-[12.5px] text-foreground outline-none focus:border-primary/50 w-[180px] sm:w-[240px] placeholder:text-muted-foreground"
          placeholder="Rechercher une entreprise…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="bg-surface-2 border border-border rounded-lg px-3 py-[7px] text-[12.5px] text-foreground outline-none focus:border-primary/50"
          value={sectorFilter}
          onChange={e => setSectorFilter(e.target.value)}
        >
          <option value="">Tous les secteurs</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="bg-surface-2 border border-border rounded-lg px-3 py-[7px] text-[12.5px] text-foreground outline-none focus:border-primary/50"
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
        >
          <option value="">Tous les stades</option>
          {stages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex border border-border rounded-lg overflow-hidden">
          {(["grid", "list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${view === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>
              {v === "grid" ? "Grille" : "Liste"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[200px] rounded-xl" />)}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 text-sm">Aucune entreprise ne correspond aux filtres</div>
      ) : view === "grid" ? (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered?.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-2 border border-border rounded-[12px] p-4 cursor-pointer hover:border-primary/30 transition-all group"
              onClick={() => navigate(`/app/entreprises/${s.id}`)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-foreground truncate group-hover:text-primary transition-colors">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.city ?? s.country ?? "—"}</div>
                </div>
                {s.score != null && (
                  <div className="font-mono text-[11px] text-primary bg-primary/10 rounded-md px-1.5 py-0.5">{s.score}/100</div>
                )}
              </div>
              {s.description && (
                <p className="text-[11.5px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{s.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                <Pill color={pill(s.sector, sectorColor)}>{s.sector ?? "—"}</Pill>
                <Pill color={pill(s.stage, stageColor)}>{s.stage ?? "—"}</Pill>
                {s.cohorts?.name && <Pill color="gray">{s.cohorts.name}</Pill>}
              </div>
              {s.website && (
                <a
                  href={s.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1 mt-3 text-[10.5px] text-primary hover:underline"
                >
                  🔗 Site web
                </a>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        /* List view */
        <GhCard title="Entreprises" badge={String(filtered?.length ?? 0)} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-surface-2">
                  {["Entreprise", "Secteur", "Stade", "Cohorte", "Score", "Pays", ""].map(h => (
                    <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered?.map(s => (
                  <tr key={s.id} onClick={() => navigate(`/app/entreprises/${s.id}`)} className="hover:bg-surface-2 transition-colors cursor-pointer">
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] flex-shrink-0">{s.name.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div className="font-semibold text-foreground">{s.name}</div>
                          <div className="text-[10.5px] text-muted-foreground">{s.city ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border"><Pill color={pill(s.sector, sectorColor)}>{s.sector ?? "—"}</Pill></td>
                    <td className="px-3.5 py-2.5 border-b border-border"><Pill color={pill(s.stage, stageColor)}>{s.stage ?? "—"}</Pill></td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{s.cohorts?.name ?? "—"}</td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-primary">{s.score != null ? `${s.score}/100` : "—"}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-foreground">{s.country ?? "—"}</td>
                    <td className="px-3.5 py-2.5 border-b border-border"><GhButton variant="ghost" size="sm">Voir →</GhButton></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GhCard>
      )}
    </motion.div>
  );
}
