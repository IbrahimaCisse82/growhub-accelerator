import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAssignableUsers } from "@/hooks/useAssignableUsers";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";
const textCls = "flex min-h-[80px] w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none";

const statusOptions = [
  { value: "draft", label: "Brouillon" },
  { value: "active", label: "Actif" },
  { value: "paused", label: "En pause" },
  { value: "completed", label: "Terminé" },
  { value: "cancelled", label: "Annulé" },
];

// ─── Portfolio ────────────────────────────────────────────────

interface EditPortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio: { id: string; name: string; code: string; description?: string | null; objectives?: string | null; status: string; start_date?: string | null; end_date?: string | null; owner_id?: string | null };
}

export function EditPortfolioDialog({ open, onOpenChange, portfolio }: EditPortfolioDialogProps) {
  const [name, setName] = useState(portfolio.name);
  const [code, setCode] = useState(portfolio.code);
  const [description, setDescription] = useState(portfolio.description ?? "");
  const [objectives, setObjectives] = useState(portfolio.objectives ?? "");
  const [status, setStatus] = useState(portfolio.status);
  const [startDate, setStartDate] = useState(portfolio.start_date ?? "");
  const [endDate, setEndDate] = useState(portfolio.end_date ?? "");
  const [ownerId, setOwnerId] = useState(portfolio.owner_id ?? "");
  const qc = useQueryClient();
  const { data: users } = useAssignableUsers();
  const coordinators = users?.filter(u => u.roles.includes("coordinator") || u.roles.includes("super_admin")) ?? [];

  useEffect(() => {
    setName(portfolio.name); setCode(portfolio.code); setDescription(portfolio.description ?? "");
    setObjectives(portfolio.objectives ?? ""); setStatus(portfolio.status);
    setStartDate(portfolio.start_date ?? ""); setEndDate(portfolio.end_date ?? "");
    setOwnerId(portfolio.owner_id ?? "");
  }, [portfolio]);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("portfolios").update({
        name, code, description: description || null, objectives: objectives || null,
        status: status as any, start_date: startDate || null, end_date: endDate || null,
        owner_id: ownerId || null,
      }).eq("id", portfolio.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolio"] }); qc.invalidateQueries({ queryKey: ["portfolios"] }); onOpenChange(false); toast({ title: "Portefeuille mis à jour" }); },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader><DialogTitle className="font-display">Modifier le portefeuille</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); update.mutate(); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Nom *</label><input value={name} onChange={e => setName(e.target.value)} required className={inputCls} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Code *</label><input value={code} onChange={e => setCode(e.target.value)} required className={inputCls} /></div>
          </div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className={textCls} /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Objectifs</label><textarea value={objectives} onChange={e => setObjectives(e.target.value)} className={textCls} /></div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Coordinateur superviseur</label>
            <select value={ownerId} onChange={e => setOwnerId(e.target.value)} className={inputCls}>
              <option value="">— Non assigné —</option>
              {coordinators.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Statut</label><select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>{statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} /></div>
          </div>
          <button type="submit" disabled={update.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Program ────────────────────────────────────────────────

interface EditProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: { id: string; name: string; code: string; description?: string | null; funder?: string | null; status: string; start_date?: string | null; end_date?: string | null; budget_total?: number | null; currency?: string | null; coordinator_id?: string | null };
}

export function EditProgramDialog({ open, onOpenChange, program }: EditProgramDialogProps) {
  const [name, setName] = useState(program.name);
  const [code, setCode] = useState(program.code);
  const [description, setDescription] = useState(program.description ?? "");
  const [funder, setFunder] = useState(program.funder ?? "");
  const [status, setStatus] = useState(program.status);
  const [startDate, setStartDate] = useState(program.start_date ?? "");
  const [endDate, setEndDate] = useState(program.end_date ?? "");
  const [budgetTotal, setBudgetTotal] = useState(String(program.budget_total ?? ""));
  const [currency, setCurrency] = useState(program.currency ?? "XOF");
  const [coordinatorId, setCoordinatorId] = useState(program.coordinator_id ?? "");
  const qc = useQueryClient();
  const { data: users } = useAssignableUsers();
  const coordinators = users?.filter(u => u.roles.includes("coordinator") || u.roles.includes("super_admin")) ?? [];

  useEffect(() => {
    setName(program.name); setCode(program.code); setDescription(program.description ?? "");
    setFunder(program.funder ?? ""); setStatus(program.status);
    setStartDate(program.start_date ?? ""); setEndDate(program.end_date ?? "");
    setBudgetTotal(String(program.budget_total ?? "")); setCurrency(program.currency ?? "XOF");
    setCoordinatorId(program.coordinator_id ?? "");
  }, [program]);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("programs").update({
        name, code, description: description || null, funder: funder || null,
        status: status as any, start_date: startDate || null, end_date: endDate || null,
        budget_total: budgetTotal ? parseFloat(budgetTotal) : null, currency,
        coordinator_id: coordinatorId || null,
      }).eq("id", program.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["program"] }); qc.invalidateQueries({ queryKey: ["programs"] }); onOpenChange(false); toast({ title: "Programme mis à jour" }); },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader><DialogTitle className="font-display">Modifier le programme</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); update.mutate(); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Nom *</label><input value={name} onChange={e => setName(e.target.value)} required className={inputCls} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Code *</label><input value={code} onChange={e => setCode(e.target.value)} required className={inputCls} /></div>
          </div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className={textCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Bailleur</label><input value={funder} onChange={e => setFunder(e.target.value)} className={inputCls} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Statut</label><select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>{statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Coordinateur superviseur</label>
            <select value={coordinatorId} onChange={e => setCoordinatorId(e.target.value)} className={inputCls}>
              <option value="">— Non assigné —</option>
              {coordinators.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Budget</label><input type="number" value={budgetTotal} onChange={e => setBudgetTotal(e.target.value)} className={inputCls} /></div>
          </div>
          <button type="submit" disabled={update.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Project ────────────────────────────────────────────────

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { id: string; name: string; code?: string | null; description?: string | null; status: string; start_date?: string | null; end_date?: string | null; budget?: number | null; owner_id?: string | null };
}

export function EditProjectDialog({ open, onOpenChange, project }: EditProjectDialogProps) {
  const [name, setName] = useState(project.name);
  const [code, setCode] = useState(project.code ?? "");
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState(project.status);
  const [startDate, setStartDate] = useState(project.start_date ?? "");
  const [endDate, setEndDate] = useState(project.end_date ?? "");
  const [budget, setBudget] = useState(String(project.budget ?? ""));
  const [ownerId, setOwnerId] = useState(project.owner_id ?? "");
  const qc = useQueryClient();
  const { data: users } = useAssignableUsers();
  const projectManagers = users?.filter(u => u.roles.includes("project_manager") || u.roles.includes("coordinator") || u.roles.includes("super_admin")) ?? [];

  useEffect(() => {
    setName(project.name); setCode(project.code ?? ""); setDescription(project.description ?? "");
    setStatus(project.status); setStartDate(project.start_date ?? ""); setEndDate(project.end_date ?? "");
    setBudget(String(project.budget ?? "")); setOwnerId(project.owner_id ?? "");
  }, [project]);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").update({
        name, code: code || null, description: description || null,
        status: status as any, start_date: startDate || null, end_date: endDate || null,
        budget: budget ? parseFloat(budget) : null, owner_id: ownerId || null,
      }).eq("id", project.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project"] }); qc.invalidateQueries({ queryKey: ["projects"] }); onOpenChange(false); toast({ title: "Projet mis à jour" }); },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader><DialogTitle className="font-display">Modifier le projet</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); update.mutate(); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Nom *</label><input value={name} onChange={e => setName(e.target.value)} required className={inputCls} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Code</label><input value={code} onChange={e => setCode(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className={textCls} /></div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Chef de projet</label>
            <select value={ownerId} onChange={e => setOwnerId(e.target.value)} className={inputCls}>
              <option value="">— Non assigné —</option>
              {projectManagers.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Statut</label><select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>{statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-foreground">Budget (XOF)</label><input type="number" value={budget} onChange={e => setBudget(e.target.value)} className={inputCls} /></div>
          <button type="submit" disabled={update.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
