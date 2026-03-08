import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePrograms } from "@/hooks/usePrograms";
import { useGrants } from "@/hooks/useGrants";
import { toast } from "sonner";
import GhButton from "@/components/shared/GhButton";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";
const textareaCls = inputCls + " h-24 resize-none";
const labelCls = "text-sm font-medium text-foreground";
const helpCls = "text-[11px] text-muted-foreground mt-1";

const STEPS = [
  { key: "info", label: "Informations", icon: "📋" },
  { key: "logframe", label: "Cadre logique", icon: "🎯" },
  { key: "toc", label: "Théorie du changement", icon: "🔄" },
  { key: "kpi", label: "Indicateurs KPI", icon: "📊" },
  { key: "budget", label: "Budget", icon: "💰" },
  { key: "validate", label: "Validation", icon: "✅" },
];

// --- JSON Array Editor ---
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

// --- KPI Row ---
interface KpiRow { name: string; category: string; unit: string; baseline: number; target: number; frequency: string; source: string; responsible: string }
const emptyKpi = (): KpiRow => ({ name: "", category: "output", unit: "", baseline: 0, target: 0, frequency: "quarterly", source: "", responsible: "" });

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

export default function ProjectWizardPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: programs } = usePrograms();
  const { data: grants } = useGrants();
  const qc = useQueryClient();

  // Step 1: Info
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [programId, setProgramId] = useState("");
  const [grantId, setGrantId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Step 2: Cadre logique
  const [overallObjective, setOverallObjective] = useState("");
  const [specificObjectives, setSpecificObjectives] = useState<string[]>([""]);
  const [expectedResults, setExpectedResults] = useState<string[]>([""]);
  const [lfActivities, setLfActivities] = useState<string[]>([""]);
  const [assumptions, setAssumptions] = useState("");
  const [preConditions, setPreConditions] = useState("");

  // Step 3: Théorie du changement
  const [tocInputs, setTocInputs] = useState<string[]>([""]);
  const [tocActivities, setTocActivities] = useState<string[]>([""]);
  const [tocOutputs, setTocOutputs] = useState<string[]>([""]);
  const [tocOutcomes, setTocOutcomes] = useState<string[]>([""]);
  const [tocImpact, setTocImpact] = useState("");
  const [tocAssumptions, setTocAssumptions] = useState<string[]>([""]);
  const [tocRisks, setTocRisks] = useState<string[]>([""]);

  // Step 4: KPIs
  const [kpis, setKpis] = useState<KpiRow[]>([emptyKpi()]);

  // Step 5: Budget (GTS format)
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([...DEFAULT_BUDGET_LINES]);

  const linesA = budgetLines.filter(l => l.section === "A");
  const linesB = budgetLines.filter(l => l.section === "B");
  const totalA = linesA.reduce((s, l) => s + lineTotal(l), 0);
  const totalB = linesB.reduce((s, l) => s + lineTotal(l), 0);
  const totalBudget = totalA + totalB;

  const canNext = () => {
    if (step === 0) return name && programId;
    if (step === 1) return overallObjective;
    if (step === 2) return tocImpact;
    if (step === 3) return kpis.some(k => k.name);
    if (step === 4) return budgetLines.some(b => b.desc && (b.qty > 0 || b.montant > 0));
    return true;
  };

  const createProject = useMutation({
    mutationFn: async () => {
      // 1. Create project
      const { data: project, error: pe } = await supabase.from("projects").insert({
        name, code: code || null, description: description || null,
        program_id: programId, owner_id: user?.id,
        start_date: startDate || null, end_date: endDate || null,
        budget: totalBudget,
        validation_status: "pending_review" as any,
      }).select().single();
      if (pe) throw pe;

      // 2. Logical framework
      const { error: lfe } = await supabase.from("logical_frameworks" as any).insert({
        project_id: project.id,
        overall_objective: overallObjective,
        specific_objectives: specificObjectives.filter(Boolean),
        expected_results: expectedResults.filter(Boolean),
        activities: lfActivities.filter(Boolean),
        assumptions: assumptions || null,
        pre_conditions: preConditions || null,
      });
      if (lfe) throw lfe;

      // 3. Theory of change
      const { error: toce } = await supabase.from("theory_of_change" as any).insert({
        project_id: project.id,
        inputs: tocInputs.filter(Boolean),
        activities: tocActivities.filter(Boolean),
        outputs: tocOutputs.filter(Boolean),
        outcomes: tocOutcomes.filter(Boolean),
        impact: tocImpact,
        assumptions: tocAssumptions.filter(Boolean),
        risks: tocRisks.filter(Boolean),
      });
      if (toce) throw toce;

      // 4. KPIs
      const validKpis = kpis.filter(k => k.name);
      if (validKpis.length > 0) {
        const { error: ke } = await supabase.from("project_indicators" as any).insert(
          validKpis.map(k => ({
            project_id: project.id, name: k.name, category: k.category,
            unit: k.unit || null, baseline_value: k.baseline, target_value: k.target,
            frequency: k.frequency, data_source: k.source || null, responsible: k.responsible || null,
          }))
        );
        if (ke) throw ke;
      }

      // 5. Budget lines (GTS format)
      const validBudget = budgetLines.filter(b => b.desc);
      if (validBudget.length > 0) {
        const { error: be } = await supabase.from("project_budget_lines" as any).insert(
          validBudget.map(b => ({
            project_id: project.id, category: b.section === "A" ? "operational" : "management",
            label: b.desc, code: b.code, section: b.section,
            unit: b.unit || null, quantity: b.qty, unit_cost: b.montant,
            allocation_pct: b.alloc, funding_source: null,
          }))
        );
        if (be) throw be;
      }

      // 6. Link to grant if selected
      if (grantId) {
        await supabase.from("budgets").insert({
          project_id: project.id, grant_id: grantId,
          category: "projet", label: `Budget ${name}`,
          amount_planned: totalBudget, amount_spent: 0,
        });
      }

      return project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projet créé et soumis pour validation !");
      navigate("/app/projets");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-display font-bold text-foreground">Créer un projet</h1>
        <p className="text-sm text-muted-foreground mt-1">Parcours structuré selon les standards des bailleurs de fonds</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 bg-card border border-border rounded-xl p-2">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => i <= step && setStep(i)}
            className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              i === step ? "bg-primary text-primary-foreground shadow-sm" :
              i < step ? "bg-surface-2 text-foreground cursor-pointer hover:bg-surface-3" :
              "text-muted-foreground cursor-default"
            }`}
          >
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

          {/* STEP 1: Cadre logique */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Cadre logique</h2>
                <p className={helpCls}>Le cadre logique (LogFrame) structure la logique d'intervention du projet selon la méthodologie des bailleurs internationaux : objectif global → objectifs spécifiques → résultats attendus → activités.</p>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Objectif global (impact) *</label>
                <textarea value={overallObjective} onChange={e => setOverallObjective(e.target.value)} required className={textareaCls} placeholder="Ex: Contribuer à la réduction de la pauvreté par le développement de l'entrepreneuriat innovant en Afrique de l'Ouest" />
                <p className={helpCls}>L'objectif de développement de haut niveau auquel le projet contribue.</p>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Objectifs spécifiques</label>
                <p className={helpCls}>Les effets directs du projet sur les bénéficiaires.</p>
                <ArrayEditor items={specificObjectives} onChange={setSpecificObjectives} placeholder="Objectif spécifique" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Résultats attendus</label>
                <p className={helpCls}>Les produits/livrables concrets que le projet doit produire.</p>
                <ArrayEditor items={expectedResults} onChange={setExpectedResults} placeholder="Résultat" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Activités principales</label>
                <p className={helpCls}>Les actions concrètes à mener pour atteindre les résultats.</p>
                <ArrayEditor items={lfActivities} onChange={setLfActivities} placeholder="Activité" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className={labelCls}>Hypothèses / Risques</label><textarea value={assumptions} onChange={e => setAssumptions(e.target.value)} className={textareaCls} placeholder="Conditions externes nécessaires à la réussite du projet…" /></div>
                <div className="space-y-2"><label className={labelCls}>Pré-conditions</label><textarea value={preConditions} onChange={e => setPreConditions(e.target.value)} className={textareaCls} placeholder="Conditions préalables au démarrage du projet…" /></div>
              </div>
            </div>
          )}

          {/* STEP 2: Théorie du changement */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Théorie du changement</h2>
                <p className={helpCls}>La chaîne de résultats décrit comment les ressources investies (intrants) se transforment en activités, puis en extrants, effets et impact. C'est le récit logique du changement que votre projet vise à produire.</p>
              </div>
              {/* Visual chain */}
              <div className="flex items-center gap-2 py-3 overflow-x-auto">
                {["Intrants", "Activités", "Extrants", "Effets", "Impact"].map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    {i > 0 && <span className="text-muted-foreground">→</span>}
                    <span className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs font-semibold text-foreground whitespace-nowrap">{label}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2"><label className={labelCls}>Intrants (Ressources)</label><p className={helpCls}>Ressources humaines, financières, matérielles mobilisées.</p><ArrayEditor items={tocInputs} onChange={setTocInputs} placeholder="Intrant" /></div>
              <div className="space-y-2"><label className={labelCls}>Activités</label><p className={helpCls}>Actions réalisées grâce aux intrants.</p><ArrayEditor items={tocActivities} onChange={setTocActivities} placeholder="Activité" /></div>
              <div className="space-y-2"><label className={labelCls}>Extrants (Outputs)</label><p className={helpCls}>Produits/services directement issus des activités.</p><ArrayEditor items={tocOutputs} onChange={setTocOutputs} placeholder="Extrant" /></div>
              <div className="space-y-2"><label className={labelCls}>Effets (Outcomes)</label><p className={helpCls}>Changements à moyen terme chez les bénéficiaires.</p><ArrayEditor items={tocOutcomes} onChange={setTocOutcomes} placeholder="Effet" /></div>
              <div className="space-y-2"><label className={labelCls}>Impact *</label><textarea value={tocImpact} onChange={e => setTocImpact(e.target.value)} required className={textareaCls} placeholder="Le changement transformationnel à long terme visé par le projet…" /><p className={helpCls}>Le changement systémique à long terme auquel le projet contribue.</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className={labelCls}>Hypothèses</label><ArrayEditor items={tocAssumptions} onChange={setTocAssumptions} placeholder="Hypothèse" /></div>
                <div className="space-y-2"><label className={labelCls}>Risques</label><ArrayEditor items={tocRisks} onChange={setTocRisks} placeholder="Risque" /></div>
              </div>
            </div>
          )}

          {/* STEP 3: KPIs */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Indicateurs de performance (KPI)</h2>
                <p className={helpCls}>Définissez des indicateurs mesurables pour chaque niveau de la chaîne de résultats. Chaque indicateur doit être SMART : Spécifique, Mesurable, Atteignable, Pertinent, Temporel.</p>
              </div>
              <div className="space-y-4">
                {kpis.map((kpi, i) => (
                  <div key={i} className="border border-border rounded-lg p-4 bg-surface-2 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">Indicateur {i + 1}</span>
                      {kpis.length > 1 && <button type="button" onClick={() => setKpis(kpis.filter((_, idx) => idx !== i))} className="text-destructive text-xs hover:underline">Supprimer</button>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1"><label className="text-[11px] text-muted-foreground">Nom *</label><input value={kpi.name} onChange={e => { const n = [...kpis]; n[i] = { ...n[i], name: e.target.value }; setKpis(n); }} className={inputCls} placeholder="Ex: Nombre de startups incubées" /></div>
                      <div className="space-y-1"><label className="text-[11px] text-muted-foreground">Catégorie</label>
                        <select value={kpi.category} onChange={e => { const n = [...kpis]; n[i] = { ...n[i], category: e.target.value }; setKpis(n); }} className={inputCls}>
                          <option value="input">Intrant</option><option value="activity">Activité</option><option value="output">Extrant</option><option value="outcome">Effet</option><option value="impact">Impact</option>
                        </select>
                      </div>
                      <div className="space-y-1"><label className="text-[11px] text-muted-foreground">Unité</label><input value={kpi.unit} onChange={e => { const n = [...kpis]; n[i] = { ...n[i], unit: e.target.value }; setKpis(n); }} className={inputCls} placeholder="%, nombre, XOF…" /></div>
                      <div className="space-y-1"><label className="text-[11px] text-muted-foreground">Valeur de référence</label><input type="number" value={kpi.baseline} onChange={e => { const n = [...kpis]; n[i] = { ...n[i], baseline: Number(e.target.value) }; setKpis(n); }} className={inputCls} /></div>
                      <div className="space-y-1"><label className="text-[11px] text-muted-foreground">Cible</label><input type="number" value={kpi.target} onChange={e => { const n = [...kpis]; n[i] = { ...n[i], target: Number(e.target.value) }; setKpis(n); }} className={inputCls} /></div>
                      <div className="space-y-1"><label className="text-[11px] text-muted-foreground">Fréquence</label>
                        <select value={kpi.frequency} onChange={e => { const n = [...kpis]; n[i] = { ...n[i], frequency: e.target.value }; setKpis(n); }} className={inputCls}>
                          <option value="monthly">Mensuelle</option><option value="quarterly">Trimestrielle</option><option value="biannual">Semestrielle</option><option value="annual">Annuelle</option>
                        </select>
                      </div>
                      <div className="space-y-1"><label className="text-[11px] text-muted-foreground">Source de données</label><input value={kpi.source} onChange={e => { const n = [...kpis]; n[i] = { ...n[i], source: e.target.value }; setKpis(n); }} className={inputCls} placeholder="Rapports, enquêtes…" /></div>
                      <div className="space-y-1"><label className="text-[11px] text-muted-foreground">Responsable</label><input value={kpi.responsible} onChange={e => { const n = [...kpis]; n[i] = { ...n[i], responsible: e.target.value }; setKpis(n); }} className={inputCls} /></div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setKpis([...kpis, emptyKpi()])} className="text-xs text-primary font-semibold hover:underline">+ Ajouter un indicateur</button>
              </div>
            </div>
          )}

          {/* STEP 4: Budget — Annexe 1b (GTS Format) */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Budget — Annexe 1b</h2>
                <p className={helpCls}>Répartition détaillée du budget selon la structure budgétaire des bailleurs. Formule : Qté × Montant unitaire × Allocation%. Modifiez les cellules directement.</p>
              </div>

              {/* Metrics */}
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

              {/* Budget table */}
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
                      {/* Section A */}
                      <tr><td colSpan={8} className="px-3 py-2 bg-primary/10 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">A — Coûts opérationnels</td></tr>
                      {linesA.map((line, i) => {
                        const idx = budgetLines.indexOf(line);
                        return (
                          <tr key={`a-${i}`} className="border-b border-border hover:bg-secondary/50">
                            <td className="px-3 py-1"><span className="font-mono text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{line.code}</span></td>
                            <td className="px-1 py-1"><input value={line.desc} onChange={e => { const n = [...budgetLines]; n[idx] = { ...n[idx], desc: e.target.value }; setBudgetLines(n); }} className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary focus:ring-1 focus:ring-primary rounded px-2 py-1 text-[12px] text-foreground outline-none" /></td>
                            <td className="px-1 py-1"><input value={line.unit} onChange={e => { const n = [...budgetLines]; n[idx] = { ...n[idx], unit: e.target.value }; setBudgetLines(n); }} className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-[12px] text-foreground outline-none" /></td>
                            <td className="px-1 py-1"><input type="number" value={line.qty} onChange={e => { const n = [...budgetLines]; n[idx] = { ...n[idx], qty: Number(e.target.value) }; setBudgetLines(n); }} className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-[12px] text-right font-mono text-foreground outline-none" /></td>
                            <td className="px-1 py-1"><input type="number" value={line.montant} onChange={e => { const n = [...budgetLines]; n[idx] = { ...n[idx], montant: Number(e.target.value) }; setBudgetLines(n); }} className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-[12px] text-right font-mono text-foreground outline-none" /></td>
                            <td className="px-1 py-1"><input type="number" value={line.alloc} min={0} max={100} onChange={e => { const n = [...budgetLines]; n[idx] = { ...n[idx], alloc: Number(e.target.value) }; setBudgetLines(n); }} className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-[12px] text-right font-mono text-foreground outline-none" /></td>
                            <td className="px-3 py-1 text-right"><span className="font-mono text-[12px] bg-primary/10 text-primary px-2 py-0.5 rounded">{fmt(lineTotal(line))}</span></td>
                            <td className="px-1 py-1"><button onClick={() => setBudgetLines(budgetLines.filter((_, j) => j !== idx))} className="text-destructive hover:bg-destructive/10 rounded px-1 text-sm">×</button></td>
                          </tr>
                        );
                      })}
                      <tr><td colSpan={6} className="px-3 py-1.5 text-right text-[11px] font-bold text-foreground">Sous-total A</td><td className="px-3 py-1.5 text-right font-mono text-[12px] font-bold text-foreground">{fmt(totalA)} €</td><td></td></tr>

                      {/* Section B */}
                      <tr><td colSpan={8} className="px-3 py-2 bg-accent/10 text-accent-foreground font-mono text-[10px] font-bold uppercase tracking-wider">B — Frais de gestion</td></tr>
                      {linesB.map((line, i) => {
                        const idx = budgetLines.indexOf(line);
                        return (
                          <tr key={`b-${i}`} className="border-b border-border hover:bg-secondary/50">
                            <td className="px-3 py-1"><span className="font-mono text-[11px] bg-accent/10 text-accent-foreground px-1.5 py-0.5 rounded font-semibold">{line.code}</span></td>
                            <td className="px-1 py-1"><input value={line.desc} onChange={e => { const n = [...budgetLines]; n[idx] = { ...n[idx], desc: e.target.value }; setBudgetLines(n); }} className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-[12px] text-foreground outline-none" /></td>
                            <td className="px-1 py-1"><input value={line.unit} onChange={e => { const n = [...budgetLines]; n[idx] = { ...n[idx], unit: e.target.value }; setBudgetLines(n); }} className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-[12px] text-foreground outline-none" /></td>
                            <td className="px-1 py-1"><input type="number" value={line.qty} onChange={e => { const n = [...budgetLines]; n[idx] = { ...n[idx], qty: Number(e.target.value) }; setBudgetLines(n); }} className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-[12px] text-right font-mono text-foreground outline-none" /></td>
                            <td className="px-1 py-1"><input type="number" value={line.montant} onChange={e => { const n = [...budgetLines]; n[idx] = { ...n[idx], montant: Number(e.target.value) }; setBudgetLines(n); }} className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-[12px] text-right font-mono text-foreground outline-none" /></td>
                            <td className="px-1 py-1"><input type="number" value={line.alloc} min={0} max={100} onChange={e => { const n = [...budgetLines]; n[idx] = { ...n[idx], alloc: Number(e.target.value) }; setBudgetLines(n); }} className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-[12px] text-right font-mono text-foreground outline-none" /></td>
                            <td className="px-3 py-1 text-right"><span className="font-mono text-[12px] bg-primary/10 text-primary px-2 py-0.5 rounded">{fmt(lineTotal(line))}</span></td>
                            <td className="px-1 py-1"><button onClick={() => setBudgetLines(budgetLines.filter((_, j) => j !== idx))} className="text-destructive hover:bg-destructive/10 rounded px-1 text-sm">×</button></td>
                          </tr>
                        );
                      })}
                      <tr><td colSpan={6} className="px-3 py-1.5 text-right text-[11px] font-bold text-foreground">Sous-total B</td><td className="px-3 py-1.5 text-right font-mono text-[12px] font-bold text-foreground">{fmt(totalB)} €</td><td></td></tr>

                      {/* Grand total */}
                      <tr className="bg-foreground/5">
                        <td colSpan={6} className="px-3 py-2.5 text-right text-xs font-bold text-foreground uppercase">Total général</td>
                        <td className="px-3 py-2.5 text-right font-mono text-sm font-bold text-primary">{fmt(totalBudget)} €</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Add buttons */}
                <div className="border-t border-border border-dashed flex">
                  <button onClick={() => setBudgetLines([...budgetLines, { code: `A1.X.${linesA.length + 1}`, desc: "Nouveau poste", unit: "—", qty: 0, montant: 0, alloc: 100, section: "A" }])} className="flex-1 py-2.5 text-xs text-primary font-semibold hover:bg-primary/5 transition-colors">+ Coût opérationnel (A)</button>
                  <div className="w-px bg-border" />
                  <button onClick={() => setBudgetLines([...budgetLines, { code: `B.${linesB.length + 1}`, desc: "Nouveau poste", unit: "forfait", qty: 1, montant: 0, alloc: 100, section: "B" }])} className="flex-1 py-2.5 text-xs text-accent-foreground font-semibold hover:bg-accent/5 transition-colors">+ Frais gestion (B)</button>
                </div>
              </div>

              {grantId && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs text-foreground">🔗 Ce budget sera automatiquement lié à la subvention <strong>{grants?.find(g => g.id === grantId)?.name}</strong> pour le suivi financier.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Validation */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Récapitulatif et validation</h2>
                <p className={helpCls}>Vérifiez les informations avant de soumettre le projet pour validation. Une fois validé, vous pourrez ouvrir les candidatures.</p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">📋 Projet</div>
                  <div className="text-sm font-bold text-foreground">{name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{programs?.find(p => p.id === programId)?.name}</div>
                  {startDate && <div className="text-[10px] font-mono text-muted-foreground mt-2">{startDate} → {endDate || "…"}</div>}
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">🎯 Cadre logique</div>
                  <div className="text-xs text-foreground line-clamp-2">{overallObjective}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{specificObjectives.filter(Boolean).length} obj. spécifiques · {expectedResults.filter(Boolean).length} résultats · {lfActivities.filter(Boolean).length} activités</div>
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">🔄 Théorie du changement</div>
                  <div className="text-xs text-foreground line-clamp-2">{tocImpact}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{tocInputs.filter(Boolean).length} intrants → {tocOutputs.filter(Boolean).length} extrants → {tocOutcomes.filter(Boolean).length} effets</div>
                </div>
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">📊 Indicateurs</div>
                  <div className="text-sm font-bold text-foreground">{kpis.filter(k => k.name).length} KPIs</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{kpis.filter(k => k.category === "output").length} extrants · {kpis.filter(k => k.category === "outcome").length} effets · {kpis.filter(k => k.category === "impact").length} impact</div>
                </div>
              </div>

              <div className="bg-surface-2 border border-border rounded-lg p-4">
                <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">💰 Budget</div>
                <div className="text-lg font-display font-bold text-primary">{totalBudget.toLocaleString("fr-FR")} XOF</div>
                <div className="text-[10px] text-muted-foreground">{budgetLines.filter(b => b.label).length} lignes budgétaires{grantId ? ` · Lié à ${grants?.find(g => g.id === grantId)?.name}` : ""}</div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-xs text-foreground font-semibold mb-1">📌 Prochaines étapes</p>
                <p className="text-xs text-muted-foreground">Le projet sera soumis en statut « En attente de validation ». Une fois validé par un coordinateur, vous pourrez ouvrir les candidatures pour recruter des startups.</p>
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
            <GhButton onClick={() => setStep(step + 1)} disabled={!canNext()} size="md">
              Suivant →
            </GhButton>
          ) : (
            <GhButton onClick={() => createProject.mutate()} disabled={createProject.isPending} size="md">
              {createProject.isPending ? "Création…" : "Soumettre le projet ✓"}
            </GhButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}
