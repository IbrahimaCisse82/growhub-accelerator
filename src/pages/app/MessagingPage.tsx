import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("conversations").select("*, conversation_participants(user_id)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });
}

export default function MessagingPage() {
  const { data: conversations, isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: messages } = useMessages(selectedId);
  const { user } = useAuth();
  const [newMsg, setNewMsg] = useState("");

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedId || !user) return;
    await supabase.from("messages").insert({ content: newMsg, conversation_id: selectedId, sender_id: user.id });
    setNewMsg("");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="Messagerie" subtitle="Messagerie interne de la plateforme" />
      <div className="grid grid-cols-[300px_1fr] gap-4 h-[calc(100vh-220px)]">
        {/* Conversations list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border font-display text-sm font-bold text-foreground">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 m-2 rounded-lg" />)
            ) : !conversations || conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Aucune conversation</div>
            ) : conversations.map(c => (
              <button key={c.id} onClick={() => setSelectedId(c.id)}
                className={`w-full px-4 py-3 text-left border-b border-border hover:bg-surface-2 transition-colors ${selectedId === c.id ? "bg-primary/10" : ""}`}>
                <div className="text-sm font-semibold text-foreground">{c.title || "Conversation"}</div>
                <div className="text-[11px] text-muted-foreground">{c.is_group ? "Groupe" : "Privé"} · {format(new Date(c.created_at), "dd MMM", { locale: fr })}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Sélectionnez une conversation</div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages?.map(m => (
                  <div key={m.id} className={`max-w-[70%] ${m.sender_id === user?.id ? "ml-auto" : ""}`}>
                    <div className={`px-3 py-2 rounded-lg text-sm ${m.sender_id === user?.id ? "bg-primary/20 text-foreground" : "bg-surface-2 text-foreground"}`}>
                      {m.content}
                    </div>
                    <div className="font-mono text-[9px] text-muted-foreground mt-0.5">{format(new Date(m.created_at), "HH:mm", { locale: fr })}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                  className="flex-1 h-9 rounded-lg border border-input bg-surface-2 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="Votre message…" />
                <GhButton onClick={sendMessage} variant="primary">Envoyer</GhButton>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
