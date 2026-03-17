import { useState } from "react";
import { useSearchMessages } from "@/hooks/useMessaging";
import { Input } from "@/components/ui/input";
import { Search, X, Hash } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Props = {
  onClose: () => void;
  onNavigate: (channelId: string, messageId: string) => void;
};

export default function SearchPanel({ onClose, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = useSearchMessages(query);

  return (
    <div className="w-full h-full flex flex-col bg-card border-l border-border">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher dans les messages…"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
          autoFocus
        />
        <button onClick={onClose} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {query.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <Search className="w-8 h-8 opacity-30" />
            <span>Tapez pour rechercher</span>
          </div>
        ) : isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Recherche…</div>
        ) : !results || results.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Aucun résultat pour "{query}"</div>
        ) : (
          <div className="divide-y divide-border">
            {results.map((r: any) => (
              <button
                key={r.id}
                onClick={() => onNavigate(r.channel_id, r.id)}
                className="w-full px-4 py-3 text-left hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                  <Hash className="w-3 h-3" />
                  <span className="font-medium">{r.channel_name}</span>
                  <span>·</span>
                  <span className="font-mono">{format(new Date(r.created_at), "dd MMM HH:mm", { locale: fr })}</span>
                </div>
                <div className="text-[12.5px] text-foreground line-clamp-2">
                  {r.content}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
