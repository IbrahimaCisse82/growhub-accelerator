import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import GhButton from "@/components/shared/GhButton";
import { toast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Repeat } from "lucide-react";

export default function AddAvailabilityDialog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [open, setOpen] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurWeeks, setRecurWeeks] = useState(4);

  const addSlot = useMutation({
    mutationFn: async () => {
      const dates: string[] = [date];
      if (recurring) {
        for (let w = 1; w < recurWeeks; w++) {
          const d = addDays(new Date(date), w * 7);
          dates.push(format(d, "yyyy-MM-dd"));
        }
      }
      const rows = dates.map(d => ({
        mentor_id: user!.id,
        start_at: new Date(`${d}T${startTime}:00`).toISOString(),
        end_at: new Date(`${d}T${endTime}:00`).toISOString(),
      }));
      // Validate
      for (const r of rows) {
        if (new Date(r.end_at) <= new Date(r.start_at)) {
          throw new Error("L'heure de fin doit être après le début");
        }
      }
      const { error } = await supabase.from("mentor_availability_slots").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availability-slots"] });
      toast({ title: recurring ? `✓ ${recurWeeks} créneaux ajoutés` : "✓ Créneau ajouté" });
      setOpen(false);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GhButton>+ Ajouter créneau</GhButton>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Ajouter un créneau de disponibilité</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Début</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Fin</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            </div>
          </div>

          {/* Recurring toggle */}
          <div className="border border-border rounded-lg p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => setRecurring(v => !v)}
                className={`w-9 h-5 rounded-full transition-colors relative ${recurring ? "bg-primary" : "bg-border"}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${recurring ? "translate-x-4" : "translate-x-1"}`} />
              </button>
              <span className="text-xs text-foreground flex items-center gap-1">
                <Repeat size={12} /> Récurrent (chaque semaine)
              </span>
            </label>
            {recurring && (
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Nombre de semaines</label>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={recurWeeks}
                  onChange={e => setRecurWeeks(Number(e.target.value))}
                  className="w-20 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm text-foreground"
                />
                <span className="text-[10px] text-muted-foreground ml-2">semaines ({recurWeeks} créneaux)</span>
              </div>
            )}
          </div>

          <GhButton onClick={() => addSlot.mutate()} disabled={!date || addSlot.isPending} className="w-full">
            {recurring ? `Créer ${recurWeeks} créneaux` : "Confirmer"}
          </GhButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
