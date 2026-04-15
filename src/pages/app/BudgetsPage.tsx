import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import StatCard from "@/components/shared/StatCard";
import GhButton from "@/components/shared/GhButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBudgets } from "@/hooks/useBudgets";
import { useGrants } from "@/hooks/useGrants";
import { useProjects } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import BudgetDetailTab from "@/components/budgets/BudgetDetailTab";
import BudgetCategoryTab from "@/components/budgets/BudgetCategoryTab";
import BudgetAssumptionsTab from "@/components/budgets/BudgetAssumptionsTab";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

function useAllProjectBudgetLines() {
  return useQuery({
    queryKey: ["all_project_budget_lines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_budget_lines")
        .select("*, projects(name)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export default function BudgetsPage() {
  const { data: budgets, isLoading: lb } = useBudgets();
  const { data: grants } = useGrants();
  const { data: projects } = useProjects();
  const { data: allBudgetLines, isLoading: lbl } = useAllProjectBudgetLines();
  const [searchParams] = useSearchParams();
  const [grantFilter, setGrantFilter] = useState<string | null>(searchParams.get("grant"));
  const [projectFilter, setProjectFilter] = useState<string | null>(searchParams.get("project"));

  const isLoading = lb || lbl;

  const filteredLines = projectFilter
    ? allBudgetLines?.filter((l: any) => l.project_id === projectFilter)
    : allBudgetLines;

  const linesA = filteredLines?.filter((l: any) => l.section === "A") ?? [];
  const linesB = filteredLines?.filter((l: any) => l.section === "B") ?? [];

  const lineTotal = (l: any) => (l.quantity || 0) * (l.unit_cost || 0) * ((l.allocation_pct || 100) / 100);
  const totalA = linesA.reduce((s: number, l: any) => s + lineTotal(l), 0);
  const totalB = linesB.reduce((s: number, l: any) => s + lineTotal(l), 0);
  const grandTotal = totalA + totalB;

  const filteredBudgets = grantFilter ? budgets?.filter(b => b.grant_id === grantFilter) : budgets;
  const totalPlanned = filteredBudgets?.reduce((a, b) => a + (b.amount_planned ?? 0), 0) ?? 0;
  const totalSpent = filteredBudgets?.reduce((a, b) => a + (b.amount_spent ?? 0), 0) ?? 0;
  const utilization = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;

  const cols = [
    { key: "label", label: "Libellé" }, { key: "category", label: "Catégorie" },
    { key: "amount_planned", label: "Planifié" }, { key: "amount_spent", label: "Dépensé" },
  ];

  // Determine selected project for detail tabs
  const selectedProjectId = projectFilter || (projects?.length === 1 ? projects[0].id : null);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Budget — PAERID" subtitle="Budget prévisionnel complet — 4 feuilles liées"
        actions={<>
          <GhButton variant="ghost" onClick={() => filteredBudgets && exportToCSV(filteredBudgets, "budgets", cols)}>⤓ CSV</GhButton>
          <GhButton variant="ghost" onClick={() => filteredBudgets && exportToPDF("Budgets", filteredBudgets, cols)}>⎙ PDF</GhButton>
        </>} />

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

      {/* 4 tabs linked to the 4 Excel sheets */}
      <Tabs defaultValue="global" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="global" className="text-xs">1. Budget Global</TabsTrigger>
          <TabsTrigger value="detail" className="text-xs">2. Détail par WP</TabsTrigger>
          <TabsTrigger value="category" className="text-xs">3. Par Catégorie</TabsTrigger>
          <TabsTrigger value="hypotheses" className="text-xs">4. Hypothèses</TabsTrigger>
        </TabsList>

        {/* Tab 1: Budget Global (existing Annexe 1b) */}
        <TabsContent value="global">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-4">
            <StatCard label="Coûts opérationnels (A)" value={`${fmt(totalA)} €`} note={`${linesA.length} postes`} color="blue" />
            <StatCard label="Frais de gestion (B)" value={`${fmt(totalB)} €`} note={`${linesB.length} postes`} color="amber" />
            <StatCard label="Budget TOTAL" value={`${fmt(grandTotal)} €`} note="" color="green" />
            <StatCard label="Consommation" value={`${utilization}%`} note={`${fmt(totalSpent)} / ${fmt(totalPlanned)} XOF`} color={utilization > 80 ? "rose" : "purple"} />
          </div>

          {/* Grant filter */}
          {grants && grants.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">Grant :</span>
              <button onClick={() => setGrantFilter(null)} className={`text-[11.5px] px-2.5 py-1 rounded-lg transition-colors ${!grantFilter ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>Tous</button>
              {grants.map(g => (
                <button key={g.id} onClick={() => setGrantFilter(grantFilter === g.id ? null : g.id)} className={`text-[11.5px] px-2.5 py-1 rounded-lg transition-colors ${grantFilter === g.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>{g.name}</button>
              ))}
            </div>
          )}

          {/* Annexe 1b table */}
          {filteredLines && filteredLines.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Lignes budgétaires — Format Annexe 1b</span>
                <span className="font-mono text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{filteredLines.length} lignes</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground w-[80px]">Code</th>
                      <th className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground">Description</th>
                      <th className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground">Projet</th>
                      <th className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground w-[70px]">Unité</th>
                      <th className="px-3 py-2 text-right text-[10px] font-mono uppercase text-muted-foreground w-[50px]">Qté</th>
                      <th className="px-3 py-2 text-right text-[10px] font-mono uppercase text-muted-foreground w-[90px]">Mont. unit.</th>
                      <th className="px-3 py-2 text-right text-[10px] font-mono uppercase text-muted-foreground w-[50px]">Alloc.%</th>
                      <th className="px-3 py-2 text-right text-[10px] font-mono uppercase text-muted-foreground w-[100px]">Total EUR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linesA.length > 0 && (
                      <>
                        <tr><td colSpan={8} className="px-3 py-2 bg-primary/10 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">A — Coûts opérationnels</td></tr>
                        {linesA.map((l: any) => (
                          <tr key={l.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                            <td className="px-3 py-2"><span className="font-mono text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{l.code || "—"}</span></td>
                            <td className="px-3 py-2 text-foreground">{l.label}</td>
                            <td className="px-3 py-2 text-muted-foreground text-[11px]">{l.projects?.name ?? "—"}</td>
                            <td className="px-3 py-2 text-muted-foreground">{l.unit || "—"}</td>
                            <td className="px-3 py-2 text-right font-mono text-foreground">{l.quantity ?? 0}</td>
                            <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(l.unit_cost ?? 0)}</td>
                            <td className="px-3 py-2 text-right font-mono text-muted-foreground">{l.allocation_pct ?? 100}%</td>
                            <td className="px-3 py-2 text-right"><span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">{fmt(lineTotal(l))}</span></td>
                          </tr>
                        ))}
                        <tr className="bg-secondary/50"><td colSpan={7} className="px-3 py-1.5 text-right text-[11px] font-bold text-foreground">Sous-total A</td><td className="px-3 py-1.5 text-right font-mono font-bold text-foreground">{fmt(totalA)} €</td></tr>
                      </>
                    )}
                    {linesB.length > 0 && (
                      <>
                        <tr><td colSpan={8} className="px-3 py-2 bg-accent/10 text-accent-foreground font-mono text-[10px] font-bold uppercase tracking-wider">B — Frais de gestion</td></tr>
                        {linesB.map((l: any) => (
                          <tr key={l.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                            <td className="px-3 py-2"><span className="font-mono text-[11px] bg-accent/10 text-accent-foreground px-1.5 py-0.5 rounded font-semibold">{l.code || "—"}</span></td>
                            <td className="px-3 py-2 text-foreground">{l.label}</td>
                            <td className="px-3 py-2 text-muted-foreground text-[11px]">{l.projects?.name ?? "—"}</td>
                            <td className="px-3 py-2 text-muted-foreground">{l.unit || "—"}</td>
                            <td className="px-3 py-2 text-right font-mono text-foreground">{l.quantity ?? 0}</td>
                            <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(l.unit_cost ?? 0)}</td>
                            <td className="px-3 py-2 text-right font-mono text-muted-foreground">{l.allocation_pct ?? 100}%</td>
                            <td className="px-3 py-2 text-right"><span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">{fmt(lineTotal(l))}</span></td>
                          </tr>
                        ))}
                        <tr className="bg-secondary/50"><td colSpan={7} className="px-3 py-1.5 text-right text-[11px] font-bold text-foreground">Sous-total B</td><td className="px-3 py-1.5 text-right font-mono font-bold text-foreground">{fmt(totalB)} €</td></tr>
                      </>
                    )}
                    <tr className="bg-foreground/5">
                      <td colSpan={7} className="px-3 py-2.5 text-right text-xs font-bold text-foreground uppercase">Total général</td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm font-bold text-primary">{fmt(grandTotal)} €</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Legacy budgets */}
          {filteredBudgets && filteredBudgets.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <span className="text-xs font-bold text-foreground">Suivi budgétaire par grant</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="bg-secondary">
                      {["Libellé", "Catégorie", "Projet", "Grant", "Planifié", "Dépensé", "%"].map(h => (
                        <th key={h} className="px-3.5 py-2.5 text-left text-[10px] font-mono uppercase text-muted-foreground tracking-wider border-b border-border whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBudgets.map(b => {
                      const pct = (b.amount_planned ?? 0) > 0 ? Math.round(((b.amount_spent ?? 0) / (b.amount_planned ?? 1)) * 100) : 0;
                      return (
                        <tr key={b.id} className="hover:bg-secondary/50 transition-colors">
                          <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">{b.label}</td>
                          <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground">{b.category}</td>
                          <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground">{b.projects?.name ?? "—"}</td>
                          <td className="px-3.5 py-2.5 border-b border-border text-muted-foreground">{b.grants?.name ?? "—"}</td>
                          <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{fmt(b.amount_planned ?? 0)} XOF</td>
                          <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{fmt(b.amount_spent ?? 0)} XOF</td>
                          <td className="px-3.5 py-2.5 border-b border-border font-mono text-primary">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isLoading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>}
          {!isLoading && (!filteredLines || filteredLines.length === 0) && (!filteredBudgets || filteredBudgets.length === 0) && (
            <div className="text-center text-muted-foreground py-12 text-sm">Aucune donnée budgétaire. Créez un projet pour générer un budget Annexe 1b.</div>
          )}
        </TabsContent>

        {/* Tab 2: Détail par WP */}
        <TabsContent value="detail">
          <BudgetDetailTab projectId={selectedProjectId} />
        </TabsContent>

        {/* Tab 3: Récap par catégorie (computed) */}
        <TabsContent value="category">
          <BudgetCategoryTab projectId={selectedProjectId} />
        </TabsContent>

        {/* Tab 4: Hypothèses & Paramètres */}
        <TabsContent value="hypotheses">
          <BudgetAssumptionsTab projectId={selectedProjectId} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
