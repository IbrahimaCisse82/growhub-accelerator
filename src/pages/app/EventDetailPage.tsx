import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import StatCard from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function useEventDetail(id: string) {
  return useQuery({
    queryKey: ["event-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
}

function useEventRegistrations(eventId: string) {
  return useQuery({
    queryKey: ["event-registrations", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*, profiles:user_id(full_name, email)")
        .eq("event_id", eventId)
        .order("registered_at");
      if (error) throw error;
      return data;
    },
  });
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: event, isLoading } = useEventDetail(id!);
  const { data: registrations } = useEventRegistrations(id!);
  const [tab, setTab] = useState<"details" | "registrations" | "checkin">("details");

  const register = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_registrations").insert({ event_id: id!, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["event-registrations", id] }); toast({ title: "✓ Inscrit" }); },
  });

  const checkIn = useMutation({
    mutationFn: async (regId: string) => {
      const { error } = await supabase.from("event_registrations").update({ attended: true, checked_in_at: new Date().toISOString() }).eq("id", regId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["event-registrations", id] }); toast({ title: "✓ Check-in enregistré" }); },
  });

  if (isLoading) return <Skeleton className="h-[400px] rounded-xl" />;
  if (!event) return <div className="text-center text-muted-foreground py-16">Événement introuvable</div>;

  const totalRegistered = registrations?.length ?? 0;
  const totalCheckedIn = registrations?.filter(r => r.attended).length ?? 0;
  const attendanceRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title={event.title}
        subtitle={format(new Date(event.start_at), "EEEE dd MMMM yyyy · HH:mm", { locale: fr })}
        actions={
          <div className="flex gap-2">
            <GhButton variant="ghost" onClick={() => navigate(-1)}>← Retour</GhButton>
            <GhButton onClick={() => register.mutate()}>S'inscrire</GhButton>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Inscrits" value={String(totalRegistered)} note={event.max_attendees ? `/${event.max_attendees}` : ""} color="blue" />
        <StatCard label="Check-in" value={String(totalCheckedIn)} note="" color="green" />
        <StatCard label="Taux de présence" value={`${attendanceRate}%`} note="" color="purple" />
        <StatCard label="Type" value={event.event_type} note="" color="amber" />
      </div>

      <div className="flex border-b border-border mb-4">
        {(["details", "registrations", "checkin"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-[11.5px] font-medium transition-colors relative ${tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "details" ? "📋 Détails" : t === "registrations" ? `👥 Inscrits (${totalRegistered})` : `✅ Check-in (${totalCheckedIn})`}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GhCard title="Informations">
            <div className="space-y-3 text-[12.5px]">
              <div><span className="text-muted-foreground">📅 Date :</span> <span className="text-foreground font-medium">{format(new Date(event.start_at), "dd MMMM yyyy · HH:mm", { locale: fr })}</span></div>
              {event.end_at && <div><span className="text-muted-foreground">⏱ Fin :</span> <span className="text-foreground font-medium">{format(new Date(event.end_at), "HH:mm", { locale: fr })}</span></div>}
              <div><span className="text-muted-foreground">📍 Lieu :</span> <span className="text-foreground font-medium">{event.location ?? (event.is_online ? "En ligne" : "—")}</span></div>
              {event.meeting_url && <div><span className="text-muted-foreground">🔗 Lien :</span> <a href={event.meeting_url} className="text-primary hover:underline">{event.meeting_url}</a></div>}
              {event.max_attendees && <div><span className="text-muted-foreground">👥 Places :</span> <span className="text-foreground font-medium">{totalRegistered}/{event.max_attendees}</span></div>}
            </div>
          </GhCard>
          {event.description && (
            <GhCard title="Description">
              <p className="text-[12px] text-foreground whitespace-pre-wrap">{event.description}</p>
            </GhCard>
          )}
        </div>
      )}

      {tab === "registrations" && (
        <GhCard title="Liste des inscrits" badge={String(totalRegistered)} noPadding>
          {!registrations || registrations.length === 0 ? (
            <div className="text-center text-muted-foreground text-[12px] py-8">Aucune inscription</div>
          ) : (
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-secondary">
                  {["Nom", "Email", "Date d'inscription", "Statut"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-mono text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrations.map(r => (
                  <tr key={r.id} className="border-t border-border hover:bg-secondary/50">
                    <td className="px-4 py-2.5 text-foreground font-medium">{(r as any).profiles?.full_name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono">{(r as any).profiles?.email ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono">{format(new Date(r.registered_at), "dd/MM/yyyy HH:mm")}</td>
                    <td className="px-4 py-2.5">
                      <Pill color={r.attended ? "green" : "gray"}>{r.attended ? "Présent" : "Inscrit"}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GhCard>
      )}

      {tab === "checkin" && (
        <GhCard title="Check-in des participants" noPadding>
          {!registrations || registrations.length === 0 ? (
            <div className="text-center text-muted-foreground text-[12px] py-8">Aucun inscrit</div>
          ) : (
            <div className="divide-y divide-border">
              {registrations.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors">
                  <div>
                    <div className="text-[12.5px] font-medium text-foreground">{(r as any).profiles?.full_name ?? "—"}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{(r as any).profiles?.email}</div>
                  </div>
                  {r.attended ? (
                    <div className="flex items-center gap-2">
                      <Pill color="green">✓ Présent</Pill>
                      {r.checked_in_at && <span className="text-[10px] font-mono text-muted-foreground">{format(new Date(r.checked_in_at), "HH:mm")}</span>}
                    </div>
                  ) : (
                    <GhButton size="sm" onClick={() => checkIn.mutate(r.id)}>Check-in</GhButton>
                  )}
                </div>
              ))}
            </div>
          )}
        </GhCard>
      )}
    </motion.div>
  );
}
