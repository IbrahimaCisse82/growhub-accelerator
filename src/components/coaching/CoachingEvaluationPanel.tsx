import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import GhButton from "@/components/shared/GhButton";

const EVAL_TOPICS = [
  { key: "product", label: "Product", icon: "📦", color: "bg-gh-blue/15 text-gh-blue" },
  { key: "team", label: "Team", icon: "👥", color: "bg-gh-purple/15 text-gh-purple" },
  { key: "finance", label: "Finance", icon: "💰", color: "bg-gh-green/15 text-gh-green" },
  { key: "market", label: "Market", icon: "📊", color: "bg-gh-amber/15 text-gh-amber" },
  { key: "traction", label: "Traction", icon: "🚀", color: "bg-gh-rose/15 text-gh-rose" },
  { key: "strategy", label: "Strategy", icon: "🎯", color: "bg-primary/15 text-primary" },
];

interface Props {
  sessionId: string;
  existingScores?: Record<string, number>;
  existingComment?: string;
}

export default function CoachingEvaluationPanel({ sessionId, existingScores, existingComment }: Props) {
  const qc = useQueryClient();
  const [scores, setScores] = useState<Record<string, number>>(existingScores ?? Object.fromEntries(EVAL_TOPICS.map(t => [t.key, 5])));
  const [comment, setComment] = useState(existingComment ?? "");

  const saveEval = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coaching_sessions").update({
        notes: JSON.stringify({ evaluation_scores: scores, evaluation_comment: comment }),
      }).eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coaching-sessions"] });
      toast({ title: "✓ Évaluation enregistrée" });
    },
  });

  const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Évaluation par thématique</div>
        <div className="text-[13px] font-bold text-primary font-mono">{avgScore.toFixed(1)}/10</div>
      </div>

      <div className="space-y-3">
        {EVAL_TOPICS.map(topic => (
          <div key={topic.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${topic.color}`}>{topic.icon} {topic.label}</span>
              </div>
              <span className="font-mono text-[12px] text-foreground font-semibold">{scores[topic.key]}/10</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={scores[topic.key]}
              onChange={e => setScores(prev => ({ ...prev, [topic.key]: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Commentaires d'évaluation globale…"
        className="w-full bg-surface-2 border border-border rounded-lg p-3 text-[12px] text-foreground resize-none h-20"
      />

      <GhButton onClick={() => saveEval.mutate()} disabled={saveEval.isPending}>
        {saveEval.isPending ? "Enregistrement…" : "Enregistrer l'évaluation"}
      </GhButton>
    </div>
  );
}
