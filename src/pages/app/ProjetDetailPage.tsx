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
import WorkPackageCard from "@/components/projects/WorkPackageCard";
import InlineEditField from "@/components/projects/InlineEditField";
import { buildWorkPackages } from "@/lib/workPackageUtils";
import EntityDocumentsTab from "@/components/shared/EntityDocumentsTab";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useAssignableUsers";
import { EditProjectDialog } from "@/components/dialogs/EditEntityDialogs";
import ValidateEntityDialog from "@/components/dialogs/ValidateEntityDialog";
import { exportProjectPdf } from "@/lib/projectPdfExport";

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

function useProjectGrants(id: string | undefined) {
  return useQuery({
    queryKey: ["project-grants", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("grants").select("*").eq("project_id", id!).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
}

function useProjectMilestones(id: string | undefined) {
  return useQuery({
    queryKey: ["project-milestones", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("milestones").select("*").eq("project_id", id!).order("due_date");
      return data ?? [];
    },
  });
}

export default function ProjetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: project, isLoading } = useProjectDetail(id);
  const { data: logFrame } = useProjectLogFrame(id);
  const { data: toc } = useProjectTheoryOfChange(id);
  const { data: indicators } = useProjectIndicators(id);
  const { data: budgetLines } = useProjectBudgetLines(id);
  const { data: milestones } = useProjectMilestones(id);
  const { data: projectGrants } = useProjectGrants(id);
  const { data: projectManager } = useUserProfile(project?.owner_id);
  const [descExpanded, setDescExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);

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

  // Build Work Packages from logframe + indicators + milestones
  const workPackages = buildWorkPackages(logFrame, indicators ?? [], milestones ?? []);

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
              {projectManager && (
                <p className="text-xs text-muted-foreground">Chef de projet : <span className="text-foreground font-medium">{projectManager.full_name}</span></p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <GhButton size="sm" variant="ghost" onClick={() => exportProjectPdf({ project, logFrame: logFrame ?? null, indicators: indicators ?? [], budgetLines: budgetLines ?? [] })}>
                📄 Export PDF
              </GhButton>
              {isAdmin && (
                <>
                  <GhButton size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                    Modifier ✏️
                  </GhButton>
                  {project.validation_status !== "validated" && (
                    <GhButton size="sm" variant="primary" onClick={() => setValidateOpen(true)}>
                      Valider ✓
                    </GhButton>
                  )}
                </>
              )}
              {(project.validation_status === "draft" || project.validation_status === "pending_review") && (
                <GhButton size="sm" variant="ghost" onClick={() => navigate(`/app/projets/nouveau?id=${project.id}`)}>
                  Wizard ↗
                </GhButton>
              )}
            </div>
          </div>

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
        <StatBox icon="📦" label="Work Packages" value={String(workPackages.length)} />
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
      <Tabs defaultValue="introduction" className="w-full">
        <TabsList className="bg-secondary border border-border flex-wrap">
          <TabsTrigger value="introduction">1. Introduction</TabsTrigger>
          <TabsTrigger value="contexte">2. Contexte & Justification</TabsTrigger>
          <TabsTrigger value="objectifs">3. Objectifs ({workPackages.length})</TabsTrigger>
          <TabsTrigger value="resultats">4. Résultats attendus</TabsTrigger>
          <TabsTrigger value="toc">Théorie du changement</TabsTrigger>
          <TabsTrigger value="budget">Budget ({budgetLines?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="bailleurs">Bailleurs ({projectGrants?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* 1. Introduction */}
        <TabsContent value="introduction" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">1. Introduction</h2>
              <p className="text-xs text-muted-foreground">Présentation générale du projet et de son contexte d'intervention.</p>
            </div>
            {description && <InlineEditField projectId={project.id} fieldKey="description" label="Description du projet" value={description} isAdmin={isAdmin} />}
            {(project.metadata as Record<string, unknown> | null)?.introduction && (
              <InlineEditField projectId={project.id} fieldKey="metadata.introduction" label="Introduction" value={(project.metadata as Record<string, unknown>).introduction as string} isAdmin={isAdmin} />
            )}
            {project.country && <Field label="Pays" value={project.country} />}
            {project.locations && (project.locations as string[]).length > 0 && (
              <JsonList label="Lieux d'implémentation" items={project.locations} />
            )}
            {project.duration_months && <Field label="Durée" value={`${project.duration_months} mois`} />}
            {project.start_date && <Field label="Date de début" value={new Date(project.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} />}
            {project.end_date && <Field label="Date de fin" value={new Date(project.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} />}
            {!description && !(project.metadata as Record<string, unknown> | null)?.introduction && !project.country && !project.start_date && (
              <Empty text="Aucune information d'introduction renseignée" />
            )}
          </div>
        </TabsContent>

        {/* 2. Contexte & Justification */}
        <TabsContent value="contexte" className="mt-4">
          <ContexteJustificationTab metadata={project.metadata as Record<string, unknown> | null} projectId={project.id} isAdmin={isAdmin} />
        </TabsContent>

        {/* 3. Objectifs */}
        <TabsContent value="objectifs" className="mt-4">
          <ObjectifsTab logFrame={logFrame} workPackages={workPackages} />
        </TabsContent>

        {/* 4. Résultats attendus */}
        <TabsContent value="resultats" className="mt-4">
          <ResultatsAttendusTab logFrame={logFrame} indicators={indicators ?? []} />
        </TabsContent>

        {/* Theory of Change tab */}
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

        {/* Budget tab */}
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
        <TabsContent value="documents" className="mt-4">
          <EntityDocumentsTab entityType="project" entityId={project.id} label="Documents du projet" />
        </TabsContent>
      </Tabs>

      <EditProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
      <ValidateEntityDialog open={validateOpen} onOpenChange={setValidateOpen} entityType="projects" entityId={project.id} entityName={project.name} />
    </motion.div>
  );
}

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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">{children}</th>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 border border-border rounded-lg p-4">
      <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
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

function ContexteJustificationTab({ metadata, projectId, isAdmin }: { metadata: Record<string, unknown> | null; projectId: string; isAdmin: boolean }) {
  const meta = metadata ?? {};
  const contexteJustification = meta.contexte_justification as string | undefined;
  const contexte = meta.contexte_territorial as string | undefined;
  const contraintes = meta.contraintes_vulnerabilites as string | undefined;
  const alignement = meta.alignement_strategique as string | undefined;
  const justification = meta.justification as string | undefined;

  const hasContent = contexteJustification || contexte || contraintes || alignement || justification;

  if (!hasContent) return <Empty text="Contexte et justification non renseignés — complétez via le Wizard" />;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">2. Contexte et justification du projet</h2>
        <p className="text-xs text-muted-foreground">Contexte dans lequel s'inscrit le projet, contraintes identifiées et justification de l'intervention.</p>
      </div>
      {contexteJustification && <InlineEditField projectId={projectId} fieldKey="metadata.contexte_justification" label="2. Contexte et justification du projet" value={contexteJustification} isAdmin={isAdmin} />}
      {contexte && <InlineEditField projectId={projectId} fieldKey="metadata.contexte_territorial" label="2.1. Contexte territorial" value={contexte} isAdmin={isAdmin} />}
      {contraintes && <InlineEditField projectId={projectId} fieldKey="metadata.contraintes_vulnerabilites" label="2.2. Contraintes structurelles et vulnérabilités" value={contraintes} isAdmin={isAdmin} />}
      {alignement && <InlineEditField projectId={projectId} fieldKey="metadata.alignement_strategique" label="2.3. Alignement avec les orientations stratégiques" value={alignement} isAdmin={isAdmin} />}
      {justification && <InlineEditField projectId={projectId} fieldKey="metadata.justification" label="2.4. Justification de l'intervention" value={justification} isAdmin={isAdmin} />}
    </div>
  );
}

function ObjectifsTab({ logFrame, workPackages }: { logFrame: any; workPackages: any[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">3. Objectif général et spécifiques du projet</h2>
        <p className="text-xs text-muted-foreground">Objectifs poursuivis par le projet.</p>
      </div>
      {logFrame?.overall_objective ? (
        <Field label="3.1. Objectif général du projet" value={logFrame.overall_objective} />
      ) : (
        <Empty text="Objectif général non renseigné" />
      )}
      {logFrame?.specific_objectives && Array.isArray(logFrame.specific_objectives) && logFrame.specific_objectives.length > 0 ? (
        <div className="border-l-2 border-accent/20 pl-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">3.2. Objectifs spécifiques</div>
          <ul className="space-y-1.5">
            {(logFrame.specific_objectives as string[]).map((obj: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/85">
                <span className="text-primary mt-0.5 shrink-0">OS{i + 1}.</span>
                <span>{typeof obj === "string" ? obj : JSON.stringify(obj)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Empty text="Aucun objectif spécifique renseigné" />
      )}
      {workPackages.length > 0 && (
        <div className="space-y-4 mt-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Work Packages associés</div>
          {workPackages.map((wp) => (
            <WorkPackageCard key={wp.number} wp={wp} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultatsAttendusTab({ logFrame, indicators }: { logFrame: any; indicators: any[] }) {
  const results = logFrame?.expected_results;
  const hasResults = results && Array.isArray(results) && results.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">4. Résultats attendus</h2>
        <p className="text-xs text-muted-foreground">Résultats concrets attendus du projet et indicateurs associés.</p>
      </div>
      {hasResults ? (
        <div className="border-l-2 border-accent/20 pl-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Résultats attendus</div>
          <ul className="space-y-1.5">
            {(results as string[]).map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/85">
                <span className="text-primary mt-0.5 shrink-0">R{i + 1}.</span>
                <span>{typeof r === "string" ? r : JSON.stringify(r)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Empty text="Aucun résultat attendu renseigné" />
      )}
      {indicators.length > 0 && (
        <div className="border-l-2 border-primary/20 pl-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Indicateurs ({indicators.length})</div>
          <ul className="space-y-2">
            {indicators.map((ind) => (
              <li key={ind.id} className="text-[13px] text-foreground/85">
                <span className="font-medium">{ind.name}</span>
                {ind.target_value != null && <span className="text-muted-foreground"> — Cible : {ind.target_value} {ind.unit ?? ""}</span>}
                {ind.current_value != null && <span className="text-primary ml-1">(Actuel : {ind.current_value})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
