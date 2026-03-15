import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppBreadcrumb from "@/components/shared/AppBreadcrumb";
import Pill from "@/components/shared/Pill";
import GhButton from "@/components/shared/GhButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const statusMap: Record<string, { label: string; color: "green" | "blue" | "amber" | "gray" }> = {
  active: { label: "Actif", color: "green" },
  draft: { label: "Brouillon", color: "gray" },
  paused: { label: "En pause", color: "amber" },
  completed: { label: "Terminé", color: "blue" },
  cancelled: { label: "Annulé", color: "gray" },
};

const validationMap: Record<string, { label: string; color: "green" | "blue" | "amber" | "gray" }> = {
  draft: { label: "Brouillon", color: "gray" },
  pending_review: { label: "En attente de validation", color: "amber" },
  validated: { label: "Validé", color: "green" },
  rejected: { label: "Rejeté", color: "gray" },
};

function useProjectDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, programs(name, code), startups(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

function useProjectLogFrame(id: string | undefined) {
  return useQuery({
    queryKey: ["project-logframe", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("logical_frameworks").select("*").eq("project_id", id!).maybeSingle();
      return data;
    },
  });
}

function useProjectTheoryOfChange(id: string | undefined) {
  return useQuery({
    queryKey: ["project-toc", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("theory_of_change").select("*").eq("project_id", id!).maybeSingle();
      return data;
    },
  });
}

function useProjectIndicators(id: string | undefined) {
  return useQuery({
    queryKey: ["project-indicators", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("project_indicators").select("*").eq("project_id", id!).order("created_at");
      return data ?? [];
    },
  });
}

function useProjectBudgetLines(id: string | undefined) {
  return useQuery({
    queryKey: ["project-budget-lines", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("project_budget_lines").select("*").eq("project_id", id!).order("created_at");
      return data ?? [];
    },
  });
}

export default function ProjetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProjectDetail(id);
  const { data: logFrame } = useProjectLogFrame(id);
  const { data: toc } = useProjectTheoryOfChange(id);
  const { data: indicators } = useProjectIndicators(id);
  const { data: budgetLines } = useProjectBudgetLines(id);
  const [descExpanded, setDescExpanded] = useState(false);

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-96" />
      <div className="grid grid-cols-4 gap-3.5"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div>
      <Skeleton className="h-[300px] rounded-xl" />
    </div>
  );
  if (!project) return <div className="text-center py-12 text-muted-foreground">Projet introuvable</div>;

  const st = statusMap[project.status] ?? statusMap.draft;
  const vs = validationMap[project.validation_status ?? "draft"] ?? validationMap.draft;
  const totalBudget = budgetLines?.reduce((s, l) => s + (Number(l.total_cost) || 0), 0) ?? 0;
  const progress = Number(project.progress) || 0;
  const description = project.description ?? "";
  const isLongDesc = description.length > 300;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Breadcrumb */}
      <AppBreadcrumb items={[{ label: "Projets", href: "/app/projets" }, { label: project.name }]} />

      {/* Header card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {project.code && <span className="font-mono text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">{project.code}</span>}
                <Pill color={st.color}>● {st.label}</Pill>
                <Pill color={vs.color}>{vs.label}</Pill>
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground leading-tight">{project.name}</h1>
              {project.programs?.name && (
                <p className="text-xs text-muted-foreground">Programme : <span className="text-foreground font-medium">{project.programs.name}</span></p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {(project.validation_status === "draft" || project.validation_status === "pending_review") && (
                <GhButton size="sm" variant="secondary" onClick={() => navigate(`/app/projets/nouveau?id=${project.id}`)}>
                  Modifier ✏️
                </GhButton>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {progress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Progression</span>
                <span className="text-xs font-mono font-semibold text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox icon="📅" label="Début" value={project.start_date ? new Date(project.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
        <StatBox icon="🏁" label="Fin" value={project.end_date ? new Date(project.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
        <StatBox icon="💰" label="Budget" value={totalBudget ? `${totalBudget.toLocaleString("fr-FR")} XOF` : (project.budget ? `${Number(project.budget).toLocaleString("fr-FR")} XOF` : "—")} />
        <StatBox icon="📊" label="Indicateurs" value={String(indicators?.length ?? 0)} />
      </div>

      {/* Description collapsible */}
      {description && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Description du projet</h3>
            {isLongDesc && (
              <button onClick={() => setDescExpanded(!descExpanded)} className="text-[11px] text-primary hover:underline font-medium cursor-pointer">
                {descExpanded ? "Réduire ↑" : "Lire la suite ↓"}
              </button>
            )}
          </div>
          <p className={`text-[13px] text-foreground/85 leading-relaxed whitespace-pre-line ${!descExpanded && isLongDesc ? "line-clamp-4" : ""}`}>
            {description}
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="logframe">Cadre logique</TabsTrigger>
          <TabsTrigger value="toc">Théorie du changement</TabsTrigger>
          <TabsTrigger value="indicators">Indicateurs ({indicators?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="budget">Budget ({budgetLines?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cadre logique résumé */}
            <SummaryCard
              title="Cadre logique"
              filled={!!logFrame}
              items={logFrame ? [
                { label: "Objectif global", value: logFrame.overall_objective ?? "—" },
                { label: "Objectifs spécifiques", value: `${(logFrame.specific_objectives as unknown[])?.length ?? 0} défini(s)` },
                { label: "Résultats attendus", value: `${(logFrame.expected_results as unknown[])?.length ?? 0} défini(s)` },
              ] : []}
            />
            {/* ToC résumé */}
            <SummaryCard
              title="Théorie du changement"
              filled={!!toc}
              items={toc ? [
                { label: "Impact", value: toc.impact ?? "—" },
                { label: "Outcomes", value: `${(toc.outcomes as unknown[])?.length ?? 0} défini(s)` },
                { label: "Outputs", value: `${(toc.outputs as unknown[])?.length ?? 0} défini(s)` },
              ] : []}
            />
          </div>
        </TabsContent>

        <TabsContent value="logframe" className="mt-4">
          {logFrame ? (
            <div className="bg-card border border-border rounded-xl p-5 space-y-5">
              {logFrame.overall_objective && <Field label="Objectif global" value={logFrame.overall_objective} />}
              {logFrame.specific_objectives && <JsonList label="Objectifs spécifiques" items={logFrame.specific_objectives as string[]} />}
              {logFrame.expected_results && <JsonList label="Résultats attendus" items={logFrame.expected_results as string[]} />}
              {logFrame.activities && <JsonList label="Activités" items={logFrame.activities as string[]} />}
              {logFrame.assumptions && <Field label="Hypothèses" value={logFrame.assumptions} />}
              {logFrame.pre_conditions && <Field label="Pré-conditions" value={logFrame.pre_conditions} />}
            </div>
          ) : <Empty text="Cadre logique non renseigné" />}
        </TabsContent>

        <TabsContent value="toc" className="mt-4">
          {toc ? (
            <div className="bg-card border border-border rounded-xl p-5 space-y-5">
              {toc.impact && <Field label="Impact" value={toc.impact} />}
              {toc.outcomes && <JsonList label="Outcomes" items={toc.outcomes as string[]} />}
              {toc.outputs && <JsonList label="Outputs" items={toc.outputs as string[]} />}
              {toc.activities && <JsonList label="Activités" items={toc.activities as string[]} />}
              {toc.inputs && <JsonList label="Inputs" items={toc.inputs as string[]} />}
              {toc.assumptions && <JsonList label="Hypothèses" items={toc.assumptions as string[]} />}
              {toc.risks && <JsonList label="Risques" items={toc.risks as string[]} />}
            </div>
          ) : <Empty text="Théorie du changement non renseignée" />}
        </TabsContent>

        <TabsContent value="indicators" className="mt-4">
          {indicators && indicators.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <Th>Indicateur</Th><Th>Catégorie</Th><Th>Référence</Th><Th>Cible</Th><Th>Actuel</Th>
                  </tr>
                </thead>
                <tbody>
                  {indicators.map(ind => {
                    const pct = (ind.target_value && ind.target_value > 0) ? Math.round(((ind.current_value ?? 0) / ind.target_value) * 100) : 0;
                    return (
                      <tr key={ind.id} className="border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-foreground font-semibold text-xs">{ind.name}</div>
                          {ind.responsible && <div className="text-[10px] text-muted-foreground mt-0.5">{ind.responsible}</div>}
                        </td>
                        <td className="px-4 py-3"><Pill color={ind.category === "outcome" ? "blue" : ind.category === "impact" ? "green" : "gray"}>{ind.category ?? "—"}</Pill></td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{ind.baseline_value ?? 0} {ind.unit ?? ""}</td>
                        <td className="px-4 py-3 text-xs font-mono">{ind.target_value ?? 0} {ind.unit ?? ""}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold">{ind.current_value ?? 0}</span>
                            <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <Empty text="Aucun indicateur défini" />}
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          {budgetLines && budgetLines.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <Th>Poste</Th><Th>Catégorie</Th><Th>Qté × Coût unit.</Th><Th>Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {budgetLines.map(line => (
                    <tr key={line.id} className="border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-foreground font-semibold text-xs">{line.label}</div>
                        {line.description && <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{line.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{line.category}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{line.quantity ?? 1} × {Number(line.unit_cost ?? 0).toLocaleString("fr-FR")}</td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-foreground">{Number(line.total_cost ?? 0).toLocaleString("fr-FR")} XOF</td>
                    </tr>
                  ))}
                  <tr className="bg-secondary/80">
                    <td colSpan={3} className="px-4 py-3 text-xs font-bold text-foreground uppercase">Total général</td>
                    <td className="px-4 py-3 text-sm font-mono font-extrabold text-primary">{totalBudget.toLocaleString("fr-FR")} XOF</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : <Empty text="Aucune ligne budgétaire" />}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

/* ── Sub-components ── */

function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
      <span className="text-lg">{icon}</span>
      <div className="min-w-0">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-foreground font-semibold text-sm mt-0.5 truncate">{value}</div>
      </div>
    </div>
  );
}

function SummaryCard({ title, filled, items }: { title: string; filled: boolean; items: { label: string; value: string }[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${filled ? "bg-primary" : "bg-muted-foreground/30"}`} />
        <h4 className="font-display text-sm font-bold text-foreground">{title}</h4>
      </div>
      {filled ? (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i}>
              <div className="text-[10px] font-mono text-muted-foreground uppercase">{item.label}</div>
              <p className="text-xs text-foreground line-clamp-2">{item.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Non renseigné</p>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">{children}</th>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-primary/20 pl-4">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <p className="text-[13px] text-foreground/85 leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
}

function JsonList({ label, items }: { label: string; items: unknown }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return null;
  return (
    <div className="border-l-2 border-accent/20 pl-4">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
      <ul className="space-y-1.5">
        {list.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/85">
            <span className="text-primary mt-0.5 shrink-0">›</span>
            <span>{typeof item === "string" ? item : JSON.stringify(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-12">
      <span className="text-3xl mb-2">📋</span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
