import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import GhButton from "@/components/shared/GhButton";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

export default function BookSlotDialog({ slot, mentorName }: { slot: any; mentorName: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  // Check for conflicts with user's existing bookings AND coaching sessions
  const { data: conflicts } = useQuery({
    queryKey: ["slot-conflicts", user?.id, slot.id, open],
    enabled: !!user?.id && open,
    queryFn: async () => {
      const slotStart = new Date(slot.start_at).getTime();
      const slotEnd = new Date(slot.end_at).getTime();

      const [bookingsRes, sessionsRes] = await Promise.all([
        supabase.from("mentor_availability_slots")
          .select("id, start_at, end_at")
          .eq("booked_by", user!.id)
          .eq("is_booked", true),
        supabase.from("coaching_sessions")
          .select("id, title, scheduled_at, duration_minutes, status")
          .in("status", ["planned", "confirmed"]),
      ]);

      const bookingConflicts = (bookingsRes.data ?? []).filter(b => {
        const s = new Date(b.start_at).getTime();
        const e = new Date(b.end_at).getTime();
        return s < slotEnd && e > slotStart;
      });

      const sessionConflicts = (sessionsRes.data ?? []).filter(cs => {
        const s = new Date(cs.scheduled_at).getTime();
        const e = s + (cs.duration_minutes ?? 60) * 60_000;
        return s < slotEnd && e > slotStart;
      });

      return { bookings: bookingConflicts, sessions: sessionConflicts };
    },
  });

  const hasConflict = (conflicts?.bookings.length ?? 0) > 0 || (conflicts?.sessions.length ?? 0) > 0;

  const book = useMutation({
    mutationFn: async () => {
      // Re-check conflicts atomically right before booking
      const { data: stillFree } = await supabase
        .from("mentor_availability_slots")
        .select("is_booked")
        .eq("id", slot.id)
        .single();
      if (stillFree?.is_booked) throw new Error("Ce créneau a déjà été réservé.");

      const { error } = await supabase.from("mentor_availability_slots").update({
        is_booked: true,
        booked_by: user!.id,
        booked_at: new Date().toISOString(),
      }).eq("id", slot.id).eq("is_booked", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availability-slots"] });
      toast({ title: "✓ Créneau réservé avec " + mentorName });
      setOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
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

          {hasConflict && (
            <div className="bg-gh-amber/10 border border-gh-amber/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-gh-amber font-semibold text-sm">
                <AlertTriangle size={14} /> Conflit détecté
              </div>
              {conflicts?.bookings.map(c => (
                <div key={c.id} className="text-[11px] text-foreground">
                  • Réservation existante : {format(new Date(c.start_at), "dd/MM HH:mm")} — {format(new Date(c.end_at), "HH:mm")}
                </div>
              ))}
              {conflicts?.sessions.map(c => (
                <div key={c.id} className="text-[11px] text-foreground">
                  • Session « {c.title} » : {format(new Date(c.scheduled_at), "dd/MM HH:mm")}
                </div>
              ))}
              <div className="text-[10px] text-muted-foreground pt-1">
                Tu peux quand même confirmer, mais cela créera un chevauchement.
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <GhButton variant="ghost" onClick={() => setOpen(false)} className="flex-1">Annuler</GhButton>
            <GhButton
              onClick={() => book.mutate()}
              disabled={book.isPending}
              variant={hasConflict ? "secondary" : "primary"}
              className="flex-1"
            >
              {hasConflict ? "Confirmer malgré le conflit" : "Confirmer la réservation"}
            </GhButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
