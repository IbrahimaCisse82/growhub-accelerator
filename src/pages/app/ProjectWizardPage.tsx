import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePrograms } from "@/hooks/usePrograms";
import { useGrants } from "@/hooks/useGrants";
import { toast } from "sonner";
import GhButton from "@/components/shared/GhButton";
import { ChevronDown, ChevronRight, Plus, Trash2, FileText, Target, Layers, Lightbulb, Users, RefreshCw, BarChart3, Activity, DollarSign, CheckCircle2 } from "lucide-react";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";
const textareaCls = inputCls + " h-24 resize-none";
const textareaLgCls = inputCls + " h-36 resize-none";
const labelCls = "text-sm font-medium text-foreground";
const helpCls = "text-[11px] text-muted-foreground mt-1";
const sectionTitleCls = "text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2 mb-3";

const STEPS = [
  { key: "identification", label: "Identification", icon: FileText },
  { key: "contexte", label: "Contexte & Justification", icon: FileText },
  { key: "logframe", label: "Objectifs & Cadre logique", icon: Target },
  { key: "strategie", label: "Stratégie & Méthodologie", icon: Lightbulb },
  { key: "beneficiaires", label: "Bénéficiaires & Parties prenantes", icon: Users },
  { key: "toc", label: "Théorie du changement", icon: RefreshCw },
  { key: "kpi-milestones", label: "Indicateurs & Jalons", icon: BarChart3 },
  { key: "suivi", label: "Suivi-Évaluation & Durabilité", icon: Activity },
  { key: "budget", label: "Budget", icon: DollarSign },
  { key: "validate", label: "Validation", icon: CheckCircle2 },
];

// --- Work Package Draft ---
interface WpDraft {
  title: string;
  objective: string;
  activities: string[];
  results: string[];
}

const emptyWp = (): WpDraft => ({ title: "", objective: "", activities: [""], results: [""] });

// --- KPI per WP ---
interface KpiRow { name: string; category: string; unit: string; baseline: number; target: number; frequency: string; source: string; responsible: string; wpIndex: number }
const emptyKpi = (wpIndex: number): KpiRow => ({ name: "", category: "output", unit: "", baseline: 0, target: 0, frequency: "quarterly", source: "", responsible: "", wpIndex });

// --- Milestone per WP ---
interface MilestoneDraft { title: string; dueDate: string; wpIndex: number }
const emptyMilestone = (wpIndex: number): MilestoneDraft => ({ title: "", dueDate: "", wpIndex });

// --- Budget Line (GTS Format) ---
interface BudgetLine { code: string; desc: string; unit: string; qty: number; montant: number; alloc: number; section: "A" | "B" }
const DEFAULT_BUDGET_LINES: BudgetLine[] = [
  { code: "A1.1.1", desc: "Experts (personnel employé par le bénéficiaire)", unit: "homme/mois", qty: 0, montant: 0, alloc: 100, section: "A" },
  { code: "A1.1.2", desc: "Déplacements et indemnités journalières", unit: "voyages", qty: 0, montant: 0, alloc: 100, section: "A" },
  { code: "A1.1.3", desc: "Consultants (externes)", unit: "jours", qty: 0, montant: 150, alloc: 100, section: "A" },
  { code: "A1.1.4", desc: "Formations, ateliers, conférences, séminaires", unit: "sessions", qty: 0, montant: 0, alloc: 100, section: "A" },
  { code: "A1.1.5", desc: "Sous-bénéficiaires", unit: "contrats", qty: 0, montant: 0, alloc: 100, section: "A" },
  { code: "A1.1.6", desc: "Achats de matériel et d'équipements", unit: "unités", qty: 0, montant: 0, alloc: 100, section: "A" },
  { code: "A1.1.7", desc: "Sous-Subventions", unit: "—", qty: 0, montant: 0, alloc: 100, section: "A" },
  { code: "A1.1.8", desc: "Autres coûts opérationnels", unit: "—", qty: 0, montant: 0, alloc: 100, section: "A" },
  { code: "B.1", desc: "Frais de gestion / coûts de structure", unit: "forfait", qty: 1, montant: 0, alloc: 100, section: "B" },
];
const lineTotal = (l: BudgetLine) => (l.qty || 0) * (l.montant || 0) * ((l.alloc || 100) / 100);
const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

// --- Metadata interface for new sections ---
interface ProjectMetadata {
  introduction?: string;
  contexte_justification?: string;
  contexte_territorial?: string;
  contraintes?: string;
  alignement_strategique?: string;
  justification?: string;
  strategie_objectif?: string;
  strategie_axes?: string[];
  strategie_modalites?: string;
  methodologie?: string;
  population_cible?: string;
  estimation_beneficiaires?: string;
  personnel_cle?: { role: string; profil: string }[];
  partenaires?: { categorie: string; description: string }[];
  suivi_outils?: string;
  suivi_evaluation?: string;
  suivi_rapports?: string;
  plan_sortie?: string;
}

// --- Array Editor ---
function ArrayEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const add = () => onChange([...items, ""]);
  const update = (i: number, v: string) => { const n = [...items]; n[i] = v; onChange(n); };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input value={item} onChange={e => update(i, e.target.value)} placeholder={`${placeholder} ${i + 1}`} className={inputCls} />
          <button type="button" onClick={() => remove(i)} className="text-destructive text-xs px-2 hover:bg-destructive/10 rounded-lg transition-colors">✕</button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-primary font-semibold hover:underline">+ Ajouter</button>
    </div>
  );
}

// --- WP prefix helpers ---
function flattenWpActivities(wps: WpDraft[]): string[] {
  return wps.flatMap((wp, i) => wp.activities.filter(Boolean).map((a, j) => `A${i + 1}.${j + 1} ${a}`));
}
function flattenWpResults(wps: WpDraft[]): string[] {
  return wps.flatMap((wp, i) => wp.results.filter(Boolean).map((r, j) => `R${i + 1}.${j + 1} ${r}`));
}
function flattenWpObjectives(wps: WpDraft[]): string[] {
  return wps.map(wp => wp.title ? `${wp.title}: ${wp.objective}` : wp.objective);
}

function parseWpsFromLogframe(logframe: { specific_objectives?: unknown; activities?: unknown; expected_results?: unknown }): WpDraft[] {
  const objectives = toArr(logframe.specific_objectives);
  if (objectives.length === 0) return [emptyWp()];
  return objectives.map((obj, idx) => {
    const wpNum = idx + 1;
    let title = "";
    let objective = obj;
    const colonIdx = obj.indexOf(":");
    if (colonIdx > 0 && colonIdx < 80) {
      title = obj.substring(0, colonIdx).trim();
      objective = obj.substring(colonIdx + 1).trim();
    }
    const activities = toArr(logframe.activities)
      .filter(a => new RegExp(`^A${wpNum}\\.\\d`, "i").test(a.trim()))
      .map(a => a.replace(/^A\d+\.\d+\s*/i, "").trim());
    const results = toArr(logframe.expected_results)
      .filter(r => new RegExp(`^R${wpNum}\\.\\d`, "i").test(r.trim()))
      .map(r => r.replace(/^R\d+\.\d+\s*/i, "").trim());
    return {
      title, objective,
      activities: activities.length > 0 ? activities : [""],
      results: results.length > 0 ? results : [""],
    };
  });
}

function toArr(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.map(v => typeof v === "string" ? v : JSON.stringify(v));
}

const wpColors = ["from-primary/80 to-primary", "from-accent/80 to-accent", "from-emerald-500/80 to-emerald-600", "from-amber-500/80 to-amber-600", "from-violet-500/80 to-violet-600", "from-rose-500/80 to-rose-600"];

export default function ProjectWizardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(searchParams.get("id"));
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: programs } = usePrograms();
  const { data: grants } = useGrants();
  const qc = useQueryClient();

  // Step 0: Identification
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [programId, setProgramId] = useState("");
  const [grantId, setGrantId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [country, setCountry] = useState("");
  const [locations, setLocations] = useState<string[]>([""]);
  const [durationMonths, setDurationMonths] = useState("");

  // Step 1: Contexte & Justification (metadata)
  const [introduction, setIntroduction] = useState("");
  const [contexteJustification, setContexteJustification] = useState("");
  const [contexteT, setContexteT] = useState("");
  const [contraintes, setContraintes] = useState("");
  const [alignement, setAlignement] = useState("");
  const [justification, setJustification] = useState("");

  // Step 2: Cadre logique + WPs
  const [overallObjective, setOverallObjective] = useState("");
  const [wps, setWps] = useState<WpDraft[]>([emptyWp()]);
  const [assumptions, setAssumptions] = useState("");
  const [preConditions, setPreConditions] = useState("");

  // Step 3: Stratégie & Méthodologie (metadata)
  const [strategieObjectif, setStrategieObjectif] = useState("");
  const [strategieAxes, setStrategieAxes] = useState<string[]>([""]);
  const [strategieModalites, setStrategieModalites] = useState("");
  const [methodologie, setMethodologie] = useState("");

  // Step 4: Bénéficiaires & Parties prenantes (metadata)
  const [populationCible, setPopulationCible] = useState("");
  const [estimationBeneficiaires, setEstimationBeneficiaires] = useState("");
  const [personnelCle, setPersonnelCle] = useState<{ role: string; profil: string }[]>([{ role: "", profil: "" }]);
  const [partenaires, setPartenaires] = useState<{ categorie: string; description: string }[]>([{ categorie: "", description: "" }]);

  // Step 5: Théorie du changement
  const [tocInputs, setTocInputs] = useState<string[]>([""]);
  const [tocActivities, setTocActivities] = useState<string[]>([""]);
  const [tocOutputs, setTocOutputs] = useState<string[]>([""]);
  const [tocOutcomes, setTocOutcomes] = useState<string[]>([""]);
  const [tocImpact, setTocImpact] = useState("");
  const [tocAssumptions, setTocAssumptions] = useState<string[]>([""]);
  const [tocRisks, setTocRisks] = useState<string[]>([""]);

  // Step 6: KPIs & Milestones per WP
  const [kpis, setKpis] = useState<KpiRow[]>([emptyKpi(0)]);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([emptyMilestone(0)]);

  // Step 7: Suivi-Évaluation & Durabilité (metadata)
  const [suiviOutils, setSuiviOutils] = useState("");
  const [suiviEvaluation, setSuiviEvaluation] = useState("");
  const [suiviRapports, setSuiviRapports] = useState("");
  const [planSortie, setPlanSortie] = useState("");

  // Step 8: Budget
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([...DEFAULT_BUDGET_LINES]);

  const linesA = budgetLines.filter(l => l.section === "A");
  const linesB = budgetLines.filter(l => l.section === "B");
  const totalA = linesA.reduce((s, l) => s + lineTotal(l), 0);
  const totalB = linesB.reduce((s, l) => s + lineTotal(l), 0);
  const totalBudget = totalA + totalB;

  // --- Load existing draft ---
  const { data: existingProject } = useQuery({
    queryKey: ["project-draft", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: existingLogframe } = useQuery({
    queryKey: ["project-logframe", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await supabase.from("logical_frameworks").select("*").eq("project_id", projectId).maybeSingle();
      return data;
    },
    enabled: !!projectId,
  });

  const { data: existingToc } = useQuery({
    queryKey: ["project-toc", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await supabase.from("theory_of_change").select("*").eq("project_id", projectId).maybeSingle();
      return data;
    },
    enabled: !!projectId,
  });

  const { data: existingKpis } = useQuery({
    queryKey: ["project-kpis", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await supabase.from("project_indicators").select("*").eq("project_id", projectId);
      return data;
    },
    enabled: !!projectId,
  });

  const { data: existingMilestones } = useQuery({
    queryKey: ["project-milestones-draft", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await supabase.from("milestones").select("*").eq("project_id", projectId).order("due_date");
      return data;
    },
    enabled: !!projectId,
  });

  const { data: existingBudgetLines } = useQuery({
    queryKey: ["project-budget-lines", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await supabase.from("project_budget_lines").select("*").eq("project_id", projectId);
      return data;
    },
    enabled: !!projectId,
  });

  // Hydrate from existing project
  useEffect(() => {
    if (existingProject) {
      setName(existingProject.name || "");
      setCode(existingProject.code || "");
      setDescription(existingProject.description || "");
      setProgramId(existingProject.program_id || "");
      setStartDate(existingProject.start_date || "");
      setEndDate(existingProject.end_date || "");
      // New fields
      const p = existingProject as any;
      setCountry(p.country || "");
      setLocations(p.locations?.length > 0 ? p.locations : [""]);
      setDurationMonths(p.duration_months ? String(p.duration_months) : "");
      // Metadata
      const meta: ProjectMetadata = (p.metadata as ProjectMetadata) || {};
      setIntroduction(meta.introduction || "");
      setContexteJustification(meta.contexte_justification || "");
      setContexteT(meta.contexte_territorial || "");
      setContraintes(meta.contraintes || "");
      setAlignement(meta.alignement_strategique || "");
      setJustification(meta.justification || "");
      setStrategieObjectif(meta.strategie_objectif || "");
      setStrategieAxes(meta.strategie_axes?.length ? meta.strategie_axes : [""]);
      setStrategieModalites(meta.strategie_modalites || "");
      setMethodologie(meta.methodologie || "");
      setPopulationCible(meta.population_cible || "");
      setEstimationBeneficiaires(meta.estimation_beneficiaires || "");
      setPersonnelCle(meta.personnel_cle?.length ? meta.personnel_cle : [{ role: "", profil: "" }]);
      setPartenaires(meta.partenaires?.length ? meta.partenaires : [{ categorie: "", description: "" }]);
      setSuiviOutils(meta.suivi_outils || "");
      setSuiviEvaluation(meta.suivi_evaluation || "");
      setSuiviRapports(meta.suivi_rapports || "");
      setPlanSortie(meta.plan_sortie || "");
    }
  }, [existingProject]);

  useEffect(() => {
    if (existingLogframe) {
      setOverallObjective(existingLogframe.overall_objective || "");
      setAssumptions(existingLogframe.assumptions || "");
      setPreConditions(existingLogframe.pre_conditions || "");
      const parsed = parseWpsFromLogframe(existingLogframe);
      setWps(parsed);
    }
  }, [existingLogframe]);

  useEffect(() => {
    if (existingToc) {
      const inp = existingToc.inputs as string[] | null;
      setTocInputs(inp && inp.length > 0 ? inp : [""]);
      const act = existingToc.activities as string[] | null;
      setTocActivities(act && act.length > 0 ? act : [""]);
      const out = existingToc.outputs as string[] | null;
      setTocOutputs(out && out.length > 0 ? out : [""]);
      const oc = existingToc.outcomes as string[] | null;
      setTocOutcomes(oc && oc.length > 0 ? oc : [""]);
      setTocImpact(existingToc.impact || "");
      const as_ = existingToc.assumptions as string[] | null;
      setTocAssumptions(as_ && as_.length > 0 ? as_ : [""]);
      const ri = existingToc.risks as string[] | null;
      setTocRisks(ri && ri.length > 0 ? ri : [""]);
    }
  }, [existingToc]);

  useEffect(() => {
    if (existingKpis && existingKpis.length > 0) {
      setKpis(existingKpis.map(k => {
        const match = k.name.match(/^I(\d+)\.\d+\s*/i);
        const wpIdx = match ? parseInt(match[1]) - 1 : 0;
        return {
          name: k.name.replace(/^I\d+\.\d+\s*/i, "").trim(),
          category: k.category || "output", unit: k.unit || "",
          baseline: Number(k.baseline_value) || 0, target: Number(k.target_value) || 0,
          frequency: k.frequency || "quarterly", source: k.data_source || "",
          responsible: k.responsible || "", wpIndex: wpIdx,
        };
      }));
    }
  }, [existingKpis]);

  useEffect(() => {
    if (existingMilestones && existingMilestones.length > 0) {
      setMilestones(existingMilestones.map(m => {
        const match = m.title.match(/^M(\d+)\.\d+\s*/i);
        const wpIdx = match ? parseInt(match[1]) - 1 : 0;
        return {
          title: m.title.replace(/^M\d+\.\d+\s*/i, "").trim(),
          dueDate: m.due_date || "",
          wpIndex: wpIdx,
        };
      }));
    }
  }, [existingMilestones]);

  useEffect(() => {
    if (existingBudgetLines && existingBudgetLines.length > 0) {
      setBudgetLines(existingBudgetLines.map(b => ({
        code: b.code || "", desc: b.label, unit: b.unit || "—",
        qty: Number(b.quantity) || 0, montant: Number(b.unit_cost) || 0,
        alloc: Number(b.allocation_pct) || 100, section: (b.section === "B" ? "B" : "A") as "A" | "B",
      })));
    }
  }, [existingBudgetLines]);

  // Resume step
  useEffect(() => {
    if (!projectId || !existingProject) return;
    let resumeStep = 1;
    const p = existingProject as any;
    const meta: ProjectMetadata = (p.metadata as ProjectMetadata) || {};
    if (meta.introduction || meta.justification) resumeStep = 2;
    if (existingLogframe) resumeStep = 3;
    if (meta.strategie_objectif || meta.methodologie) resumeStep = 4;
    if (meta.population_cible) resumeStep = 5;
    if (existingToc) resumeStep = 6;
    if (existingKpis && existingKpis.length > 0) resumeStep = 7;
    if (meta.suivi_outils || meta.plan_sortie) resumeStep = 8;
    if (existingBudgetLines && existingBudgetLines.length > 0) resumeStep = 9;
    setStep(resumeStep);
  }, [projectId, existingProject, existingLogframe, existingToc, existingKpis, existingBudgetLines]);

  const canNext = () => {
    if (step === 0) return name && programId;
    if (step === 1) return true; // optional context
    if (step === 2) return overallObjective && wps.some(wp => wp.objective);
    if (step === 3) return true; // optional strategy
    if (step === 4) return true; // optional beneficiaries
    if (step === 5) return tocImpact;
    if (step === 6) return kpis.some(k => k.name);
    if (step === 7) return true; // optional M&E
    if (step === 8) return budgetLines.some(b => b.desc && (b.qty > 0 || b.montant > 0));
    return true;
  };

  // WP helpers
  const updateWp = (idx: number, partial: Partial<WpDraft>) => {
    const n = [...wps]; n[idx] = { ...n[idx], ...partial }; setWps(n);
  };
  const addWp = () => setWps([...wps, emptyWp()]);
  const removeWp = (idx: number) => {
    if (wps.length <= 1) return;
    setWps(wps.filter((_, i) => i !== idx));
    setKpis(kpis.filter(k => k.wpIndex !== idx).map(k => ({ ...k, wpIndex: k.wpIndex > idx ? k.wpIndex - 1 : k.wpIndex })));
    setMilestones(milestones.filter(m => m.wpIndex !== idx).map(m => ({ ...m, wpIndex: m.wpIndex > idx ? m.wpIndex - 1 : m.wpIndex })));
  };

  // --- Build metadata ---
  const buildMetadata = (): ProjectMetadata => ({
    introduction, contexte_justification: contexteJustification, contexte_territorial: contexteT, contraintes, alignement_strategique: alignement, justification,
    strategie_objectif: strategieObjectif, strategie_axes: strategieAxes.filter(Boolean), strategie_modalites: strategieModalites,
    methodologie, population_cible: populationCible, estimation_beneficiaires: estimationBeneficiaires,
    personnel_cle: personnelCle.filter(p => p.role), partenaires: partenaires.filter(p => p.categorie),
    suivi_outils: suiviOutils, suivi_evaluation: suiviEvaluation, suivi_rapports: suiviRapports, plan_sortie: planSortie,
  });

  // --- Save functions ---
  const saveStep0 = async () => {
    const meta = buildMetadata();
    if (projectId) {
      await supabase.from("projects").update({
        name, code: code || null, description: description || null,
        program_id: programId, start_date: startDate || null, end_date: endDate || null,
        country: country || null, locations: locations.filter(Boolean).length > 0 ? locations.filter(Boolean) : null,
        duration_months: durationMonths ? parseInt(durationMonths) : null, metadata: meta as any,
      } as any).eq("id", projectId).throwOnError();
      return projectId;
    } else {
      const { data } = await supabase.from("projects").insert({
        name, code: code || null, description: description || null,
        program_id: programId, owner_id: user?.id,
        start_date: startDate || null, end_date: endDate || null,
        status: "draft", validation_status: "draft",
        country: country || null, locations: locations.filter(Boolean).length > 0 ? locations.filter(Boolean) : null,
        duration_months: durationMonths ? parseInt(durationMonths) : null, metadata: meta as any,
      } as any).select("id").single().throwOnError();
      return data.id;
    }
  };

  const saveMetadata = async (pid: string) => {
    const meta = buildMetadata();
    await supabase.from("projects").update({ metadata: meta as any } as any).eq("id", pid).throwOnError();
  };

  const saveLogframe = async (pid: string) => {
    const payload = {
      project_id: pid,
      overall_objective: overallObjective,
      specific_objectives: flattenWpObjectives(wps),
      expected_results: flattenWpResults(wps),
      activities: flattenWpActivities(wps),
      assumptions: assumptions || null,
      pre_conditions: preConditions || null,
    };
    await supabase.from("logical_frameworks").upsert(payload, { onConflict: "project_id" }).throwOnError();
  };

  const saveToc = async (pid: string) => {
    const payload = {
      project_id: pid,
      inputs: tocInputs.filter(Boolean), activities: tocActivities.filter(Boolean),
      outputs: tocOutputs.filter(Boolean), outcomes: tocOutcomes.filter(Boolean),
      impact: tocImpact, assumptions: tocAssumptions.filter(Boolean), risks: tocRisks.filter(Boolean),
    };
    await supabase.from("theory_of_change").upsert(payload, { onConflict: "project_id" }).throwOnError();
  };

  const saveKpisMilestones = async (pid: string) => {
    await supabase.from("project_indicators").delete().eq("project_id", pid);
    const validKpis = kpis.filter(k => k.name);
    if (validKpis.length > 0) {
      const kpiCounters: Record<number, number> = {};
      await supabase.from("project_indicators").insert(
        validKpis.map(k => {
          kpiCounters[k.wpIndex] = (kpiCounters[k.wpIndex] || 0) + 1;
          return {
            project_id: pid,
            name: `I${k.wpIndex + 1}.${kpiCounters[k.wpIndex]} ${k.name}`,
            category: k.category, unit: k.unit || null,
            baseline_value: k.baseline, target_value: k.target,
            frequency: k.frequency, data_source: k.source || null,
            responsible: k.responsible || null,
          };
        })
      ).throwOnError();
    }
    await supabase.from("milestones").delete().eq("project_id", pid);
    const validMilestones = milestones.filter(m => m.title);
    if (validMilestones.length > 0) {
      const mCounters: Record<number, number> = {};
      await supabase.from("milestones").insert(
        validMilestones.map(m => {
          mCounters[m.wpIndex] = (mCounters[m.wpIndex] || 0) + 1;
          return {
            project_id: pid, title: `M${m.wpIndex + 1}.${mCounters[m.wpIndex]} ${m.title}`,
            due_date: m.dueDate || null, status: "pending",
          };
        })
      ).throwOnError();
    }
  };

  const saveBudget = async (pid: string) => {
    await supabase.from("project_budget_lines").delete().eq("project_id", pid);
    const validBudget = budgetLines.filter(b => b.desc);
    if (validBudget.length > 0) {
      await supabase.from("project_budget_lines").insert(
        validBudget.map(b => ({
          project_id: pid, category: b.section === "A" ? "operational" : "management",
          label: b.desc, code: b.code, section: b.section,
          unit: b.unit || null, quantity: b.qty, unit_cost: b.montant, allocation_pct: b.alloc, funding_source: null,
        }))
      ).throwOnError();
    }
    await supabase.from("projects").update({ budget: totalBudget }).eq("id", pid);
    if (grantId) {
      const { data: eb } = await supabase.from("budgets").select("id").eq("project_id", pid).eq("grant_id", grantId).maybeSingle();
      if (!eb) {
        await supabase.from("budgets").insert({ project_id: pid, grant_id: grantId, category: "projet", label: `Budget ${name}`, amount_planned: totalBudget, amount_spent: 0 });
      } else {
        await supabase.from("budgets").update({ amount_planned: totalBudget }).eq("id", eb.id);
      }
    }
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      let pid = projectId;
      if (step === 0) {
        pid = await saveStep0();
        setProjectId(pid); setSearchParams({ id: pid });
        qc.invalidateQueries({ queryKey: ["project-draft", pid] });
      } else if (step === 1 && pid) {
        await saveMetadata(pid);
      } else if (step === 2 && pid) {
        await saveLogframe(pid);
        qc.invalidateQueries({ queryKey: ["project-logframe", pid] });
      } else if (step === 3 && pid) {
        await saveMetadata(pid);
      } else if (step === 4 && pid) {
        await saveMetadata(pid);
      } else if (step === 5 && pid) {
        await saveToc(pid);
        qc.invalidateQueries({ queryKey: ["project-toc", pid] });
      } else if (step === 6 && pid) {
        await saveKpisMilestones(pid);
        qc.invalidateQueries({ queryKey: ["project-kpis", pid] });
        qc.invalidateQueries({ queryKey: ["project-milestones-draft", pid] });
      } else if (step === 7 && pid) {
        await saveMetadata(pid);
      } else if (step === 8 && pid) {
        await saveBudget(pid);
        qc.invalidateQueries({ queryKey: ["project-budget-lines", pid] });
      }
      toast.success("Données enregistrées ✓");
      setStep(step + 1);
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  const submitProject = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Projet introuvable");
      await supabase.from("projects").update({ validation_status: "pending_review", budget: totalBudget }).eq("id", projectId).throwOnError();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Projet soumis pour validation !"); navigate("/app/projets"); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-display font-bold text-foreground">Créer un projet</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Parcours structuré selon les standards des bailleurs de fonds
          {projectId && <span className="ml-2 text-primary font-mono text-[10px]">Brouillon enregistré</span>}
        </p>
      </div>

      {/* Stepper - scrollable */}
      <div className="flex items-center gap-1 mb-8 bg-card border border-border rounded-xl p-2 overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button key={s.key} onClick={() => i <= step && setStep(i)}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                i === step ? "bg-primary text-primary-foreground shadow-sm" :
                i < step ? "bg-surface-2 text-foreground cursor-pointer hover:bg-surface-3" :
                "text-muted-foreground cursor-default"
              }`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline whitespace-nowrap">{s.label}</span>
              <span className="xl:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="bg-card border border-border rounded-xl p-6">

          {/* STEP 0: Identification du projet */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Identification du projet</h2>
                <p className={helpCls}>Informations générales d'identification : intitulé, rattachement programmatique, pays, lieux d'implémentation et durée prévisionnelle.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2"><label className={labelCls}>Intitulé du projet *</label><input value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="Ex: Projet d'Appui à l'Entrepreneuriat Rural Innovant et Durable (PAERID)" /></div>
                <div className="space-y-2"><label className={labelCls}>Code</label><input value={code} onChange={e => setCode(e.target.value)} className={inputCls} placeholder="PRJ-2026-001" /></div>
                <div className="space-y-2"><label className={labelCls}>Pays</label><input value={country} onChange={e => setCountry(e.target.value)} className={inputCls} placeholder="Ex: Sénégal" /></div>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Lieu(x) d'implémentation</label>
                <ArrayEditor items={locations} onChange={setLocations} placeholder="Région / Ville" />
                <p className={helpCls}>Indiquez les régions ou villes où le projet sera mis en œuvre.</p>
              </div>
              <div className="space-y-2"><label className={labelCls}>Programme de rattachement *</label>
                <select value={programId} onChange={e => setProgramId(e.target.value)} required className={inputCls}>
                  <option value="">Sélectionner…</option>
                  {programs?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div className="space-y-2"><label className={labelCls}>Grant / Subvention associée</label>
                <select value={grantId} onChange={e => setGrantId(e.target.value)} className={inputCls}>
                  <option value="">Aucune (optionnel)</option>
                  {grants?.map(g => <option key={g.id} value={g.id}>{g.name} — {g.code}</option>)}
                </select>
                <p className={helpCls}>Lier à une subvention pour le suivi budgétaire automatique.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><label className={labelCls}>Date de début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
                <div className="space-y-2"><label className={labelCls}>Date de fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} /></div>
                <div className="space-y-2"><label className={labelCls}>Durée (mois)</label><input type="number" value={durationMonths} onChange={e => setDurationMonths(e.target.value)} className={inputCls} placeholder="Ex: 36" /></div>
              </div>
              <div className="space-y-2"><label className={labelCls}>Résumé du projet</label><textarea value={description} onChange={e => setDescription(e.target.value)} className={textareaLgCls} placeholder="Résumé exécutif du projet…" /></div>
            </div>
          )}

          {/* STEP 1: Contexte et justification */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Contexte et justification</h2>
                <p className={helpCls}>Décrivez le contexte dans lequel s'inscrit le projet, les contraintes identifiées et la justification de l'intervention.</p>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Introduction</label>
                <textarea value={introduction} onChange={e => setIntroduction(e.target.value)} className={textareaLgCls} placeholder="Présentation générale du contexte et de la problématique adressée par le projet…" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Contexte et justification du projet</label>
                <textarea value={contexteJustification} onChange={e => setContexteJustification(e.target.value)} className={textareaLgCls} placeholder="Décrivez le contexte global et la justification du projet : pourquoi ce projet est pertinent dans le contexte actuel…" />
              </div>
              <div className="space-y-2">
                <textarea value={contexteT} onChange={e => setContexteT(e.target.value)} className={textareaLgCls} placeholder="Description du contexte géographique, socio-économique et institutionnel des zones d'intervention…" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Contraintes structurelles et vulnérabilités</label>
                <textarea value={contraintes} onChange={e => setContraintes(e.target.value)} className={textareaLgCls} placeholder="Contraintes identifiées : accès limité aux financements, faible productivité, vulnérabilité climatique…" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Alignement avec les orientations stratégiques</label>
                <textarea value={alignement} onChange={e => setAlignement(e.target.value)} className={textareaCls} placeholder="Cohérence avec les politiques nationales, stratégies des bailleurs et ODD…" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Justification de l'intervention</label>
                <textarea value={justification} onChange={e => setJustification(e.target.value)} className={textareaLgCls} placeholder="Pourquoi ce projet est nécessaire et comment il répond aux problèmes identifiés…" />
              </div>
            </div>
          )}

          {/* STEP 2: Objectifs & Cadre logique + Work Packages */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Objectifs & Cadre logique</h2>
                <p className={helpCls}>Définissez l'objectif général, les objectifs spécifiques par Work Packages, les activités et les résultats attendus.</p>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Objectif général (impact) *</label>
                <textarea value={overallObjective} onChange={e => setOverallObjective(e.target.value)} required className={textareaCls} placeholder="Ex: Contribuer à la transformation structurelle et durable des économies rurales…" />
              </div>

              {/* Work Packages */}
              <div className="space-y-4">
                {wps.map((wp, idx) => (
                  <WpEditor key={idx} wp={wp} index={idx} total={wps.length}
                    onChange={(partial) => updateWp(idx, partial)}
                    onRemove={() => removeWp(idx)} />
                ))}
                <button type="button" onClick={addWp} className="w-full border-2 border-dashed border-border rounded-xl py-3 text-sm text-primary font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Ajouter un Work Package
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className={labelCls}>Hypothèses</label><textarea value={assumptions} onChange={e => setAssumptions(e.target.value)} className={textareaCls} placeholder="Conditions externes nécessaires…" /></div>
                <div className="space-y-2"><label className={labelCls}>Pré-conditions</label><textarea value={preConditions} onChange={e => setPreConditions(e.target.value)} className={textareaCls} placeholder="Conditions préalables au démarrage…" /></div>
              </div>
            </div>
          )}

          {/* STEP 3: Stratégie & Méthodologie */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Stratégie d'implémentation & Méthodologie</h2>
                <p className={helpCls}>Décrivez la stratégie globale de mise en œuvre, les principaux axes d'action et la méthodologie retenue.</p>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Objectif de la stratégie</label>
                <textarea value={strategieObjectif} onChange={e => setStrategieObjectif(e.target.value)} className={textareaCls} placeholder="Quel est l'objectif de votre stratégie d'implémentation…" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Principaux axes d'action</label>
                <ArrayEditor items={strategieAxes} onChange={setStrategieAxes} placeholder="Axe d'action" />
                <p className={helpCls}>Ex: Amélioration de l'accès au marché, Renforcement de la résilience, Autonomisation et emplois…</p>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Modalités de mise en œuvre</label>
                <textarea value={strategieModalites} onChange={e => setStrategieModalites(e.target.value)} className={textareaLgCls} placeholder="Approche intégrée, capitalisation sur l'expertise locale, mécanismes de suivi et ajustement…" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Méthodologie</label>
                <textarea value={methodologie} onChange={e => setMethodologie(e.target.value)} className={textareaLgCls} placeholder="Méthodes de mise en œuvre : approche participative, accompagnement structuré, formation par les pairs…" />
              </div>
            </div>
          )}

          {/* STEP 4: Bénéficiaires & Parties prenantes */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Bénéficiaires & Parties prenantes</h2>
                <p className={helpCls}>Identifiez la population cible, estimez le nombre de bénéficiaires, décrivez le personnel clé et les partenaires du projet.</p>
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Population cible / Bénéficiaires</label>
                <textarea value={populationCible} onChange={e => setPopulationCible(e.target.value)} className={textareaLgCls} placeholder="TPE et PME rurales, GIE, coopératives, femmes entrepreneures, jeunes entrepreneurs…" />
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Estimation des bénéficiaires</label>
                <textarea value={estimationBeneficiaires} onChange={e => setEstimationBeneficiaires(e.target.value)} className={textareaCls} placeholder="Nombre estimé de bénéficiaires directs et indirects, ventilation par région…" />
              </div>

              {/* Personnel clé */}
              <div className="space-y-3">
                <div className={sectionTitleCls}>Personnel clé impliqué</div>
                {personnelCle.map((p, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 bg-surface-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-mono text-muted-foreground">Poste {i + 1}</span>
                      {personnelCle.length > 1 && <button type="button" onClick={() => setPersonnelCle(personnelCle.filter((_, j) => j !== i))} className="text-destructive text-xs hover:underline">Supprimer</button>}
                    </div>
                    <input value={p.role} onChange={e => { const n = [...personnelCle]; n[i] = { ...n[i], role: e.target.value }; setPersonnelCle(n); }} className={inputCls} placeholder="Rôle / Fonction (ex: Chef de projet)" />
                    <textarea value={p.profil} onChange={e => { const n = [...personnelCle]; n[i] = { ...n[i], profil: e.target.value }; setPersonnelCle(n); }} className={textareaCls} placeholder="Profil requis et responsabilités…" />
                  </div>
                ))}
                <button type="button" onClick={() => setPersonnelCle([...personnelCle, { role: "", profil: "" }])} className="text-xs text-primary font-semibold hover:underline">+ Ajouter un poste</button>
              </div>

              {/* Partenaires */}
              <div className="space-y-3">
                <div className={sectionTitleCls}>Partenaires cibles du programme</div>
                {partenaires.map((p, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 bg-surface-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-mono text-muted-foreground">Partenaire {i + 1}</span>
                      {partenaires.length > 1 && <button type="button" onClick={() => setPartenaires(partenaires.filter((_, j) => j !== i))} className="text-destructive text-xs hover:underline">Supprimer</button>}
                    </div>
                    <select value={p.categorie} onChange={e => { const n = [...partenaires]; n[i] = { ...n[i], categorie: e.target.value }; setPartenaires(n); }} className={inputCls}>
                      <option value="">Catégorie…</option>
                      <option value="institutionnel">Institutionnel & Gouvernemental</option>
                      <option value="financier">Financier</option>
                      <option value="technique">Technique & Recherche</option>
                      <option value="prive">Secteur Privé</option>
                      <option value="autre">Autre</option>
                    </select>
                    <textarea value={p.description} onChange={e => { const n = [...partenaires]; n[i] = { ...n[i], description: e.target.value }; setPartenaires(n); }} className={textareaCls} placeholder="Description du partenaire, rôle et justification…" />
                  </div>
                ))}
                <button type="button" onClick={() => setPartenaires([...partenaires, { categorie: "", description: "" }])} className="text-xs text-primary font-semibold hover:underline">+ Ajouter un partenaire</button>
              </div>
            </div>
          )}

          {/* STEP 5: Théorie du changement */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Théorie du changement</h2>
                <p className={helpCls}>La chaîne de résultats décrit comment les ressources se transforment en impact.</p>
              </div>
              <div className="flex items-center gap-2 py-3 overflow-x-auto">
                {["Intrants", "Activités", "Extrants", "Effets", "Impact"].map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    {i > 0 && <span className="text-muted-foreground">→</span>}
                    <span className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs font-semibold text-foreground whitespace-nowrap">{label}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2"><label className={labelCls}>Intrants</label><ArrayEditor items={tocInputs} onChange={setTocInputs} placeholder="Intrant" /></div>
              <div className="space-y-2"><label className={labelCls}>Activités</label><ArrayEditor items={tocActivities} onChange={setTocActivities} placeholder="Activité" /></div>
              <div className="space-y-2"><label className={labelCls}>Extrants (Outputs)</label><ArrayEditor items={tocOutputs} onChange={setTocOutputs} placeholder="Extrant" /></div>
              <div className="space-y-2"><label className={labelCls}>Effets (Outcomes)</label><ArrayEditor items={tocOutcomes} onChange={setTocOutcomes} placeholder="Effet" /></div>
              <div className="space-y-2"><label className={labelCls}>Impact *</label><textarea value={tocImpact} onChange={e => setTocImpact(e.target.value)} required className={textareaCls} placeholder="Le changement transformationnel à long terme…" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className={labelCls}>Hypothèses</label><ArrayEditor items={tocAssumptions} onChange={setTocAssumptions} placeholder="Hypothèse" /></div>
                <div className="space-y-2"><label className={labelCls}>Risques</label><ArrayEditor items={tocRisks} onChange={setTocRisks} placeholder="Risque" /></div>
              </div>
            </div>
          )}

          {/* STEP 6: KPIs & Milestones per WP */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Indicateurs & Jalons par Work Package</h2>
                <p className={helpCls}>Définissez des indicateurs SMART et des jalons pour chaque WP.</p>
              </div>

              {wps.map((wp, wpIdx) => (
                <div key={wpIdx} className="border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-secondary/50">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${wpColors[wpIdx % wpColors.length]} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                      WP{wpIdx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-foreground truncate">{wp.title || `Work Package ${wpIdx + 1}`}</div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* KPIs for this WP */}
                    <div>
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Indicateurs</label>
                      <div className="space-y-3 mt-2">
                        {kpis.filter(k => k.wpIndex === wpIdx).map((kpi, i) => {
                          const globalIdx = kpis.indexOf(kpi);
                          return (
                            <div key={globalIdx} className="border border-border rounded-lg p-3 bg-surface-2 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-mono text-muted-foreground">I{wpIdx + 1}.{i + 1}</span>
                                <button type="button" onClick={() => setKpis(kpis.filter((_, j) => j !== globalIdx))} className="text-destructive text-xs hover:underline">Supprimer</button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="col-span-2"><input value={kpi.name} onChange={e => { const n = [...kpis]; n[globalIdx] = { ...n[globalIdx], name: e.target.value }; setKpis(n); }} className={inputCls} placeholder="Nom de l'indicateur *" /></div>
                                <select value={kpi.category} onChange={e => { const n = [...kpis]; n[globalIdx] = { ...n[globalIdx], category: e.target.value }; setKpis(n); }} className={inputCls}>
                                  <option value="input">Intrant</option><option value="activity">Activité</option><option value="output">Extrant</option><option value="outcome">Effet</option><option value="impact">Impact</option>
                                </select>
                                <input value={kpi.unit} onChange={e => { const n = [...kpis]; n[globalIdx] = { ...n[globalIdx], unit: e.target.value }; setKpis(n); }} className={inputCls} placeholder="Unité" />
                                <input type="number" value={kpi.baseline} onChange={e => { const n = [...kpis]; n[globalIdx] = { ...n[globalIdx], baseline: Number(e.target.value) }; setKpis(n); }} className={inputCls} placeholder="Réf." />
                                <input type="number" value={kpi.target} onChange={e => { const n = [...kpis]; n[globalIdx] = { ...n[globalIdx], target: Number(e.target.value) }; setKpis(n); }} className={inputCls} placeholder="Cible" />
                                <select value={kpi.frequency} onChange={e => { const n = [...kpis]; n[globalIdx] = { ...n[globalIdx], frequency: e.target.value }; setKpis(n); }} className={inputCls}>
                                  <option value="monthly">Mensuelle</option><option value="quarterly">Trimestrielle</option><option value="biannual">Semestrielle</option><option value="annual">Annuelle</option>
                                </select>
                                <input value={kpi.responsible} onChange={e => { const n = [...kpis]; n[globalIdx] = { ...n[globalIdx], responsible: e.target.value }; setKpis(n); }} className={inputCls} placeholder="Responsable" />
                              </div>
                            </div>
                          );
                        })}
                        <button type="button" onClick={() => setKpis([...kpis, emptyKpi(wpIdx)])} className="text-xs text-primary font-semibold hover:underline">+ Ajouter un indicateur</button>
                      </div>
                    </div>

                    {/* Milestones for this WP */}
                    <div>
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Jalons</label>
                      <div className="space-y-2 mt-2">
                        {milestones.filter(m => m.wpIndex === wpIdx).map((m, i) => {
                          const globalIdx = milestones.indexOf(m);
                          return (
                            <div key={globalIdx} className="flex gap-2 items-center">
                              <span className="text-[11px] font-mono text-muted-foreground shrink-0 w-8">M{wpIdx + 1}.{i + 1}</span>
                              <input value={m.title} onChange={e => { const n = [...milestones]; n[globalIdx] = { ...n[globalIdx], title: e.target.value }; setMilestones(n); }} className={inputCls} placeholder="Titre du jalon" />
                              <input type="date" value={m.dueDate} onChange={e => { const n = [...milestones]; n[globalIdx] = { ...n[globalIdx], dueDate: e.target.value }; setMilestones(n); }} className={inputCls + " w-40 shrink-0"} />
                              <button type="button" onClick={() => setMilestones(milestones.filter((_, j) => j !== globalIdx))} className="text-destructive text-xs px-2 hover:bg-destructive/10 rounded-lg">✕</button>
                            </div>
                          );
                        })}
                        <button type="button" onClick={() => setMilestones([...milestones, emptyMilestone(wpIdx)])} className="text-xs text-primary font-semibold hover:underline">+ Ajouter un jalon</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 7: Suivi-Évaluation & Durabilité */}
          {step === 7 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Suivi-Évaluation & Plan de durabilité</h2>
                <p className={helpCls}>Décrivez le dispositif de suivi-évaluation, les outils utilisés et la stratégie de sortie / durabilité.</p>
              </div>

              <div className={sectionTitleCls}>Suivi et Évaluation</div>
              <div className="space-y-2">
                <label className={labelCls}>Outils et méthodes de suivi</label>
                <textarea value={suiviOutils} onChange={e => setSuiviOutils(e.target.value)} className={textareaLgCls} placeholder="Tableau de bord KPIs, base de données bénéficiaires, rapports d'activités, visites de terrain, enquêtes de satisfaction, mécanisme d'alerte précoce…" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Évaluation</label>
                <textarea value={suiviEvaluation} onChange={e => setSuiviEvaluation(e.target.value)} className={textareaCls} placeholder="Évaluation à mi-parcours, évaluation finale, critères CAD/OCDE…" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Rapports et communication des résultats</label>
                <textarea value={suiviRapports} onChange={e => setSuiviRapports(e.target.value)} className={textareaCls} placeholder="Fréquence des rapports narratifs et financiers, ateliers de restitution, plan de communication…" />
              </div>

              <div className={sectionTitleCls + " mt-6"}>Plan de sortie / Stratégie de durabilité</div>
              <div className="space-y-2">
                <label className={labelCls}>Exit Strategy</label>
                <textarea value={planSortie} onChange={e => setPlanSortie(e.target.value)} className={textareaLgCls} placeholder="Institutionnalisation des services, mobilisation de nouvelles ressources, autonomie des bénéficiaires, influence sur les politiques publiques…" />
              </div>
            </div>
          )}

          {/* STEP 8: Budget */}
          {step === 8 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Budget prévisionnel — Annexe 1b</h2>
                <p className={helpCls}>Répartition détaillée du budget. Formule : Qté × Montant unitaire × Allocation%.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-2 border border-border rounded-lg p-3">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">Coûts opérationnels (A)</div>
                  <div className="text-base font-mono font-bold text-foreground mt-1">{fmt(totalA)} €</div>
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-3">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">Frais de gestion (B)</div>
                  <div className="text-base font-mono font-bold text-foreground mt-1">{fmt(totalB)} €</div>
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-3">
                  <div className="text-[10px] font-mono uppercase text-primary">Budget TOTAL</div>
                  <div className="text-base font-mono font-bold text-primary mt-1">{fmt(totalBudget)} €</div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-secondary">
                        <th className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground w-[80px]">Code</th>
                        <th className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground">Description</th>
                        <th className="px-3 py-2 text-left text-[10px] font-mono uppercase text-muted-foreground w-[80px]">Unité</th>
                        <th className="px-3 py-2 text-right text-[10px] font-mono uppercase text-muted-foreground w-[60px]">Qté</th>
                        <th className="px-3 py-2 text-right text-[10px] font-mono uppercase text-muted-foreground w-[90px]">Mont. unit.</th>
                        <th className="px-3 py-2 text-right text-[10px] font-mono uppercase text-muted-foreground w-[60px]">Alloc.%</th>
                        <th className="px-3 py-2 text-right text-[10px] font-mono uppercase text-muted-foreground w-[100px]">Total EUR</th>
                        <th className="w-[30px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td colSpan={8} className="px-3 py-2 bg-primary/10 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">A — Coûts opérationnels</td></tr>
                      {linesA.map((line, i) => <BudgetRow key={`a-${i}`} line={line} idx={budgetLines.indexOf(line)} budgetLines={budgetLines} setBudgetLines={setBudgetLines} />)}
                      <tr><td colSpan={6} className="px-3 py-1.5 text-right text-[11px] font-bold text-foreground">Sous-total A</td><td className="px-3 py-1.5 text-right font-mono text-[12px] font-bold text-foreground">{fmt(totalA)} €</td><td></td></tr>
                      <tr><td colSpan={8} className="px-3 py-2 bg-accent/10 text-accent-foreground font-mono text-[10px] font-bold uppercase tracking-wider">B — Frais de gestion</td></tr>
                      {linesB.map((line, i) => <BudgetRow key={`b-${i}`} line={line} idx={budgetLines.indexOf(line)} budgetLines={budgetLines} setBudgetLines={setBudgetLines} />)}
                      <tr><td colSpan={6} className="px-3 py-1.5 text-right text-[11px] font-bold text-foreground">Sous-total B</td><td className="px-3 py-1.5 text-right font-mono text-[12px] font-bold text-foreground">{fmt(totalB)} €</td><td></td></tr>
                      <tr className="bg-foreground/5">
                        <td colSpan={6} className="px-3 py-2.5 text-right text-xs font-bold text-foreground uppercase">Total général</td>
                        <td className="px-3 py-2.5 text-right font-mono text-sm font-bold text-primary">{fmt(totalBudget)} €</td><td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-border border-dashed flex">
                  <button onClick={() => setBudgetLines([...budgetLines, { code: `A1.X.${linesA.length + 1}`, desc: "Nouveau poste", unit: "—", qty: 0, montant: 0, alloc: 100, section: "A" }])} className="flex-1 py-2.5 text-xs text-primary font-semibold hover:bg-primary/5 transition-colors">+ Coût opérationnel (A)</button>
                  <div className="w-px bg-border" />
                  <button onClick={() => setBudgetLines([...budgetLines, { code: `B.${linesB.length + 1}`, desc: "Nouveau poste", unit: "forfait", qty: 1, montant: 0, alloc: 100, section: "B" }])} className="flex-1 py-2.5 text-xs text-accent-foreground font-semibold hover:bg-accent/5 transition-colors">+ Frais gestion (B)</button>
                </div>
              </div>
              {grantId && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs text-foreground">Ce budget sera automatiquement lié à la subvention <strong>{grants?.find(g => g.id === grantId)?.name}</strong>.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 9: Validation */}
          {step === 9 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Récapitulatif et validation</h2>
                <p className={helpCls}>Vérifiez les informations avant de soumettre le projet.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2"><FileText className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[10px] font-mono uppercase text-muted-foreground">Projet</span></div>
                  <div className="text-sm font-bold text-foreground">{name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{programs?.find(p => p.id === programId)?.name}</div>
                  {country && <div className="text-[10px] text-muted-foreground mt-1">{country}{locations.filter(Boolean).length > 0 ? ` — ${locations.filter(Boolean).join(", ")}` : ""}</div>}
                  {startDate && <div className="text-[10px] font-mono text-muted-foreground mt-1">{startDate} → {endDate || "…"}{durationMonths ? ` (${durationMonths} mois)` : ""}</div>}
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2"><FileText className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[10px] font-mono uppercase text-muted-foreground">Contexte</span></div>
                  <div className="text-xs text-muted-foreground">
                    {[introduction, contexteT, contraintes, justification].filter(Boolean).length} section(s) renseignées
                  </div>
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2"><Layers className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[10px] font-mono uppercase text-muted-foreground">Work Packages</span></div>
                  <div className="text-sm font-bold text-foreground">{wps.length} WP{wps.length > 1 ? "s" : ""}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {wps.map((wp, i) => `WP${i + 1}: ${wp.title || "Sans titre"}`).join(" · ")}
                  </div>
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2"><Lightbulb className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[10px] font-mono uppercase text-muted-foreground">Stratégie</span></div>
                  <div className="text-xs text-muted-foreground">
                    {strategieAxes.filter(Boolean).length} axe(s) · {methodologie ? "Méthodologie ✓" : "—"}
                  </div>
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2"><Users className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[10px] font-mono uppercase text-muted-foreground">Parties prenantes</span></div>
                  <div className="text-xs text-muted-foreground">
                    {personnelCle.filter(p => p.role).length} poste(s) · {partenaires.filter(p => p.categorie).length} partenaire(s)
                  </div>
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[10px] font-mono uppercase text-muted-foreground">Indicateurs & Jalons</span></div>
                  <div className="text-sm font-bold text-foreground">{kpis.filter(k => k.name).length} KPIs · {milestones.filter(m => m.title).length} Jalons</div>
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2"><Activity className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[10px] font-mono uppercase text-muted-foreground">Suivi & Durabilité</span></div>
                  <div className="text-xs text-muted-foreground">
                    {[suiviOutils, suiviEvaluation, planSortie].filter(Boolean).length} / 3 sections renseignées
                  </div>
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4 sm:col-span-2">
                  <div className="flex items-center gap-2 mb-2"><DollarSign className="w-3.5 h-3.5 text-primary" /><span className="text-[10px] font-mono uppercase text-primary">Budget</span></div>
                  <div className="text-lg font-display font-bold text-primary">{fmt(totalBudget)} €</div>
                  <div className="text-[10px] text-muted-foreground">{budgetLines.filter(b => b.desc).length} lignes · A: {fmt(totalA)} € · B: {fmt(totalB)} €</div>
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-xs text-foreground font-semibold mb-1">Prochaines étapes</p>
                <p className="text-xs text-muted-foreground">Le projet sera soumis en statut « En attente de validation ». Une fois validé, vous pourrez ouvrir les candidatures.</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <GhButton variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : navigate("/app/projets")} size="md">
          {step > 0 ? "← Précédent" : "Annuler"}
        </GhButton>
        <div className="flex gap-2">
          {step < STEPS.length - 1 ? (
            <GhButton onClick={handleNext} disabled={!canNext() || saving} size="md">
              {saving ? "Enregistrement…" : "Suivant →"}
            </GhButton>
          ) : (
            <GhButton onClick={() => submitProject.mutate()} disabled={submitProject.isPending} size="md">
              {submitProject.isPending ? "Soumission…" : "Soumettre le projet ✓"}
            </GhButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Sub-components ── */

function WpEditor({ wp, index, total, onChange, onRemove }: {
  wp: WpDraft; index: number; total: number;
  onChange: (partial: Partial<WpDraft>) => void; onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const gradient = wpColors[index % wpColors.length];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
          WP{index + 1}
        </div>
        <div className="flex-1 text-left min-w-0">
          <span className="text-sm font-bold text-foreground truncate block">{wp.title || `Work Package ${index + 1}`}</span>
        </div>
        {total > 1 && (
          <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }} className="text-destructive hover:bg-destructive/10 rounded p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-4 space-y-4 border-t border-border">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Titre du WP *</label>
              <input value={wp.title} onChange={e => onChange({ title: e.target.value })} className={inputCls}
                placeholder={`Ex: Renforcement des compétences`} />
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <label className="text-[11px] text-muted-foreground font-medium">Objectif spécifique *</label>
              <textarea value={wp.objective} onChange={e => onChange({ objective: e.target.value })}
                className={inputCls + " h-20 resize-none"} placeholder="Objectif de ce Work Package…" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] text-muted-foreground font-medium">Activités</label>
            <ArrayEditor items={wp.activities} onChange={a => onChange({ activities: a })} placeholder={`A${index + 1}.X`} />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] text-muted-foreground font-medium">Résultats attendus</label>
            <ArrayEditor items={wp.results} onChange={r => onChange({ results: r })} placeholder={`R${index + 1}.X`} />
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetRow({ line, idx, budgetLines, setBudgetLines }: {
  line: BudgetLine; idx: number; budgetLines: BudgetLine[]; setBudgetLines: (v: BudgetLine[]) => void;
}) {
  const cellCls = "w-full bg-transparent border border-transparent hover:border-border focus:border-primary focus:ring-1 focus:ring-primary rounded px-2 py-1 text-[12px] text-foreground outline-none";
  const update = (partial: Partial<BudgetLine>) => {
    const n = [...budgetLines]; n[idx] = { ...n[idx], ...partial }; setBudgetLines(n);
  };
  return (
    <tr className="border-b border-border hover:bg-secondary/50">
      <td className="px-3 py-1"><span className="font-mono text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{line.code}</span></td>
      <td className="px-1 py-1"><input value={line.desc} onChange={e => update({ desc: e.target.value })} className={cellCls} /></td>
      <td className="px-1 py-1"><input value={line.unit} onChange={e => update({ unit: e.target.value })} className={cellCls} /></td>
      <td className="px-1 py-1"><input type="number" value={line.qty} onChange={e => update({ qty: Number(e.target.value) })} className={cellCls + " text-right font-mono"} /></td>
      <td className="px-1 py-1"><input type="number" value={line.montant} onChange={e => update({ montant: Number(e.target.value) })} className={cellCls + " text-right font-mono"} /></td>
      <td className="px-1 py-1"><input type="number" value={line.alloc} min={0} max={100} onChange={e => update({ alloc: Number(e.target.value) })} className={cellCls + " text-right font-mono"} /></td>
      <td className="px-3 py-1 text-right"><span className="font-mono text-[12px] bg-primary/10 text-primary px-2 py-0.5 rounded">{fmt(lineTotal(line))}</span></td>
      <td className="px-1 py-1"><button onClick={() => setBudgetLines(budgetLines.filter((_, j) => j !== idx))} className="text-destructive hover:bg-destructive/10 rounded px-1 text-sm">×</button></td>
    </tr>
  );
}
