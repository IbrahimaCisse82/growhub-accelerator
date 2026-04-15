import { useBudgetDetails } from "@/hooks/useBudgetDetails";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/shared/StatCard";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

const CATEGORY_RUBRIQUE: Record<string, string> = {
  "Ressources Humaines": "Salaires & Indemnités",
  "Formation/Animation": "Formation",
  "Consultants/Études": "Services Techniques",
  "Prestations-Experts": "Services Techniques",
  "Subventions/Fonds": "Transferts",
  "Équipements/TIC": "Investissements",
  "Infrastructure TIC": "Investissements",
  "Infrastructures": "Investissements",
  "Événementiel": "Activités Opérationnelles",
  "Animation/Réseaux": "Activités Opérationnelles",
  "Transport/Logistique": "Logistique",
  "Fonctionnement": "Fonctionnement",
  "Communication": "Communication",
  "Évaluation Externe": "S&E",
  "Audit/Contrôle": "Audit",
  "R&D Appliquée": "Investissements",
  "Certification/Normes": "Services Techniques",
  "Appui Technique": "Services Techniques",
  "Appui Juridique": "Services Techniques",
  "Actions Genre": "Activités Opérationnelles",
};

export default function BudgetCategoryTab({ projectId }: { projectId: string | null }) {
  const { data: details, isLoading } = useBudgetDetails(projectId);

  if (!projectId) return <p className="text-center text-muted-foreground py-8 text-sm">Sélectionnez un projet</p>;
  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;
  if (!details?.length) return <p className="text-center text-muted-foreground py-8 text-sm">Aucun détail budgétaire</p>;

  // Aggregate by category
  const catMap = new Map<string, { rubrique: string; y1: number; y2: number; y3: number; y4: number; y5: number; total: number }>();
  details.forEach(d => {
    const cat = d.category || "Autre";
    const existing = catMap.get(cat) || { rubrique: CATEGORY_RUBRIQUE[cat] || "Autre", y1: 0, y2: 0, y3: 0, y4: 0, y5: 0, total: 0 };
    existing.y1 += d.year_1 || 0;
    existing.y2 += d.year_2 || 0;
    existing.y3 += d.year_3 || 0;
    existing.y4 += d.year_4 || 0;
    existing.y5 += d.year_5 || 0;
    existing.total += d.total || 0;
    catMap.set(cat, existing);
  });

  const categories = [...catMap.entries()].sort((a, b) => b[1].total - a[1].total);
  const grandTotal = categories.reduce((s, [, v]) => s + v.total, 0);
  const imprevu = grandTotal * 0.07;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard label="Coûts directs" value={`${fmt(grandTotal)} USD`} note={`${categories.length} catégories`} color="blue" />
        <StatCard label="Imprévus (7%)" value={`${fmt(imprevu)} USD`} note="Standard bailleurs" color="amber" />
        <StatCard label="TOTAL GÉNÉRAL" value={`${fmt(grandTotal + imprevu)} USD`} note="" color="green" />
        <StatCard label="Catégorie n°1" value={categories[0]?.[0] || "—"} note={`${fmt(categories[0]?.[1].total || 0)} USD`} color="purple" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-bold text-foreground">Récapitulatif par catégorie de dépenses — Vue calculée</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-secondary">
                {["#", "Catégorie de Dépenses", "Rubrique OCDE-DAC", "Année 1", "Année 2", "Année 3", "Année 4", "Année 5", "TOTAL", "% Total"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(([cat, v], i) => (
                <tr key={cat} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-2 font-mono text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 text-foreground font-medium">{cat}</td>
                  <td className="px-3 py-2 text-muted-foreground text-[11px]">{v.rubrique}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(v.y1)}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(v.y2)}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(v.y3)}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(v.y4)}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(v.y5)}</td>
                  <td className="px-3 py-2 text-right"><span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{fmt(v.total)}</span></td>
                  <td className="px-3 py-2 text-right font-mono text-muted-foreground">{grandTotal > 0 ? ((v.total / grandTotal) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
              <tr className="bg-secondary/60">
                <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-bold text-foreground">SOUS-TOTAL COÛTS DIRECTS</td>
                {[categories.reduce((s, [, v]) => s + v.y1, 0), categories.reduce((s, [, v]) => s + v.y2, 0), categories.reduce((s, [, v]) => s + v.y3, 0), categories.reduce((s, [, v]) => s + v.y4, 0), categories.reduce((s, [, v]) => s + v.y5, 0)].map((v, i) => (
                  <td key={i} className="px-3 py-2 text-right font-mono font-bold text-foreground">{fmt(v)}</td>
                ))}
                <td className="px-3 py-2 text-right font-mono font-bold text-primary">{fmt(grandTotal)}</td>
                <td />
              </tr>
              <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-bold text-foreground">IMPRÉVUS (7%)</td>
                {[categories.reduce((s, [, v]) => s + v.y1, 0), categories.reduce((s, [, v]) => s + v.y2, 0), categories.reduce((s, [, v]) => s + v.y3, 0), categories.reduce((s, [, v]) => s + v.y4, 0), categories.reduce((s, [, v]) => s + v.y5, 0)].map((v, i) => (
                  <td key={i} className="px-3 py-2 text-right font-mono text-foreground">{fmt(v * 0.07)}</td>
                ))}
                <td className="px-3 py-2 text-right font-mono font-bold text-foreground">{fmt(imprevu)}</td>
                <td />
              </tr>
              <tr className="bg-foreground/5">
                <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-bold text-foreground uppercase">TOTAL GÉNÉRAL</td>
                {[categories.reduce((s, [, v]) => s + v.y1, 0), categories.reduce((s, [, v]) => s + v.y2, 0), categories.reduce((s, [, v]) => s + v.y3, 0), categories.reduce((s, [, v]) => s + v.y4, 0), categories.reduce((s, [, v]) => s + v.y5, 0)].map((v, i) => (
                  <td key={i} className="px-3 py-2.5 text-right font-mono font-bold text-foreground">{fmt(v * 1.07)}</td>
                ))}
                <td className="px-3 py-2.5 text-right font-mono text-sm font-bold text-primary">{fmt(grandTotal + imprevu)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
