import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import GhButton from "@/components/shared/GhButton";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function BookSlotDialog({ slot, mentorName }: { slot: any; mentorName: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const book = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("mentor_availability_slots").update({
        is_booked: true,
        booked_by: user!.id,
        booked_at: new Date().toISOString(),
      }).eq("id", slot.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availability-slots"] });
      toast({ title: "✓ Créneau réservé avec " + mentorName });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GhButton variant="primary" size="sm">Réserver</GhButton>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Confirmer la réservation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-surface-2 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mentor</span>
              <span className="font-semibold text-foreground">{mentorName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-mono text-foreground">{format(new Date(slot.start_at), "EEEE dd MMMM yyyy", { locale: fr })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Horaire</span>
              <span className="font-mono text-foreground">
                {format(new Date(slot.start_at), "HH:mm")} — {format(new Date(slot.end_at), "HH:mm")}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <GhButton variant="ghost" onClick={() => setOpen(false)} className="flex-1">Annuler</GhButton>
            <GhButton onClick={() => book.mutate()} disabled={book.isPending} className="flex-1">
              Confirmer la réservation
            </GhButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
