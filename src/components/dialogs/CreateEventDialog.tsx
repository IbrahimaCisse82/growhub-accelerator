import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type EventType = Database["public"]["Enums"]["event_type"];
const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

export default function CreateEventDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("other");
  const [startAt, setStartAt] = useState("");
  const [location, setLocation] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").insert({ title, event_type: eventType, start_at: startAt, location: location || null, is_online: isOnline, organizer_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); setOpen(false); setTitle(""); setStartAt(""); setLocation(""); toast({ title: "Événement créé" }); },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-display">Nouvel événement</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Titre *</label><input value={title} onChange={e => setTitle(e.target.value)} required className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Type</label>
              <select value={eventType} onChange={e => setEventType(e.target.value as EventType)} className={inputCls}>
                <option value="demo_day">Demo Day</option><option value="workshop">Workshop</option><option value="networking">Networking</option>
                <option value="hackathon">Hackathon</option><option value="committee">Comité</option><option value="webinar">Webinar</option><option value="other">Autre</option>
              </select>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date & heure *</label><input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} required className={inputCls} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground">Lieu</label><input value={location} onChange={e => setLocation(e.target.value)} className={inputCls} /></div>
          <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={isOnline} onChange={e => setIsOnline(e.target.checked)} className="rounded" /> En ligne</label>
          <button type="submit" disabled={create.isPending} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {create.isPending ? "Création…" : "Créer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
