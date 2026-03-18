import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/hooks/useEvents";
import CreateEventDialog from "@/components/dialogs/CreateEventDialog";
import { exportToCSV } from "@/lib/exportUtils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const typeColor: Record<string, "green" | "blue" | "purple" | "amber" | "rose" | "gray"> = { demo_day: "green", workshop: "blue", networking: "purple", hackathon: "amber", committee: "rose", webinar: "blue", other: "gray" };
const typeLabel: Record<string, string> = { demo_day: "Demo Day", workshop: "Workshop", networking: "Networking", hackathon: "Hackathon", committee: "Comité", webinar: "Webinar", other: "Autre" };

type ViewMode = "month" | "week" | "list";

export default function EvenementsPage() {
  const { data: events, isLoading } = useEvents();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const register = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from("event_registrations").insert({ event_id: eventId, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); toast({ title: "✓ Inscrit à l'événement" }); },
  });

  // Calendar data
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (day: Date) => events?.filter(e => isSameDay(new Date(e.start_at), day)) ?? [];

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events?.filter(e => new Date(e.start_at) >= now).slice(0, 5) ?? [];
  }, [events]);

  const totalEvents = events?.length ?? 0;
  const upcomingCount = events?.filter(e => new Date(e.start_at) >= new Date()).length ?? 0;
  const onlineCount = events?.filter(e => e.is_online).length ?? 0;

  const navPrev = () => setCurrentDate(d => viewMode === "month" ? subMonths(d, 1) : subWeeks(d, 1));
  const navNext = () => setCurrentDate(d => viewMode === "month" ? addMonths(d, 1) : addWeeks(d, 1));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Événements" subtitle="Calendrier central des formations, workshops, office hours et événements"
        actions={<>
          <GhButton variant="ghost" onClick={() => events && exportToCSV(events, "evenements", [
            { key: "title", label: "Titre" }, { key: "event_type", label: "Type" },
            { key: "start_at", label: "Date" }, { key: "location", label: "Lieu" },
          ])}>⤓ CSV</GhButton>
          <CreateEventDialog><GhButton>+ Créer événement</GhButton></CreateEventDialog>
        </>} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Total événements" value={String(totalEvents)} note="" color="blue" />
        <StatCard label="À venir" value={String(upcomingCount)} note="" color="green" />
        <StatCard label="En ligne" value={String(onlineCount)} note="" color="purple" />
        <StatCard label="Ce mois" value={String(events?.filter(e => { const d = new Date(e.start_at); return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear(); }).length ?? 0)} note="" color="amber" />
      </div>

      {/* View toggles & navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GhButton variant="ghost" onClick={navPrev}>←</GhButton>
          <span className="font-display text-sm font-bold text-foreground min-w-[160px] text-center">
            {viewMode === "month"
              ? format(currentDate, "MMMM yyyy", { locale: fr })
              : `${format(weekStart, "dd MMM", { locale: fr })} — ${format(weekEnd, "dd MMM yyyy", { locale: fr })}`}
          </span>
          <GhButton variant="ghost" onClick={navNext}>→</GhButton>
          <GhButton variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</GhButton>
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          {(["month", "week", "list"] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${viewMode === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>
              {v === "month" ? "Mois" : v === "week" ? "Semaine" : "Liste"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <Skeleton className="h-[400px] rounded-xl" /> : viewMode === "list" ? (
        /* ── List view ── */
        <div className="flex flex-col gap-2.5">
          {events?.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">Aucun événement</div>
          ) : events?.map((e) => {
            const d = new Date(e.start_at);
            return (
              <div key={e.id} onClick={() => setSelectedEvent(e)}
                className="bg-surface-2 border border-border rounded-[10px] p-3 sm:p-4 flex items-center gap-3 sm:gap-3.5 cursor-pointer hover:border-primary/30 transition-colors">
                <div className="text-center flex-shrink-0 w-[46px] bg-card rounded-lg py-2 px-1.5 border border-border">
                  <div className="font-mono text-xl font-bold text-foreground leading-none">{format(d, "dd")}</div>
                  <div className="font-mono text-[9px] text-muted-foreground uppercase mt-0.5">{format(d, "MMM", { locale: fr })}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-foreground truncate">{e.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{format(d, "HH:mm")} · {e.location ?? (e.is_online ? "En ligne" : "—")}</div>
                  <div className="flex gap-1.5 mt-1.5">
                    <Pill color={typeColor[e.event_type] ?? "gray"}>{typeLabel[e.event_type] ?? e.event_type}</Pill>
                    {e.max_attendees && <span className="text-[10px] text-muted-foreground font-mono">{e.max_attendees} places</span>}
                  </div>
                </div>
                <GhButton variant="secondary" size="sm" onClick={(ev) => { ev.stopPropagation(); register.mutate(e.id); }}>S'inscrire</GhButton>
              </div>
            );
          })}
        </div>
      ) : viewMode === "month" ? (
        /* ── Month calendar ── */
        <GhCard title={format(currentDate, "MMMM yyyy", { locale: fr })} noPadding>
          <div className="grid grid-cols-7">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => (
              <div key={d} className="text-center font-mono text-[9px] text-muted-foreground uppercase tracking-wider py-2 border-b border-border">{d}</div>
            ))}
            {calendarDays.map(day => {
              const dayEvents = getEventsForDay(day);
              const inMonth = isSameMonth(day, currentDate);
              return (
                <div key={day.toISOString()}
                  className={`min-h-[80px] border-b border-r border-border p-1.5 transition-colors hover:bg-secondary/50 ${!inMonth ? "opacity-30" : ""} ${isToday(day) ? "bg-primary/5" : ""}`}>
                  <div className={`font-mono text-[11px] mb-1 ${isToday(day) ? "text-primary font-bold" : "text-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} onClick={() => setSelectedEvent(e)}
                      className={`text-[9px] px-1 py-0.5 rounded mb-0.5 truncate cursor-pointer ${
                        typeColor[e.event_type] === "green" ? "bg-gh-green/15 text-gh-green"
                        : typeColor[e.event_type] === "blue" ? "bg-gh-blue/15 text-gh-blue"
                        : typeColor[e.event_type] === "purple" ? "bg-gh-purple/15 text-gh-purple"
                        : typeColor[e.event_type] === "amber" ? "bg-gh-amber/15 text-gh-amber"
                        : "bg-muted text-muted-foreground"
                      }`}>
                      {format(new Date(e.start_at), "HH:mm")} {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] text-muted-foreground font-mono">+{dayEvents.length - 2}</div>
                  )}
                </div>
              );
            })}
          </div>
        </GhCard>
      ) : (
        /* ── Week view ── */
        <GhCard title={`Semaine du ${format(weekStart, "dd MMM", { locale: fr })}`} noPadding>
          <div className="grid grid-cols-7 min-h-[300px]">
            {weekDays.map(day => {
              const dayEvents = getEventsForDay(day);
              return (
                <div key={day.toISOString()} className={`border-r border-border last:border-r-0 p-2 ${isToday(day) ? "bg-primary/5" : ""}`}>
                  <div className="text-center mb-2">
                    <div className="font-mono text-[9px] text-muted-foreground uppercase">{format(day, "EEE", { locale: fr })}</div>
                    <div className={`font-mono text-lg font-bold ${isToday(day) ? "text-primary" : "text-foreground"}`}>{format(day, "d")}</div>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map(e => (
                      <div key={e.id} onClick={() => setSelectedEvent(e)}
                        className="bg-surface-2 border border-border rounded-lg p-2 cursor-pointer hover:border-primary/30 transition-colors">
                        <div className="text-[10px] font-mono text-primary">{format(new Date(e.start_at), "HH:mm")}</div>
                        <div className="text-[11px] font-semibold text-foreground truncate">{e.title}</div>
                        <Pill color={typeColor[e.event_type] ?? "gray"}>{typeLabel[e.event_type] ?? e.event_type}</Pill>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </GhCard>
      )}

      {/* Event detail sidebar */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedEvent(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            className="relative w-full max-w-[400px] bg-card border-l border-border h-full overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg">✕</button>
            <div className="mb-4">
              <Pill color={typeColor[selectedEvent.event_type] ?? "gray"}>{typeLabel[selectedEvent.event_type] ?? selectedEvent.event_type}</Pill>
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">{selectedEvent.title}</h2>
            <div className="space-y-3 text-[12.5px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>📅</span> {format(new Date(selectedEvent.start_at), "EEEE dd MMMM yyyy · HH:mm", { locale: fr })}
              </div>
              {selectedEvent.end_at && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>⏱</span> Fin: {format(new Date(selectedEvent.end_at), "HH:mm", { locale: fr })}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>📍</span> {selectedEvent.location ?? (selectedEvent.is_online ? "En ligne" : "—")}
              </div>
              {selectedEvent.meeting_url && (
                <a href={selectedEvent.meeting_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                  <span>🔗</span> Rejoindre la réunion
                </a>
              )}
              {selectedEvent.max_attendees && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>👥</span> {selectedEvent.max_attendees} places max
                </div>
              )}
              {selectedEvent.description && (
                <div className="bg-surface-2 rounded-lg p-3 mt-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Description</div>
                  <div className="text-foreground text-[12px] whitespace-pre-wrap">{selectedEvent.description}</div>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              <GhButton size="md" onClick={() => register.mutate(selectedEvent.id)}>S'inscrire</GhButton>
              <GhButton variant="ghost" size="md">Partager</GhButton>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
