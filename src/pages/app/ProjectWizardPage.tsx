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
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";
const textareaCls = inputCls + " h-24 resize-none";
const labelCls = "text-sm font-medium text-foreground";
const helpCls = "text-[11px] text-muted-foreground mt-1";

const STEPS = [
  { key: "info", label: "Informations", icon: "📋" },
  { key: "logframe", label: "Cadre logique & WP", icon: "🎯" },
  { key: "toc", label: "Théorie du changement", icon: "🔄" },
  { key: "kpi-milestones", label: "Indicateurs & Jalons", icon: "📊" },
  { key: "budget", label: "Budget", icon: "💰" },
  { key: "validate", label: "Validation", icon: "✅" },
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

// Parse existing data back into WPs
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
      title,
      objective,
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

  // Step 0: Info
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [programId, setProgramId] = useState("");
  const [grantId, setGrantId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Step 1: Cadre logique + WPs
  const [overallObjective, setOverallObjective] = useState("");
  const [wps, setWps] = useState<WpDraft[]>([emptyWp()]);
  const [assumptions, setAssumptions] = useState("");
  const [preConditions, setPreConditions] = useState("");

  // Step 2: Théorie du changement
  const [tocInputs, setTocInputs] = useState<string[]>([""]);
  const [tocActivities, setTocActivities] = useState<string[]>([""]);
  const [tocOutputs, setTocOutputs] = useState<string[]>([""]);
  const [tocOutcomes, setTocOutcomes] = useState<string[]>([""]);
  const [tocImpact, setTocImpact] = useState("");
  const [tocAssumptions, setTocAssumptions] = useState<string[]>([""]);
  const [tocRisks, setTocRisks] = useState<string[]>([""]);

  // Step 3: KPIs & Milestones per WP
  const [kpis, setKpis] = useState<KpiRow[]>([emptyKpi(0)]);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([emptyMilestone(0)]);

  // Step 4: Budget
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

  // Hydrate
  useEffect(() => {
    if (existingProject) {
      setName(existingProject.name || "");
      setCode(existingProject.code || "");
      setDescription(existingProject.description || "");
      setProgramId(existingProject.program_id || "");
      setStartDate(existingProject.start_date || "");
      setEndDate(existingProject.end_date || "");
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
        // Detect WP index from name prefix
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
    if (existingLogframe) resumeStep = 2;
    if (existingToc) resumeStep = 3;
    if (existingKpis && existingKpis.length > 0) resumeStep = 4;
    if (existingBudgetLines && existingBudgetLines.length > 0) resumeStep = 5;
    setStep(resumeStep);
  }, [projectId, existingProject, existingLogframe, existingToc, existingKpis, existingBudgetLines]);

  const canNext = () => {
    if (step === 0) return name && programId;
    if (step === 1) return overallObjective && wps.some(wp => wp.objective);
    if (step === 2) return tocImpact;
    if (step === 3) return kpis.some(k => k.name);
    if (step === 4) return budgetLines.some(b => b.desc && (b.qty > 0 || b.montant > 0));
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

  // --- Save functions ---
  const saveStep0 = async () => {
    if (projectId) {
      await supabase.from("projects").update({
        name, code: code || null, description: description || null,
        program_id: programId, start_date: startDate || null, end_date: endDate || null,
      }).eq("id", projectId).throwOnError();
      return projectId;
    } else {
      const { data } = await supabase.from("projects").insert({
        name, code: code || null, description: description || null,
        program_id: programId, owner_id: user?.id,
        start_date: startDate || null, end_date: endDate || null,
        status: "draft", validation_status: "draft",
      }).select("id").single().throwOnError();
      return data.id;
    }
  };

  const saveStep1 = async (pid: string) => {
    const payload = {
      project_id: pid,
      overall_objective: overallObjective,
      specific_objectives: flattenWpObjectives(wps),
      expected_results: flattenWpResults(wps),
      activities: flattenWpActivities(wps),
      assumptions: assumptions || null,
      pre_conditions: preConditions || null,
    };
    if (existingLogframe) {
      await supabase.from("logical_frameworks").update(payload).eq("project_id", pid).throwOnError();
    } else {
      await supabase.from("logical_frameworks").insert(payload).throwOnError();
    }
  };

  const saveStep2 = async (pid: string) => {
    const payload = {
      project_id: pid,
      inputs: tocInputs.filter(Boolean), activities: tocActivities.filter(Boolean),
      outputs: tocOutputs.filter(Boolean), outcomes: tocOutcomes.filter(Boolean),
      impact: tocImpact, assumptions: tocAssumptions.filter(Boolean), risks: tocRisks.filter(Boolean),
    };
    if (existingToc) {
      await supabase.from("theory_of_change").update(payload).eq("project_id", pid).throwOnError();
    } else {
      await supabase.from("theory_of_change").insert(payload).throwOnError();
    }
  };

  const saveStep3 = async (pid: string) => {
    // KPIs
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
    // Milestones
    await supabase.from("milestones").delete().eq("project_id", pid);
    const validMilestones = milestones.filter(m => m.title);
    if (validMilestones.length > 0) {
      const mCounters: Record<number, number> = {};
      await supabase.from("milestones").insert(
        validMilestones.map(m => {
          mCounters[m.wpIndex] = (mCounters[m.wpIndex] || 0) + 1;
          return {
            project_id: pid,
            title: `M${m.wpIndex + 1}.${mCounters[m.wpIndex]} ${m.title}`,
            due_date: m.dueDate || null,
            status: "pending",
          };
        })
      ).throwOnError();
    }
  };

  const saveStep4 = async (pid: string) => {
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
      if (step === 0) { pid = await saveStep0(); setProjectId(pid); setSearchParams({ id: pid }); qc.invalidateQueries({ queryKey: ["project-draft", pid] }); }
      else if (step === 1 && pid) { await saveStep1(pid); qc.invalidateQueries({ queryKey: ["project-logframe", pid] }); }
      else if (step === 2 && pid) { await saveStep2(pid); qc.invalidateQueries({ queryKey: ["project-toc", pid] }); }
      else if (step === 3 && pid) { await saveStep3(pid); qc.invalidateQueries({ queryKey: ["project-kpis", pid] }); qc.invalidateQueries({ queryKey: ["project-milestones-draft", pid] }); }
      else if (step === 4 && pid) { await saveStep4(pid); qc.invalidateQueries({ queryKey: ["project-budget-lines", pid] }); }
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

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 bg-card border border-border rounded-xl p-2">
        {STEPS.map((s, i) => (
          <button key={s.key} onClick={() => i <= step && setStep(i)}
            className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              i === step ? "bg-primary text-primary-foreground shadow-sm" :
              i < step ? "bg-surface-2 text-foreground cursor-pointer hover:bg-surface-3" :
              "text-muted-foreground cursor-default"
            }`}>
            <span>{s.icon}</span>
            <span className="hidden lg:inline">{s.label}</span>
            <span className="lg:hidden">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="bg-card border border-border rounded-xl p-6">

          {/* STEP 0: Info */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Informations générales</h2>
                <p className={helpCls}>Décrivez le projet, son rattachement programmatique et sa durée prévisionnelle.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1"><label className={labelCls}>Nom du projet *</label><input value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="Ex: Programme d'appui aux PME vertes" /></div>
                <div className="space-y-2"><label className={labelCls}>Code</label><input value={code} onChange={e => setCode(e.target.value)} className={inputCls} placeholder="PRJ-2026-001" /></div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className={labelCls}>Date de début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
                <div className="space-y-2"><label className={labelCls}>Date de fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} /></div>
              </div>
              <div className="space-y-2"><label className={labelCls}>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className={textareaCls} placeholder="Contexte, justification et résumé du projet…" /></div>
            </div>
          )}

          {/* STEP 1: Cadre logique + Work Packages */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Cadre logique & Work Packages</h2>
                <p className={helpCls}>Structurez la logique d'intervention en Work Packages. Chaque WP regroupe un objectif spécifique, ses activités et ses résultats attendus.</p>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Objectif global (impact) *</label>
                <textarea value={overallObjective} onChange={e => setOverallObjective(e.target.value)} required className={textareaCls} placeholder="Ex: Contribuer à la réduction de la pauvreté par le développement de l'entrepreneuriat innovant" />
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

          {/* STEP 2: Théorie du changement */}
          {step === 2 && (
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

          {/* STEP 3: KPIs & Milestones per WP */}
          {step === 3 && (
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

          {/* STEP 4: Budget */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Budget — Annexe 1b</h2>
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
                  <p className="text-xs text-foreground">🔗 Ce budget sera automatiquement lié à la subvention <strong>{grants?.find(g => g.id === grantId)?.name}</strong>.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Validation */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Récapitulatif et validation</h2>
                <p className={helpCls}>Vérifiez les informations avant de soumettre le projet.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">📋 Projet</div>
                  <div className="text-sm font-bold text-foreground">{name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{programs?.find(p => p.id === programId)?.name}</div>
                  {startDate && <div className="text-[10px] font-mono text-muted-foreground mt-2">{startDate} → {endDate || "…"}</div>}
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">📦 Work Packages</div>
                  <div className="text-sm font-bold text-foreground">{wps.length} WP{wps.length > 1 ? "s" : ""}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {wps.map((wp, i) => `WP${i + 1}: ${wp.title || "Sans titre"}`).join(" · ")}
                  </div>
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">📊 Indicateurs & Jalons</div>
                  <div className="text-sm font-bold text-foreground">{kpis.filter(k => k.name).length} KPIs · {milestones.filter(m => m.title).length} Jalons</div>
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">💰 Budget</div>
                  <div className="text-lg font-display font-bold text-primary">{fmt(totalBudget)} €</div>
                  <div className="text-[10px] text-muted-foreground">{budgetLines.filter(b => b.desc).length} lignes · A: {fmt(totalA)} € · B: {fmt(totalB)} €</div>
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-xs text-foreground font-semibold mb-1">📌 Prochaines étapes</p>
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
