import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import GhButton from "@/components/shared/GhButton";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

type Mode = "risk_analysis" | "mentor_match" | "summary" | "next_actions";

const MODE_LABELS: Record<Mode, string> = {
  risk_analysis: "🚨 Analyse des risques",
  mentor_match: "🤝 Suggestion mentors",
  summary: "📝 Résumé exécutif",
  next_actions: "✅ Prochaines actions",
};

interface AISuggestPanelProps {
  mode: Mode;
  context: Record<string, any>;
  title?: string;
}

export default function AISuggestPanel({ mode, context, title }: AISuggestPanelProps) {
  const [result, setResult] = useState<any>(null);

  const generate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-suggest", {
        body: { mode, context },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => setResult(data?.result ?? null),
    onError: (e: Error) => toast({ title: "Erreur IA", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="border border-border rounded-xl p-4 bg-gradient-to-br from-primary/5 to-transparent space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <div className="text-[12px] font-semibold text-foreground">{title ?? MODE_LABELS[mode]}</div>
        </div>
        <GhButton size="sm" variant="primary" onClick={() => generate.mutate()} disabled={generate.isPending}>
          {generate.isPending ? <><Loader2 size={11} className="mr-1 animate-spin" />Analyse…</> : "✨ Générer"}
        </GhButton>
      </div>

      {!result && !generate.isPending && (
        <div className="text-[11px] text-muted-foreground italic">
          Clique sur Générer pour obtenir des suggestions IA contextuelles.
        </div>
      )}

      {result && (
        <div className="space-y-2 text-[12px]">
          {mode === "risk_analysis" && Array.isArray(result.risks) && result.risks.map((r: any, i: number) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-mono uppercase px-1.5 py-px rounded ${r.level === "critical" ? "bg-gh-rose/15 text-gh-rose" : r.level === "high" ? "bg-gh-amber/15 text-gh-amber" : "bg-gh-blue/15 text-gh-blue"}`}>
                  {r.level}
                </span>
                <div className="font-semibold text-foreground">{r.title}</div>
              </div>
              <div className="text-muted-foreground">{r.description}</div>
              <div className="text-[11px] text-foreground"><strong>→ Mitigation :</strong> {r.mitigation}</div>
            </div>
          ))}

          {mode === "mentor_match" && Array.isArray(result.matches) && result.matches.map((m: any, i: number) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-foreground">{m.mentor_name}</div>
                <div className="text-[11px] font-mono text-primary">{m.score}/100</div>
              </div>
              <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-0.5">
                {(m.reasons ?? []).map((r: string, j: number) => <li key={j}>{r}</li>)}
              </ul>
            </div>
          ))}

          {mode === "summary" && (
            <div className="space-y-2">
              <div className="bg-card border border-border rounded-lg p-3 text-foreground">{result.summary}</div>
              {Array.isArray(result.highlights) && result.highlights.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-gh-green uppercase mb-1">Points forts</div>
                  <ul className="text-[11px] text-foreground list-disc list-inside space-y-0.5">
                    {result.highlights.map((h: string, i: number) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(result.concerns) && result.concerns.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-gh-amber uppercase mb-1">Points d'attention</div>
                  <ul className="text-[11px] text-foreground list-disc list-inside space-y-0.5">
                    {result.concerns.map((c: string, i: number) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {mode === "next_actions" && Array.isArray(result.actions) && result.actions.map((a: any, i: number) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 space-y-1 flex items-start gap-2">
              <span className={`text-[9px] font-mono uppercase px-1.5 py-px rounded mt-0.5 ${a.priority === "high" ? "bg-gh-rose/15 text-gh-rose" : a.priority === "medium" ? "bg-gh-amber/15 text-gh-amber" : "bg-muted text-muted-foreground"}`}>
                {a.priority}
              </span>
              <div className="flex-1">
                <div className="font-semibold text-foreground">{a.title}</div>
                <div className="text-[11px] text-muted-foreground">{a.why}</div>
              </div>
            </div>
          ))}

          {result.raw && (
            <div className="bg-muted rounded-lg p-3 text-[11px] font-mono whitespace-pre-wrap text-foreground">
              {result.raw}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
