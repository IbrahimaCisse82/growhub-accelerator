import { useBudgetDetails } from "@/hooks/useBudgetDetails";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/shared/StatCard";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

// Map detail-level categories to the 12 consolidated OCDE-DAC categories from Excel F3
const CATEGORY_CONSOLIDATION: Record<string, string> = {
  "Ressources Humaines": "Ressources Humaines (personnel clé & terrain)",
  "Formation/Animation": "Formation & Renforcement des Capacités",
  "Consultants/Études": "Consultants & Experts externes",
  "Prestations-Experts": "Consultants & Experts externes",
  "Appui Juridique": "Consultants & Experts externes",
  "Certification/Normes": "Formation & Renforcement des Capacités",
  "Appui Technique": "Formation & Renforcement des Capacités",
  "Actions Genre": "Formation & Renforcement des Capacités",
  "Subventions/Fonds": "Subventions & Fonds d'Amorçage (productifs)",
  "Équipements/TIC": "Équipements, TIC & Outils numériques",
  "R&D Appliquée": "Équipements, TIC & Outils numériques",
  "Infrastructure TIC": "Infrastructures (Hub, plateformes)",
  "Infrastructures": "Infrastructures (Hub, plateformes)",
  "Événementiel": "Événementiel, Réseautage & Foires",
  "Animation/Réseaux": "Événementiel, Réseautage & Foires",
  "Transport/Logistique": "Transport & Logistique terrain",
  "Fonctionnement": "Fonctionnement & Administration",
  "Communication": "Communication & Visibilité",
  "Évaluation Externe": "Suivi-Évaluation & Études",
  "Audit/Contrôle": "Audit & Contrôle externe",
};

const CATEGORY_ORDER: { name: string; rubrique: string }[] = [
  { name: "Ressources Humaines (personnel clé & terrain)", rubrique: "Salaires & Indemnités" },
  { name: "Formation & Renforcement des Capacités", rubrique: "Formation" },
  { name: "Consultants & Experts externes", rubrique: "Services Techniques" },
  { name: "Subventions & Fonds d'Amorçage (productifs)", rubrique: "Transferts" },
  { name: "Équipements, TIC & Outils numériques", rubrique: "Investissements" },
  { name: "Infrastructures (Hub, plateformes)", rubrique: "Investissements" },
  { name: "Événementiel, Réseautage & Foires", rubrique: "Activités Opérationnelles" },
  { name: "Transport & Logistique terrain", rubrique: "Logistique" },
  { name: "Fonctionnement & Administration", rubrique: "Fonctionnement" },
  { name: "Communication & Visibilité", rubrique: "Communication" },
  { name: "Suivi-Évaluation & Études", rubrique: "S&E" },
  { name: "Audit & Contrôle externe", rubrique: "Audit" },
];

export default function BudgetCategoryTab({ projectId }: { projectId: string | null }) {
  const { data: details, isLoading } = useBudgetDetails(projectId);

  if (!projectId) return <p className="text-center text-muted-foreground py-8 text-sm">Sélectionnez un projet</p>;
  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;
  if (!details?.length) return <p className="text-center text-muted-foreground py-8 text-sm">Aucun détail budgétaire</p>;

  // Aggregate by consolidated category
  type CatData = { y1: number; y2: number; y3: number; y4: number; y5: number; total: number };
  const catMap = new Map<string, CatData>();

  details.forEach(d => {
    const rawCat = d.category || "Autre";
    const consolidated = CATEGORY_CONSOLIDATION[rawCat] || rawCat;
    const existing = catMap.get(consolidated) || { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0, total: 0 };
    existing.y1 += d.year_1 || 0;
    existing.y2 += d.year_2 || 0;
    existing.y3 += d.year_3 || 0;
    existing.y4 += d.year_4 || 0;
    existing.y5 += d.year_5 || 0;
    existing.total += d.total || 0;
    catMap.set(consolidated, existing);
  });

  // Also map SE and GC lines that have specific categories
  // SE lines map to "Suivi-Évaluation & Études" and GC audit to "Audit"
  // These are already handled via the category field in project_budget_details

  // Build ordered list following Excel F3 order
  const categories: { name: string; rubrique: string; data: CatData }[] = [];
  CATEGORY_ORDER.forEach(({ name, rubrique }) => {
    const data = catMap.get(name);
    if (data && data.total > 0) {
      categories.push({ name, rubrique, data });
    }
  });
  // Add any unmapped categories
  catMap.forEach((data, name) => {
    if (!categories.find(c => c.name === name) && data.total > 0) {
      categories.push({ name, rubrique: "Autre", data });
    }
  });

  const grandTotal = categories.reduce((s, c) => s + c.data.total, 0);
  const imprevu = grandTotal * 0.07;
  const yearTotals = [
    categories.reduce((s, c) => s + c.data.y1, 0),
    categories.reduce((s, c) => s + c.data.y2, 0),
    categories.reduce((s, c) => s + c.data.y3, 0),
    categories.reduce((s, c) => s + c.data.y4, 0),
    categories.reduce((s, c) => s + c.data.y5, 0),
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard label="Coûts directs" value={`${fmt(grandTotal)} USD`} note={`${categories.length} catégories`} color="blue" />
        <StatCard label="Imprévus (7%)" value={`${fmt(imprevu)} USD`} note="Standard bailleurs" color="amber" />
        <StatCard label="TOTAL GÉNÉRAL" value={`${fmt(grandTotal + imprevu)} USD`} note="" color="green" />
        <StatCard label="Catégorie n°1" value={categories[0]?.name || "—"} note={`${fmt(categories[0]?.data.total || 0)} USD`} color="purple" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-bold text-foreground">Récapitulatif par catégorie de dépenses — 12 rubriques OCDE-DAC</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-secondary">
                {["#", "Catégorie de Dépenses", "Rubrique OCDE-DAC", "Année 1\n2026", "Année 2\n2027", "Année 3\n2028", "Année 4\n2029", "Année 5\n2030", "TOTAL 5 ANS", "% Total"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.name} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-2 font-mono text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 text-foreground font-medium">{c.name}</td>
                  <td className="px-3 py-2 text-muted-foreground text-[11px]">{c.rubrique}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(c.data.y1)}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(c.data.y2)}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(c.data.y3)}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(c.data.y4)}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(c.data.y5)}</td>
                  <td className="px-3 py-2 text-right"><span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{fmt(c.data.total)}</span></td>
                  <td className="px-3 py-2 text-right font-mono text-muted-foreground">{grandTotal > 0 ? ((c.data.total / grandTotal) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
              <tr className="bg-secondary/60">
                <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-bold text-foreground">SOUS-TOTAL COÛTS DIRECTS</td>
                {yearTotals.map((v, i) => (
                  <td key={i} className="px-3 py-2 text-right font-mono font-bold text-foreground">{fmt(v)}</td>
                ))}
                <td className="px-3 py-2 text-right font-mono font-bold text-primary">{fmt(grandTotal)}</td>
                <td />
              </tr>
              <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-bold text-foreground">IMPRÉVUS (7%)</td>
                {yearTotals.map((v, i) => (
                  <td key={i} className="px-3 py-2 text-right font-mono text-foreground">{fmt(v * 0.07)}</td>
                ))}
                <td className="px-3 py-2 text-right font-mono font-bold text-foreground">{fmt(imprevu)}</td>
                <td />
              </tr>
              <tr className="bg-foreground/5">
                <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-bold text-foreground uppercase">TOTAL GÉNÉRAL</td>
                {yearTotals.map((v, i) => (
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
