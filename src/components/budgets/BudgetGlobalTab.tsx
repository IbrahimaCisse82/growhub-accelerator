import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/shared/StatCard";

const WP_ORDER = ["WP1", "WP2", "WP3", "WP4", "GC", "SE"];
const WP_LABELS: Record<string, string> = {
  WP1: "WP1 — Renforcement des compétences & structuration",
  WP2: "WP2 — Accès aux marchés & développement commercial",
  WP3: "WP3 — Accès au financement & investissement",
  WP4: "WP4 — Innovation, durabilité & écosystème",
  GC: "Gouvernance & Coordination générale",
  SE: "Suivi & Évaluation",
};

function useProjectBudgetLines(projectId: string | null) {
  return useQuery({
    queryKey: ["project_budget_lines", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_budget_lines")
        .select("*")
        .eq("project_id", projectId!)
        .order("code", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

interface Props {
  projectId: string | null;
  currency: string;
  rate: number;
  fmt: (n: number) => string;
}

export default function BudgetGlobalTab({ projectId, currency, rate, fmt }: Props) {
  const { data: lines, isLoading } = useProjectBudgetLines(projectId);

  if (!projectId) return <p className="text-center text-muted-foreground py-8 text-sm">Sélectionnez un projet</p>;
  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;

  // Filter out legacy Annexe 1b lines (section A/B) — only show WP-based lines
  const wpLines = lines?.filter(l => WP_ORDER.includes(l.section || "")) ?? [];

  if (!wpLines.length) return <p className="text-center text-muted-foreground py-8 text-sm">Aucune donnée budgétaire. Créez un projet pour générer le budget.</p>;

  const c = (n: number) => n * rate; // currency conversion

  // Group by WP section
  const grouped = WP_ORDER.map(wp => ({
    wp,
    label: WP_LABELS[wp] || wp,
    lines: wpLines.filter(l => l.section === wp),
  })).filter(g => g.lines.length > 0);

  // Sous-totals per WP
  const wpTotals = grouped.map(g => ({
    ...g,
    y1: g.lines.reduce((s, l) => s + (l.year1 || 0), 0),
    y2: g.lines.reduce((s, l) => s + (l.year2 || 0), 0),
    y3: g.lines.reduce((s, l) => s + (l.year3 || 0), 0),
    y4: g.lines.reduce((s, l) => s + (l.year4 || 0), 0),
    y5: g.lines.reduce((s, l) => s + (l.year5 || 0), 0),
    total: g.lines.reduce((s, l) => s + (l.total_cost || 0), 0),
  }));

  const grandTotal = wpTotals.reduce((s, w) => s + w.total, 0);
  const imprevu = grandTotal * 0.07;
  const totalGeneral = grandTotal + imprevu;
  const yearTotals = [1, 2, 3, 4, 5].map(y =>
    wpTotals.reduce((s, w) => s + (w as any)[`y${y}`], 0)
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard label="Coûts directs" value={`${fmt(c(grandTotal))} ${currency}`} note={`${wpLines.length} postes`} color="blue" />
        <StatCard label="Imprévus (7%)" value={`${fmt(c(imprevu))} ${currency}`} note="Standard bailleurs" color="amber" />
        <StatCard label="TOTAL GÉNÉRAL" value={`${fmt(c(totalGeneral))} ${currency}`} note="5 ans (2026–2030)" color="green" />
        <StatCard label="Consommation" value={`${grouped.length} WP`} note={`${wpLines.length} lignes`} color="purple" />
      </div>

      {/* Header banner */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-primary/5">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">
            Budget Prévisionnel — Récapitulatif Global par Composante et par Année (2026–2030)
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Sénégal — Régions de Kédougou, Kolda & Ziguinchor | Durée : 5 ans | Montants en {currency}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-secondary">
                {["Code", "Composante / Catégorie", "An.1\n2026", "An.2\n2027", "An.3\n2028", "An.4\n2029", "An.5\n2030", "TOTAL\n5 ANS", "% Budget", "Genre", "Climat", "Notes"].map(h => (
                  <th key={h} className="px-2.5 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground whitespace-pre-line">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wpTotals.map(g => (
                <>
                  {/* WP header */}
                  <tr key={`h-${g.wp}`}>
                    <td colSpan={12} className="px-3 py-2 bg-primary/10 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">
                      {g.label}
                    </td>
                  </tr>
                  {/* Lines */}
                  {g.lines.map((l: any) => (
                    <tr key={l.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-2.5 py-1.5">
                        <span className="font-mono text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{l.code}</span>
                      </td>
                      <td className="px-2.5 py-1.5 text-foreground max-w-[220px] truncate" title={l.label}>{l.label}</td>
                      {[l.year1, l.year2, l.year3, l.year4, l.year5].map((v: number, i: number) => (
                        <td key={i} className="px-2.5 py-1.5 text-right font-mono text-foreground text-[11px]">{fmt(c(v || 0))}</td>
                      ))}
                      <td className="px-2.5 py-1.5 text-right">
                        <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold text-[11px]">{fmt(c(l.total_cost || 0))}</span>
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono text-muted-foreground text-[11px]">
                        {grandTotal > 0 ? (((l.total_cost || 0) / grandTotal) * 100).toFixed(1) : "0"}%
                      </td>
                      <td className="px-2.5 py-1.5 text-center text-[11px]">{l.marker_gender || "○"}</td>
                      <td className="px-2.5 py-1.5 text-center text-[11px]">{l.marker_climate || "○"}</td>
                      <td className="px-2.5 py-1.5 text-muted-foreground text-[11px] max-w-[180px] truncate" title={l.notes || ""}>{l.notes || ""}</td>
                    </tr>
                  ))}
                  {/* WP subtotal */}
                  <tr key={`st-${g.wp}`} className="bg-secondary/60">
                    <td colSpan={2} className="px-2.5 py-1.5 text-right text-[11px] font-bold text-foreground">SOUS-TOTAL {g.wp}</td>
                    {[g.y1, g.y2, g.y3, g.y4, g.y5].map((v, i) => (
                      <td key={i} className="px-2.5 py-1.5 text-right font-mono font-bold text-foreground text-[11px]">{fmt(c(v))}</td>
                    ))}
                    <td className="px-2.5 py-1.5 text-right font-mono font-bold text-primary text-[11px]">{fmt(c(g.total))}</td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-muted-foreground text-[11px]">
                      {grandTotal > 0 ? ((g.total / grandTotal) * 100).toFixed(1) : "0"}%
                    </td>
                    <td colSpan={3} />
                  </tr>
                </>
              ))}

              {/* Spacer */}
              <tr><td colSpan={12} className="h-2" /></tr>

              {/* Sous-total coûts directs */}
              <tr className="bg-secondary/80">
                <td colSpan={2} className="px-2.5 py-2 text-right text-[11px] font-bold text-foreground uppercase">Sous-total coûts directs</td>
                {yearTotals.map((v, i) => (
                  <td key={i} className="px-2.5 py-2 text-right font-mono font-bold text-foreground">{fmt(c(v))}</td>
                ))}
                <td className="px-2.5 py-2 text-right font-mono font-bold text-primary">{fmt(c(grandTotal))}</td>
                <td className="px-2.5 py-2 text-right font-mono font-bold text-foreground">
                  {grandTotal > 0 ? ((grandTotal / grandTotal) * 100).toFixed(1) : "0"}%
                </td>
                <td colSpan={3} />
              </tr>

              {/* Imprévus */}
              <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                <td colSpan={2} className="px-2.5 py-2 text-right text-[11px] font-bold text-foreground">Imprévus & Contingences (7%)</td>
                {yearTotals.map((v, i) => (
                  <td key={i} className="px-2.5 py-2 text-right font-mono text-foreground">{fmt(c(v * 0.07))}</td>
                ))}
                <td className="px-2.5 py-2 text-right font-mono font-bold text-foreground">{fmt(c(imprevu))}</td>
                <td className="px-2.5 py-2 text-right font-mono text-muted-foreground">
                  {grandTotal > 0 ? ((imprevu / totalGeneral) * 100).toFixed(1) : "0"}%
                </td>
                <td colSpan={3} className="px-2.5 py-2 text-muted-foreground text-[10px]">Standard bailleurs (AFD, UE, Enabel) — fourchette 5-10%</td>
              </tr>

              {/* Total général */}
              <tr className="bg-foreground/5">
                <td colSpan={2} className="px-2.5 py-2.5 text-right text-xs font-bold text-foreground uppercase">Total Général Projet (5 ans)</td>
                {yearTotals.map((v, i) => (
                  <td key={i} className="px-2.5 py-2.5 text-right font-mono font-bold text-foreground">{fmt(c(v * 1.07))}</td>
                ))}
                <td className="px-2.5 py-2.5 text-right font-mono text-sm font-bold text-primary">{fmt(c(totalGeneral))}</td>
                <td colSpan={4} />
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-border bg-secondary/30 space-y-1">
          <p className="text-[10px] font-mono text-muted-foreground font-bold uppercase">Légende des marqueurs :</p>
          <p className="text-[10px] text-muted-foreground">✓✓ = Contribution principale | ✓ = Contribution significative | ○ = Non applicable</p>
          <p className="text-[10px] text-muted-foreground">Marqueur Genre (OCDE-DAC) : Toutes les activités intègrent l'approche genre ; les actions ciblées femmes/jeunes sont identifiées en WP1, WP2, WP3.</p>
          <p className="text-[10px] text-muted-foreground">Marqueur Climat (OCDE-DAC) : Les activités ENR, adaptation climatique, gestion durable des ressources sont tracées (WP3, WP4).</p>
          <p className="text-[10px] text-muted-foreground">Montants en {currency} — Taux de référence : 1 USD = 600 FCFA (BCEAO 2025). Révision annuelle possible.</p>
        </div>
      </div>
    </div>
  );
}
