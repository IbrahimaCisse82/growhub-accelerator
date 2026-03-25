import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStartups } from "@/hooks/useStartups";
import { useMentors } from "@/hooks/useMentors";
import GhButton from "@/components/shared/GhButton";
import { toast } from "@/hooks/use-toast";

interface Recipient {
  id: string;
  name: string;
  type: "startup" | "mentor";
}

export default function CoachingInviteComposer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: startups } = useStartups();
  const { data: mentors } = useMentors();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [mentorTag, setMentorTag] = useState<Recipient | null>(null);
  const [emailBody, setEmailBody] = useState(
    `Hi {{first_name}},\n\nI want to schedule a coaching meeting with you.\n\nPress the button below to select one of my meeting slot.\n\nSee you soon!\n`
  );
  const [search, setSearch] = useState("");

  const addRecipient = (r: Recipient) => {
    if (!recipients.find(x => x.id === r.id)) setRecipients(prev => [...prev, r]);
    setSearch("");
  };

  const removeRecipient = (id: string) => setRecipients(prev => prev.filter(r => r.id !== id));

  const filteredStartups = startups?.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5) ?? [];
  const filteredMentors = mentors?.filter(m => (m.profile.full_name ?? "").toLowerCase().includes(search.toLowerCase())).slice(0, 5) ?? [];

  const handleSend = () => {
    if (recipients.length === 0) return;
    toast({ title: "✓ Invitations envoyées", description: `${recipients.length} invitation(s) de coaching envoyées` });
    setOpen(false);
    setRecipients([]);
    setMentorTag(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[640px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Inviter pour un coaching/mentoring meeting</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* To field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">To</label>
            <div className="flex flex-wrap items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2.5 py-2 min-h-[40px]">
              {recipients.map(r => (
                <span key={r.id} className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[11px] px-2 py-0.5 rounded-md font-medium">
                  {r.name}
                  <button onClick={() => removeRecipient(r.id)} className="text-primary/60 hover:text-primary ml-0.5">×</button>
                </span>
              ))}
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher startup ou mentor…"
                className="flex-1 min-w-[120px] bg-transparent text-[12px] text-foreground outline-none"
              />
            </div>
            {search && (
              <div className="bg-card border border-border rounded-lg shadow-lg max-h-[160px] overflow-y-auto">
                {filteredStartups.map(s => (
                  <button key={s.id} onClick={() => addRecipient({ id: s.id, name: s.name, type: "startup" })}
                    className="w-full text-left px-3 py-2 text-[12px] text-foreground hover:bg-secondary flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">🏢</span> {s.name}
                  </button>
                ))}
                {filteredMentors.map(m => (
                  <button key={m.id} onClick={() => addRecipient({ id: m.user_id, name: m.profile.full_name ?? "Mentor", type: "mentor" })}
                    className="w-full text-left px-3 py-2 text-[12px] text-foreground hover:bg-secondary flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">🎓</span> {m.profile.full_name}
                  </button>
                ))}
                {filteredStartups.length === 0 && filteredMentors.length === 0 && (
                  <div className="px-3 py-2 text-[11px] text-muted-foreground">Aucun résultat</div>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Subject</label>
            <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground">
              Meeting invitation with
              {mentorTag ? (
                <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[11px] px-2 py-0.5 rounded-md font-medium">
                  {mentorTag.name}
                  <button onClick={() => setMentorTag(null)} className="text-primary/60 hover:text-primary ml-0.5">×</button>
                </span>
              ) : (
                <select
                  className="bg-transparent text-primary text-[11px] font-medium outline-none cursor-pointer"
                  onChange={e => {
                    const m = mentors?.find(x => x.user_id === e.target.value);
                    if (m) setMentorTag({ id: m.user_id, name: m.profile.full_name ?? "Mentor", type: "mentor" });
                  }}
                >
                  <option value="">Sélectionner mentor…</option>
                  {mentors?.map(m => <option key={m.id} value={m.user_id}>{m.profile.full_name}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Email template preview */}
          <div className="border border-border rounded-lg p-4 bg-surface-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-foreground">Hi</span>
              <span className="bg-primary/15 text-primary text-[10px] px-1.5 py-0.5 rounded font-medium">First name</span>
              <span className="text-[11px] text-foreground">,</span>
            </div>
            <textarea
              value={emailBody}
              onChange={e => setEmailBody(e.target.value)}
              className="w-full bg-card border border-border rounded-lg p-3 text-[12px] text-foreground resize-none h-24"
            />
            <div className="flex justify-center">
              <div className="bg-primary text-primary-foreground text-[12px] font-semibold px-6 py-2.5 rounded-lg cursor-default">
                Schedule a meeting
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <GhButton variant="secondary" onClick={() => toast({ title: "Ouverture de l'éditeur d'email…" })}>
              Edit email
            </GhButton>
            <GhButton onClick={handleSend} disabled={recipients.length === 0}>
              Envoyer les invitations
            </GhButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
