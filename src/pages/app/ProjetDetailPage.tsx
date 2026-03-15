import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppBreadcrumb from "@/components/shared/AppBreadcrumb";
import SectionHeader from "@/components/shared/SectionHeader";
import Pill from "@/components/shared/Pill";
import GhButton from "@/components/shared/GhButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  if (isLoading) return <div className="p-8"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-[300px] rounded-xl" /></div>;
  if (!project) return <div className="text-center py-12 text-muted-foreground">Projet introuvable</div>;

  const st = statusMap[project.status] ?? statusMap.draft;
  const vs = validationMap[project.validation_status ?? "draft"] ?? validationMap.draft;
  const totalBudget = budgetLines?.reduce((s, l) => s + (Number(l.total_cost) || 0), 0) ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <AppBreadcrumb items={[{ label: "Projets", href: "/app/projets" }, { label: project.name }]} />
      <SectionHeader
        title={project.name}
        subtitle={project.description ?? project.code ?? ""}
        actions={
          <div className="flex gap-2 items-center">
            <Pill color={st.color}>● {st.label}</Pill>
            <Pill color={vs.color}>{vs.label}</Pill>
            {project.validation_status === "draft" && (
              <GhButton size="sm" onClick={() => navigate(`/app/projets/nouveau?id=${project.id}`)}>Modifier ✏️</GhButton>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <InfoCard label="Programme" value={project.programs?.name ?? "—"} />
        <InfoCard label="Code" value={project.code ?? "—"} />
        <InfoCard label="Période" value={`${project.start_date ? new Date(project.start_date).toLocaleDateString("fr-FR") : "—"} → ${project.end_date ? new Date(project.end_date).toLocaleDateString("fr-FR") : "—"}`} />
        <InfoCard label="Budget" value={totalBudget ? `${totalBudget.toLocaleString("fr-FR")} XOF` : (project.budget ? `${Number(project.budget).toLocaleString("fr-FR")} XOF` : "—")} />
      </div>

      <Tabs defaultValue="logframe" className="w-full">
        <TabsList className="bg-secondary border border-border mb-4">
          <TabsTrigger value="logframe">Cadre logique</TabsTrigger>
          <TabsTrigger value="toc">Théorie du changement</TabsTrigger>
          <TabsTrigger value="indicators">Indicateurs ({indicators?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="budget">Budget ({budgetLines?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="logframe">
          {logFrame ? (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              {logFrame.overall_objective && <Field label="Objectif global" value={logFrame.overall_objective} />}
              {logFrame.specific_objectives && <JsonList label="Objectifs spécifiques" items={logFrame.specific_objectives as string[]} />}
              {logFrame.expected_results && <JsonList label="Résultats attendus" items={logFrame.expected_results as string[]} />}
              {logFrame.activities && <JsonList label="Activités" items={logFrame.activities as string[]} />}
              {logFrame.assumptions && <Field label="Hypothèses" value={logFrame.assumptions} />}
              {logFrame.pre_conditions && <Field label="Pré-conditions" value={logFrame.pre_conditions} />}
            </div>
          ) : <Empty text="Cadre logique non renseigné" />}
        </TabsContent>

        <TabsContent value="toc">
          {toc ? (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
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

        <TabsContent value="indicators">
          {indicators && indicators.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Indicateur</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Catégorie</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Référence</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Cible</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Actuel</th>
                  </tr>
                </thead>
                <tbody>
                  {indicators.map(ind => (
                    <tr key={ind.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 text-foreground font-semibold text-xs">{ind.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{ind.category ?? "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono">{ind.baseline_value ?? 0} {ind.unit ?? ""}</td>
                      <td className="px-4 py-3 text-xs font-mono">{ind.target_value ?? 0} {ind.unit ?? ""}</td>
                      <td className="px-4 py-3 text-xs font-mono">{ind.current_value ?? 0} {ind.unit ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty text="Aucun indicateur défini" />}
        </TabsContent>

        <TabsContent value="budget">
          {budgetLines && budgetLines.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Poste</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Catégorie</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Qté × Coût unit.</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetLines.map(line => (
                    <tr key={line.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 text-foreground font-semibold text-xs">{line.label}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{line.category}</td>
                      <td className="px-4 py-3 text-xs font-mono">{line.quantity ?? 1} × {Number(line.unit_cost ?? 0).toLocaleString("fr-FR")}</td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold">{Number(line.total_cost ?? 0).toLocaleString("fr-FR")} XOF</td>
                    </tr>
                  ))}
                  <tr className="bg-secondary">
                    <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-foreground">Total</td>
                    <td className="px-4 py-3 text-xs font-mono font-bold text-foreground">{totalBudget.toLocaleString("fr-FR")} XOF</td>
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className="text-foreground font-semibold text-sm">{value}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <p className="text-[13px] text-foreground whitespace-pre-line">{value}</p>
    </div>
  );
}

function JsonList({ label, items }: { label: string; items: unknown }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return null;
  return (
    <div>
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <ul className="list-disc list-inside text-[13px] text-foreground space-y-0.5">
        {list.map((item, i) => <li key={i}>{typeof item === "string" ? item : JSON.stringify(item)}</li>)}
      </ul>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-8 text-sm text-muted-foreground">{text}</div>;
}
