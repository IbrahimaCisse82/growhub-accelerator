import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

interface Grant {
  id: string;
  name: string;
  code: string;
  amount_total: number;
  amount_disbursed?: number | null;
  organization?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
}

export default function EditGrantDialog({ grant, children, open: controlledOpen, onOpenChange }: { grant: Grant; children?: React.ReactNode; open?: boolean; onOpenChange?: (o: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const [name, setName] = useState(grant.name);
  const [code, setCode] = useState(grant.code);
  const [amountTotal, setAmountTotal] = useState(String(grant.amount_total));
  const [amountDisbursed, setAmountDisbursed] = useState(String(grant.amount_disbursed ?? 0));
  const [organization, setOrganization] = useState(grant.organization ?? "");
  const [description, setDescription] = useState(grant.description ?? "");
  const [startDate, setStartDate] = useState(grant.start_date ?? "");
  const [endDate, setEndDate] = useState(grant.end_date ?? "");
  const [status, setStatus] = useState(grant.status);
  const qc = useQueryClient();

  useEffect(() => {
    if (open) {
      setName(grant.name);
      setCode(grant.code);
      setAmountTotal(String(grant.amount_total));
      setAmountDisbursed(String(grant.amount_disbursed ?? 0));
      setOrganization(grant.organization ?? "");
      setDescription(grant.description ?? "");
      setStartDate(grant.start_date ?? "");
      setEndDate(grant.end_date ?? "");
      setStatus(grant.status);
    }
  }, [open, grant]);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("grants").update({
        name, code,
        amount_total: parseFloat(amountTotal) || 0,
        amount_disbursed: parseFloat(amountDisbursed) || 0,
        organization: organization || null,
        description: description || null,
        start_date: startDate || null,
        end_date: endDate || null,
        status: status as GrantStatus,
      }).eq("id", grant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grants"] });
      qc.invalidateQueries({ queryKey: ["grant_detail", grant.id] });
      setOpen(false);
      toast({ title: "Grant mis à jour" });
    },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  const statusOptions = [
    { value: "draft", label: "Brouillon" },
    { value: "active", label: "Active" },
    { value: "disbursing", label: "Décaissement" },
    { value: "closing", label: "Clôture" },
    { value: "closed", label: "Clôturé" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Modifier le grant</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); update.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nom *</label>
            <input value={name} onChange={e => setName(e.target.value)} required className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Code *</label>
              <input value={code} onChange={e => setCode(e.target.value)} required className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Montant total *</label>
              <input type="number" value={amountTotal} onChange={e => setAmountTotal(e.target.value)} required className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Décaissé</label>
              <input type="number" value={amountDisbursed} onChange={e => setAmountDisbursed(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Organisation</label>
            <input value={organization} onChange={e => setOrganization(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputCls + " h-auto"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Date début</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Date fin</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          <button type="submit" disabled={update.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
