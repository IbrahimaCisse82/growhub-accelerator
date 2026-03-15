import { useState } from "react";
import { ChevronDown, ChevronRight, Target, Activity, CheckCircle2, BarChart3, Flag } from "lucide-react";
import Pill from "@/components/shared/Pill";
import { Progress } from "@/components/ui/progress";

export interface WorkPackageData {
  number: number;
  title: string;
  objective: string;
  activities: string[];
  results: string[];
  indicators: { name: string; current: number; target: number; unit?: string }[];
  milestones: { title: string; status: string; dueDate?: string }[];
}

const wpColors: Record<number, string> = {
  1: "from-primary/80 to-primary",
  2: "from-accent/80 to-accent",
  3: "from-emerald-500/80 to-emerald-600",
  4: "from-amber-500/80 to-amber-600",
};

const milestoneStatusMap: Record<string, { label: string; color: "green" | "blue" | "amber" | "gray" }> = {
  completed: { label: "Terminé", color: "green" },
  in_progress: { label: "En cours", color: "blue" },
  pending: { label: "En attente", color: "amber" },
};

export default function WorkPackageCard({ wp }: { wp: WorkPackageData }) {
  const [open, setOpen] = useState(true);
  const gradient = wpColors[wp.number] ?? "from-primary/80 to-primary";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 sm:p-5 text-left hover:bg-secondary/30 transition-colors cursor-pointer"
      >
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>
          WP{wp.number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm sm:text-base font-bold text-foreground leading-tight truncate">
            {wp.title}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {wp.activities.length} activité{wp.activities.length > 1 ? "s" : ""} · {wp.indicators.length} indicateur{wp.indicators.length > 1 ? "s" : ""} · {wp.milestones.length} jalon{wp.milestones.length > 1 ? "s" : ""}
          </p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border">
          {/* Objective */}
          <Section icon={<Target className="w-3.5 h-3.5" />} title="Objectif spécifique">
            <p className="text-[13px] text-foreground/85 leading-relaxed">{wp.objective}</p>
          </Section>

          {/* Activities */}
          {wp.activities.length > 0 && (
            <Section icon={<Activity className="w-3.5 h-3.5" />} title="Activités">
              <ul className="space-y-1.5">
                {wp.activities.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/85">
                    <span className="text-primary font-mono text-[11px] mt-0.5 shrink-0 font-semibold">A{wp.number}.{i + 1}</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Results */}
          {wp.results.length > 0 && (
            <Section icon={<CheckCircle2 className="w-3.5 h-3.5" />} title="Résultats attendus">
              <ul className="space-y-1.5">
                {wp.results.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/85">
                    <span className="text-accent font-mono text-[11px] mt-0.5 shrink-0 font-semibold">R{wp.number}.{i + 1}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Indicators */}
          {wp.indicators.length > 0 && (
            <Section icon={<BarChart3 className="w-3.5 h-3.5" />} title="Indicateurs clés">
              <div className="space-y-2.5">
                {wp.indicators.map((ind, i) => {
                  const pct = ind.target > 0 ? Math.round((ind.current / ind.target) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] text-muted-foreground shrink-0">I{wp.number}.{i + 1}</span>
                        <span className="text-[12px] text-foreground font-medium flex-1 truncate">{ind.name}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">{ind.current}/{ind.target} {ind.unit ?? ""}</span>
                      </div>
                      <Progress value={Math.min(pct, 100)} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Milestones */}
          {wp.milestones.length > 0 && (
            <Section icon={<Flag className="w-3.5 h-3.5" />} title="Jalons">
              <ul className="space-y-2">
                {wp.milestones.map((m, i) => {
                  const st = milestoneStatusMap[m.status] ?? milestoneStatusMap.pending;
                  return (
                    <li key={i} className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground shrink-0">M{wp.number}.{i + 1}</span>
                      <span className="text-[12px] text-foreground flex-1">{m.title}</span>
                      <Pill color={st.color}>{st.label}</Pill>
                      {m.dueDate && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(m.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 sm:px-5 py-3.5">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-muted-foreground">{icon}</span>
        <h4 className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{title}</h4>
      </div>
      {children}
    </div>
  );
}
