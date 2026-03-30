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
import { buildWorkPackages } from "@/lib/workPackageUtils";
import EntityDocumentsTab from "@/components/shared/EntityDocumentsTab";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useAssignableUsers";
import { EditProjectDialog } from "@/components/dialogs/EditEntityDialogs";
import ValidateEntityDialog from "@/components/dialogs/ValidateEntityDialog";

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
      <Tabs defaultValue="identification" className="w-full">
        <TabsList className="bg-secondary border border-border flex-wrap">
          <TabsTrigger value="identification">Identification</TabsTrigger>
          <TabsTrigger value="contexte">Contexte & Justification</TabsTrigger>
          <TabsTrigger value="workpackages">Objectifs & Cadre logique ({workPackages.length})</TabsTrigger>
          <TabsTrigger value="toc">Théorie du changement</TabsTrigger>
          <TabsTrigger value="budget">Budget ({budgetLines?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Identification tab */}
        <TabsContent value="identification" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            {description && <Field label="Description" value={description} />}
            {project.country && <Field label="Pays" value={project.country} />}
            {project.locations && (project.locations as string[]).length > 0 && (
              <JsonList label="Lieux d'implémentation" items={project.locations} />
            )}
            {project.duration_months && <Field label="Durée" value={`${project.duration_months} mois`} />}
            {project.start_date && <Field label="Date de début" value={new Date(project.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} />}
            {project.end_date && <Field label="Date de fin" value={new Date(project.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} />}
            {!description && !project.country && !project.start_date && <Empty text="Aucune information d'identification renseignée" />}
          </div>
        </TabsContent>

        {/* Contexte & Justification tab */}
        <TabsContent value="contexte" className="mt-4">
          <ContexteJustificationTab metadata={project.metadata as Record<string, unknown> | null} />
        </TabsContent>

        {/* Work Packages tab */}
        <TabsContent value="workpackages" className="mt-4">
          {workPackages.length > 0 ? (
            <div className="space-y-4">
              {workPackages.map((wp) => (
                <WorkPackageCard key={wp.number} wp={wp} />
              ))}
            </div>
          ) : (
            <Empty text="Aucun Work Package défini — renseignez le cadre logique avec des objectifs spécifiques" />
          )}
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

function ContexteJustificationTab({ metadata }: { metadata: Record<string, unknown> | null }) {
  const meta = metadata ?? {};
  const introduction = meta.introduction as string | undefined;
  const contexteJustification = meta.contexte_justification as string | undefined;
  const contexte = meta.contexte_territorial as string | undefined;
  const contraintes = meta.contraintes_vulnerabilites as string | undefined;
  const alignement = meta.alignement_strategique as string | undefined;
  const justification = meta.justification as string | undefined;

  const hasContent = introduction || contexte || contraintes || alignement || justification;

  if (!hasContent) return <Empty text="Contexte et justification non renseignés — complétez via le Wizard" />;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Contexte et justification</h2>
        <p className="text-xs text-muted-foreground">Décrivez le contexte dans lequel s'inscrit le projet, les contraintes identifiées et la justification de l'intervention.</p>
      </div>
      {introduction && <Field label="Introduction" value={introduction} />}
      {contexte && <Field label="Contexte territorial" value={contexte} />}
      {contraintes && <Field label="Contraintes structurelles et vulnérabilités" value={contraintes} />}
      {alignement && <Field label="Alignement stratégique" value={alignement} />}
      {justification && <Field label="Justification du projet" value={justification} />}
    </div>
  );
}
