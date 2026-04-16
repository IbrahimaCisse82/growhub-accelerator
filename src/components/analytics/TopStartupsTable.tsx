import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import GhCard from "@/components/shared/GhCard";
import Pill from "@/components/shared/Pill";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function TopStartupsTable() {
  const { data: startups } = useQuery({
    queryKey: ["top-startups-health"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("id, name, sector, stage, score, country")
        .order("score", { ascending: false, nullsFirst: false })
        .limit(10);
      if (error) throw error;

      // Compute health scores via RPC
      const results = await Promise.all(
        (data ?? []).map(async (s) => {
          const { data: hs } = await supabase.rpc("compute_startup_health_score", { p_startup_id: s.id });
          return { ...s, healthScore: typeof hs === "number" ? hs : 0 };
        })
      );
      return results.sort((a, b) => b.healthScore - a.healthScore);
    },
  });

  const healthColor = (score: number): "green" | "amber" | "red" => {
    if (score >= 60) return "green";
    if (score >= 30) return "amber";
    return "red";
  };

  return (
    <GhCard title="Top 10 Entreprises — Health Score">
      {!startups || startups.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-6">Aucune donnée</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 px-2 font-medium">#</th>
                <th className="py-2 px-2 font-medium">Entreprise</th>
                <th className="py-2 px-2 font-medium">Secteur</th>
                <th className="py-2 px-2 font-medium">Stade</th>
                <th className="py-2 px-2 font-medium text-right">Health Score</th>
              </tr>
            </thead>
            <tbody>
              {startups.map((s, i) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-2 px-2 font-mono text-muted-foreground">{i + 1}</td>
                  <td className="py-2 px-2 font-semibold text-foreground">{s.name}</td>
                  <td className="py-2 px-2 text-muted-foreground">{s.sector ?? "—"}</td>
                  <td className="py-2 px-2"><Pill color={s.stage === "growth" || s.stage === "scale" ? "green" : "blue"}>{s.stage ?? "—"}</Pill></td>
                  <td className="py-2 px-2 text-right">
                    <Pill color={healthColor(s.healthScore)}>{s.healthScore}/100</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GhCard>
  );
}
