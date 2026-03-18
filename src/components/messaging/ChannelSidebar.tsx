import { useState } from "react";
import { Channel } from "@/hooks/useMessaging";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GhButton from "@/components/shared/GhButton";
import { Hash, Lock, MessageSquare, Plus, Search, ChevronDown, ChevronRight } from "lucide-react";

type Props = {
  channels: Channel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateChannel: (data: { name: string; description?: string; channel_type: string; topic?: string }) => void;
  onSearch: () => void;
  myChannelIds: Set<string>;
};

export default function ChannelSidebar({ channels, selectedId, onSelect, onCreateChannel, onSearch, myChannelIds }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("public");
  const [expandPublic, setExpandPublic] = useState(true);
  const [expandPrivate, setExpandPrivate] = useState(true);
  const [expandDM, setExpandDM] = useState(true);

  const publicChannels = channels.filter(c => c.channel_type === "public" && myChannelIds.has(c.id));
  const privateChannels = channels.filter(c => c.channel_type === "private" && myChannelIds.has(c.id));
  const directChannels = channels.filter(c => c.channel_type === "direct" && myChannelIds.has(c.id));
  const browseChannels = channels.filter(c => c.channel_type === "public" && !myChannelIds.has(c.id));

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateChannel({ name: name.trim(), description: desc || undefined, channel_type: type });
    setShowCreate(false);
    setName("");
    setDesc("");
    setType("public");
  };

  const ChannelIcon = ({ type }: { type: string }) => {
    if (type === "private") return <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
    if (type === "direct") return <MessageSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
    return <Hash className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
  };

  const SectionHeader = ({ label, expanded, toggle, count }: { label: string; expanded: boolean; toggle: () => void; count: number }) => (
    <button onClick={toggle} className="w-full flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
      {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      <span>{label}</span>
      <span className="ml-auto text-[9px] font-mono opacity-60">{count}</span>
    </button>
  );

  const ChannelItem = ({ channel }: { channel: Channel }) => (
    <button
      onClick={() => onSelect(channel.id)}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] rounded-md transition-colors ${
        selectedId === channel.id
          ? "bg-primary/15 text-primary font-semibold"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <ChannelIcon type={channel.channel_type} />
      <span className="truncate">{channel.name}</span>
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-foreground">GrowHub Chat</h2>
        <div className="flex items-center gap-1">
          <button onClick={onSearch} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(true)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto py-2 space-y-1">
        {/* Public channels */}
        <SectionHeader label="Canaux" expanded={expandPublic} toggle={() => setExpandPublic(!expandPublic)} count={publicChannels.length} />
        {expandPublic && publicChannels.map(c => <ChannelItem key={c.id} channel={c} />)}

        {/* Private channels */}
        {privateChannels.length > 0 && (
          <>
            <SectionHeader label="Canaux privés" expanded={expandPrivate} toggle={() => setExpandPrivate(!expandPrivate)} count={privateChannels.length} />
            {expandPrivate && privateChannels.map(c => <ChannelItem key={c.id} channel={c} />)}
          </>
        )}

        {/* Direct messages */}
        <SectionHeader label="Messages directs" expanded={expandDM} toggle={() => setExpandDM(!expandDM)} count={directChannels.length} />
        {expandDM && directChannels.map(c => <ChannelItem key={c.id} channel={c} />)}

        {/* Browse channels */}
        {browseChannels.length > 0 && (
          <div className="px-3 pt-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Parcourir</p>
            {browseChannels.slice(0, 5).map(c => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary rounded-md transition-colors"
              >
                <Hash className="w-3 h-3" />
                <span className="truncate">{c.name}</span>
                <span className="ml-auto text-[9px] italic">rejoindre</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create channel dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Créer un canal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Nom</label>
              <Input value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/\s/g, "-"))} placeholder="ex: général, marketing, cohorte-2025" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">🌐 Public — Visible par tous</SelectItem>
                  <SelectItem value="private">🔒 Privé — Sur invitation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Description (optionnel)</label>
              <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="À quoi sert ce canal ?" rows={2} />
            </div>
            <GhButton variant="primary" onClick={handleCreate} disabled={!name.trim()} className="w-full">
              Créer le canal
            </GhButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
