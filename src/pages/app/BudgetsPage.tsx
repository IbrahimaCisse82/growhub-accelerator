import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjects } from "@/hooks/useProjects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BudgetGlobalTab from "@/components/budgets/BudgetGlobalTab";
import BudgetDetailTab from "@/components/budgets/BudgetDetailTab";
import BudgetCategoryTab from "@/components/budgets/BudgetCategoryTab";
import BudgetAssumptionsTab from "@/components/budgets/BudgetAssumptionsTab";

const CURRENCIES = [
  { code: "USD", label: "USD ($)", rate: 1 },
  { code: "EUR", label: "EUR (€)", rate: 0.92 },
  { code: "XOF", label: "XOF (FCFA)", rate: 600 },
];

const fmtNumber = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

export default function BudgetsPage() {
  const { data: projects } = useProjects();
  const [searchParams] = useSearchParams();
  const [projectFilter, setProjectFilter] = useState<string | null>(searchParams.get("project"));
  const [currency, setCurrency] = useState("USD");

  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const rate = selectedCurrency.rate;
  const fmt = fmtNumber;

  const selectedProjectId = projectFilter || (projects?.length === 1 ? projects[0].id : null);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Budget — PAERID" subtitle="Budget prévisionnel complet — 4 feuilles liées"
        actions={
          <div className="flex items-center gap-2">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code} className="text-xs">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        } />

      {/* Project filter */}
      {projects && projects.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">Projet :</span>
          <button onClick={() => setProjectFilter(null)} className={`text-[11.5px] px-2.5 py-1 rounded-lg transition-colors ${!projectFilter ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>Tous</button>
          {projects.map(p => (
            <button key={p.id} onClick={() => setProjectFilter(projectFilter === p.id ? null : p.id)} className={`text-[11.5px] px-2.5 py-1 rounded-lg transition-colors ${projectFilter === p.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>{p.name}</button>
          ))}
        </div>
      )}

      <Tabs defaultValue="global" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="global" className="text-xs">1. Budget Global</TabsTrigger>
          <TabsTrigger value="detail" className="text-xs">2. Détail par WP</TabsTrigger>
          <TabsTrigger value="category" className="text-xs">3. Par Catégorie</TabsTrigger>
          <TabsTrigger value="hypotheses" className="text-xs">4. Hypothèses</TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <BudgetGlobalTab projectId={selectedProjectId} currency={currency} rate={rate} fmt={fmt} />
        </TabsContent>

        <TabsContent value="detail">
          <BudgetDetailTab projectId={selectedProjectId} currency={currency} rate={rate} fmt={fmt} />
        </TabsContent>

        <TabsContent value="category">
          <BudgetCategoryTab projectId={selectedProjectId} currency={currency} rate={rate} fmt={fmt} />
        </TabsContent>

        <TabsContent value="hypotheses">
          <BudgetAssumptionsTab projectId={selectedProjectId} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
