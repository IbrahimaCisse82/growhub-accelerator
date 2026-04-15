import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Risk {
  id: string;
  title: string;
  impact?: number;
  probability?: number;
  level: string;
  status?: string;
}

interface Props {
  risks: Risk[];
}

const LABELS_Y = ["Très faible", "Faible", "Moyen", "Élevé", "Très élevé"];
const LABELS_X = ["Très faible", "Faible", "Moyen", "Élevé", "Très élevé"];

function cellColor(impact: number, probability: number): string {
  const score = impact * probability;
  if (score >= 16) return "bg-destructive/20 border-destructive/40";
  if (score >= 9) return "bg-amber-500/20 border-amber-500/40";
  if (score >= 4) return "bg-yellow-400/15 border-yellow-400/40";
  return "bg-green-500/15 border-green-500/40";
}

function dotColor(impact: number, probability: number): string {
  const score = impact * probability;
  if (score >= 16) return "bg-destructive";
  if (score >= 9) return "bg-amber-500";
  if (score >= 4) return "bg-yellow-500";
  return "bg-green-500";
}

export default function RiskMatrix({ risks }: Props) {
  const grid = useMemo(() => {
    const m: Record<string, Risk[]> = {};
    for (let i = 1; i <= 5; i++)
      for (let p = 1; p <= 5; p++)
        m[`${i}-${p}`] = [];
    risks.forEach((r) => {
      const i = Math.min(5, Math.max(1, r.impact ?? 3));
      const p = Math.min(5, Math.max(1, r.probability ?? 3));
      m[`${i}-${p}`].push(r);
    });
    return m;
  }, [risks]);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Matrice de Risques</span>
        <span className="text-[10px] text-muted-foreground">(Impact × Probabilité)</span>
      </div>

      <div className="flex">
        {/* Y axis label */}
        <div className="flex flex-col items-center justify-center mr-1">
          <span className="text-[9px] font-mono text-muted-foreground [writing-mode:vertical-lr] rotate-180 tracking-widest uppercase">Impact →</span>
        </div>

        <div className="flex-1">
          {/* Grid rows (impact 5 at top → 1 at bottom) */}
          <div className="grid grid-rows-5 gap-0.5">
            {[5, 4, 3, 2, 1].map((impact) => (
              <div key={impact} className="grid grid-cols-[40px_repeat(5,1fr)] gap-0.5">
                <div className="flex items-center justify-center">
                  <span className="text-[9px] font-mono text-muted-foreground">{LABELS_Y[impact - 1]}</span>
                </div>
                {[1, 2, 3, 4, 5].map((prob) => {
                  const key = `${impact}-${prob}`;
                  const cellRisks = grid[key];
                  return (
                    <div
                      key={key}
                      className={`relative min-h-[44px] rounded border ${cellColor(impact, prob)} flex items-center justify-center gap-0.5 flex-wrap p-1`}
                    >
                      {cellRisks.map((r) => (
                        <TooltipProvider key={r.id} delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={`w-3 h-3 rounded-full ${dotColor(impact, prob)} border border-background shadow-sm cursor-pointer hover:scale-125 transition-transform`} />
                            </TooltipTrigger>
                            <TooltipContent className="bg-card border-border text-foreground max-w-[200px]">
                              <p className="text-xs font-semibold">{r.title}</p>
                              <p className="text-[10px] text-muted-foreground">Impact: {impact} · Probabilité: {prob}</p>
                              <p className="text-[10px] text-muted-foreground">Score: {impact * prob}/25</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                      {cellRisks.length === 0 && (
                        <span className="text-[8px] text-muted-foreground/30 font-mono">{impact * prob}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* X axis labels */}
          <div className="grid grid-cols-[40px_repeat(5,1fr)] gap-0.5 mt-1">
            <div />
            {LABELS_X.map((l) => (
              <div key={l} className="text-center text-[9px] font-mono text-muted-foreground">{l}</div>
            ))}
          </div>
          <div className="text-center mt-1">
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">← Probabilité →</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        {[
          { label: "Critique (≥16)", cls: "bg-destructive" },
          { label: "Élevé (9-15)", cls: "bg-amber-500" },
          { label: "Moyen (4-8)", cls: "bg-yellow-500" },
          { label: "Faible (1-3)", cls: "bg-green-500" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${l.cls}`} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
