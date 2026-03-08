import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

interface BudgetChartProps {
  budgetLines: any[];
  transactions: any[];
}

export default function GrantBudgetChart({ budgetLines, transactions }: BudgetChartProps) {
  // Group budget lines by category
  const budgetByCategory = budgetLines.reduce((acc: Record<string, number>, b: any) => {
    const cat = b.category || "Autre";
    acc[cat] = (acc[cat] ?? 0) + (b.amount_planned ?? 0);
    return acc;
  }, {});

  // Group transactions by category
  const spentByCategory = transactions.reduce((acc: Record<string, number>, t: any) => {
    const cat = t.category || "autre";
    const label = categoryLabels[cat] ?? cat;
    acc[label] = (acc[label] ?? 0) + (t.amount ?? 0);
    return acc;
  }, {});

  // Also map budget code transactions to budget line categories
  const spentByBudgetCode = transactions.reduce((acc: Record<string, number>, t: any) => {
    if (t.budget_code) {
      const matchedBudget = budgetLines.find(b => b.category === t.budget_code || b.label?.includes(t.budget_code));
      if (matchedBudget) {
        const cat = matchedBudget.category || "Autre";
        acc[cat] = (acc[cat] ?? 0) + (t.amount ?? 0);
      }
    }
    return acc;
  }, {});

  const allCategories = [...new Set([...Object.keys(budgetByCategory), ...Object.keys(spentByCategory)])];

  const chartData = allCategories.map(cat => ({
    name: cat.length > 15 ? cat.slice(0, 15) + "…" : cat,
    fullName: cat,
    prevu: budgetByCategory[cat] ?? 0,
    depense: (spentByCategory[cat] ?? 0) + (spentByBudgetCode[cat] ?? 0),
  }));

  if (chartData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <div className="text-2xl mb-2">📊</div>
        <div className="text-sm text-muted-foreground">Pas de données pour le graphique</div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs font-bold text-foreground mb-4">Budget prévu vs Dépenses réelles</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmt(v)} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
            formatter={(value: number, name: string) => [fmt(value) + " €", name === "prevu" ? "Prévu" : "Dépensé"]}
            labelFormatter={(label) => chartData.find(d => d.name === label)?.fullName ?? label}
          />
          <Legend formatter={(value) => value === "prevu" ? "Prévu" : "Dépensé"} />
          <Bar dataKey="prevu" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.7} />
          <Bar dataKey="depense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const categoryLabels: Record<string, string> = {
  personnel: "Personnel",
  equipement: "Équipement",
  deplacement: "Déplacement",
  formation: "Formation",
  services: "Services externes",
  fonctionnement: "Fonctionnement",
  autre: "Autre",
};
