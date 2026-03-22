import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import StatCard from "@/components/shared/StatCard";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek, isSameDay, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function useAvailabilitySlots() {
  return useQuery({
    queryKey: ["availability-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_availability_slots")
        .select("*")
        .gte("start_at", new Date().toISOString())
        .order("start_at");
      if (error) throw error;
      return data;
    },
  });
}

function useMentorProfiles() {
  return useQuery({
    queryKey: ["mentor-profiles-scheduling"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_profiles")
        .select("user_id, expertise_areas, bio, availability");
      if (error) throw error;
      // Also fetch profile names
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      return data.map(m => ({
        ...m,
        full_name: profiles?.find(p => p.user_id === m.user_id)?.full_name ?? "Mentor",
      }));
    },
  });
}

// ── Add Availability Dialog (for mentors) ──
function AddAvailabilityDialog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [open, setOpen] = useState(false);

  const addSlot = useMutation({
    mutationFn: async () => {
      const startAt = new Date(`${date}T${startTime}:00`);
      const endAt = new Date(`${date}T${endTime}:00`);
      if (endAt <= startAt) throw new Error("L'heure de fin doit être après le début");
      const { error } = await supabase.from("mentor_availability_slots").insert({
        mentor_id: user!.id,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availability-slots"] });
      toast({ title: "✓ Créneau ajouté" });
      setOpen(false);
    },
    onError: (e) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
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
          <GhButton onClick={() => addSlot.mutate()} disabled={!date || addSlot.isPending} className="w-full">
            Confirmer
          </GhButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Book Slot Dialog ──
function BookSlotDialog({ slot, mentorName }: { slot: any; mentorName: string }) {
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

export default function SchedulingPage() {
  const { user, roles } = useAuth();
  const { data: slots, isLoading } = useAvailabilitySlots();
  const { data: mentors } = useMentorProfiles();
  const [weekOffset, setWeekOffset] = useState(0);
  const isMentor = roles.includes("mentor");

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getMentorName = (mentorId: string) =>
    mentors?.find(m => m.user_id === mentorId)?.full_name ?? "Mentor";

  const availableSlots = slots?.filter(s => !s.is_booked && isAfter(new Date(s.start_at), new Date())) ?? [];
  const myBookings = slots?.filter(s => s.booked_by === user?.id) ?? [];
  const mySlots = isMentor ? slots?.filter(s => s.mentor_id === user?.id) ?? [] : [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Prise de rendez-vous"
        subtitle="Réservez un créneau avec un mentor ou gérez vos disponibilités"
        actions={isMentor ? <AddAvailabilityDialog /> : undefined}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Créneaux disponibles" value={String(availableSlots.length)} note="" color="green" />
        <StatCard label="Mes réservations" value={String(myBookings.length)} note="" color="blue" />
        <StatCard label="Mentors actifs" value={String(new Set(availableSlots.map(s => s.mentor_id)).size)} note="" color="purple" />
        {isMentor && <StatCard label="Mes créneaux" value={String(mySlots.length)} note="" color="amber" />}
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <GhButton variant="ghost" size="sm" onClick={() => setWeekOffset(p => p - 1)}>← Semaine précédente</GhButton>
        <span className="text-sm font-semibold text-foreground">
          {format(weekDays[0], "dd MMM", { locale: fr })} — {format(weekDays[6], "dd MMM yyyy", { locale: fr })}
        </span>
        <GhButton variant="ghost" size="sm" onClick={() => setWeekOffset(p => p + 1)}>Semaine suivante →</GhButton>
      </div>

      {/* Calendar grid */}
      <GhCard noPadding>
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map(day => (
            <div key={day.toISOString()} className={`text-center py-3 text-xs font-medium border-r border-border last:border-r-0 ${isSameDay(day, new Date()) ? "bg-primary/5 text-primary" : "text-muted-foreground"}`}>
              <div className="font-mono uppercase">{format(day, "EEE", { locale: fr })}</div>
              <div className="text-lg font-bold text-foreground mt-0.5">{format(day, "dd")}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[300px]">
          {weekDays.map(day => {
            const daySlots = availableSlots.filter(s => isSameDay(new Date(s.start_at), day));
            return (
              <div key={day.toISOString()} className="border-r border-border last:border-r-0 p-2 space-y-1.5">
                {daySlots.length === 0 && (
                  <div className="text-[10px] text-muted-foreground text-center py-4">—</div>
                )}
                {daySlots.map(slot => (
                  <div key={slot.id} className="bg-primary/5 border border-primary/20 rounded-lg p-2 space-y-1">
                    <div className="text-[10px] font-mono text-primary font-semibold">
                      {format(new Date(slot.start_at), "HH:mm")} - {format(new Date(slot.end_at), "HH:mm")}
                    </div>
                    <div className="text-[10px] text-foreground truncate">{getMentorName(slot.mentor_id)}</div>
                    {slot.mentor_id !== user?.id && (
                      <BookSlotDialog slot={slot} mentorName={getMentorName(slot.mentor_id)} />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </GhCard>

      {/* My bookings */}
      {myBookings.length > 0 && (
        <GhCard title="Mes réservations" badge={String(myBookings.length)} className="mt-5">
          <div className="space-y-2">
            {myBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-surface-2 rounded-lg p-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{getMentorName(b.mentor_id)}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {format(new Date(b.start_at), "EEEE dd MMM · HH:mm", { locale: fr })} — {format(new Date(b.end_at), "HH:mm")}
                  </div>
                </div>
                <Pill color="green">Confirmé</Pill>
              </div>
            ))}
          </div>
        </GhCard>
      )}

      {/* Mentor: my slots */}
      {isMentor && mySlots.length > 0 && (
        <GhCard title="Mes créneaux" badge={String(mySlots.length)} className="mt-5">
          <div className="space-y-2">
            {mySlots.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-surface-2 rounded-lg p-3">
                <div>
                  <div className="text-sm font-mono text-foreground">
                    {format(new Date(s.start_at), "EEEE dd MMM · HH:mm", { locale: fr })} — {format(new Date(s.end_at), "HH:mm")}
                  </div>
                </div>
                <Pill color={s.is_booked ? "blue" : "green"}>{s.is_booked ? "Réservé" : "Disponible"}</Pill>
              </div>
            ))}
          </div>
        </GhCard>
      )}

      {isLoading && (
        <div className="space-y-3 mt-5">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      )}
    </motion.div>
  );
}
