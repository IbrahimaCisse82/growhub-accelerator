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
import BudgetExecutionTab from "@/components/budgets/BudgetExecutionTab";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

  const handleExportCSV = async () => {
    if (!selectedProjectId) return;
    const { data } = await supabase.from("project_budget_lines").select("code, label, section, year1, year2, year3, year4, year5, total_cost, notes").eq("project_id", selectedProjectId).order("code");
    if (data && data.length > 0) {
      const rows = data.map(r => ({ ...r, year1: (r.year1 || 0) * rate, year2: (r.year2 || 0) * rate, year3: (r.year3 || 0) * rate, year4: (r.year4 || 0) * rate, year5: (r.year5 || 0) * rate, total_cost: (r.total_cost || 0) * rate }));
      exportToCSV(rows, `budget-${currency}`, [
        { key: "code", label: "Code" }, { key: "label", label: "Libellé" }, { key: "section", label: "WP" },
        { key: "year1", label: "An.1" }, { key: "year2", label: "An.2" }, { key: "year3", label: "An.3" },
        { key: "year4", label: "An.4" }, { key: "year5", label: "An.5" }, { key: "total_cost", label: "Total" }, { key: "notes", label: "Notes" },
      ]);
      toast({ title: "✓ Export CSV généré" });
    }
  };

  const handleExportPDF = async () => {
    if (!selectedProjectId) return;
    const { data } = await supabase.from("project_budget_lines").select("code, label, section, year1, year2, year3, year4, year5, total_cost").eq("project_id", selectedProjectId).order("code");
    if (data && data.length > 0) {
      const rows = data.map(r => ({ ...r, year1: fmt((r.year1 || 0) * rate), year2: fmt((r.year2 || 0) * rate), year3: fmt((r.year3 || 0) * rate), year4: fmt((r.year4 || 0) * rate), year5: fmt((r.year5 || 0) * rate), total_cost: fmt((r.total_cost || 0) * rate) }));
      exportToPDF(`Budget Prévisionnel (${currency})`, rows, [
        { key: "code", label: "Code" }, { key: "label", label: "Libellé" }, { key: "section", label: "WP" },
        { key: "year1", label: "An.1" }, { key: "year2", label: "An.2" }, { key: "year3", label: "An.3" },
        { key: "year4", label: "An.4" }, { key: "year5", label: "An.5" }, { key: "total_cost", label: "Total" },
      ]);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Budget — PAERID" subtitle="Budget prévisionnel complet — 4 feuilles liées"
        actions={
          <div className="flex items-center gap-2">
            <GhButton variant="secondary" onClick={handleExportCSV} disabled={!selectedProjectId}>⤓ CSV</GhButton>
            <GhButton variant="secondary" onClick={handleExportPDF} disabled={!selectedProjectId}>🖨 PDF</GhButton>
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
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="global" className="text-xs">1. Budget Global</TabsTrigger>
          <TabsTrigger value="detail" className="text-xs">2. Détail par WP</TabsTrigger>
          <TabsTrigger value="category" className="text-xs">3. Par Catégorie</TabsTrigger>
          <TabsTrigger value="execution" className="text-xs">4. Exécution</TabsTrigger>
          <TabsTrigger value="hypotheses" className="text-xs">5. Hypothèses</TabsTrigger>
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

        <TabsContent value="execution">
          <BudgetExecutionTab projectId={selectedProjectId} currency={currency} rate={rate} fmt={fmt} />
        </TabsContent>

        <TabsContent value="hypotheses">
          <BudgetAssumptionsTab projectId={selectedProjectId} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
