import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useEffect, useRef } from "react";

/* ── hooks ── */

function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      if (!userId) return [];
      // Get conversations where user is a participant
      const { data: participantRows, error: pErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);
      if (pErr) throw pErr;
      const ids = participantRows?.map((r) => r.conversation_id) ?? [];
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from("conversations")
        .select("*, conversation_participants(user_id)")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!conversationId,
  });
}

function useProfiles(userIds: string[]) {
  return useQuery({
    queryKey: ["profiles-batch", userIds.sort().join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles_safe")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: userIds.length > 0,
  });
}

function useSearchUsers(search: string) {
  return useQuery({
    queryKey: ["search-users", search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles_safe")
        .select("user_id, full_name, avatar_url, email")
        .eq("is_approved", true)
        .ilike("full_name", `%${search}%`)
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: search.length >= 2,
  });
}

/* ── component ── */

export default function MessagingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: conversations, isLoading } = useConversations(user?.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: messages, refetch: refetchMessages } = useMessages(selectedId);
  const [newMsg, setNewMsg] = useState("");
  const [showList, setShowList] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const { data: searchResults } = useSearchUsers(searchUser);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Collect all user ids from conversations for profile lookup
  const allUserIds = Array.from(
    new Set(
      (conversations ?? []).flatMap((c: any) =>
        (c.conversation_participants ?? []).map((p: any) => p.user_id)
      )
    )
  );
  const msgSenderIds = Array.from(new Set((messages ?? []).map((m) => m.sender_id)));
  const combinedIds = Array.from(new Set([...allUserIds, ...msgSenderIds]));
  const { data: profiles } = useProfiles(combinedIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`messages-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        () => {
          refetchMessages();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, refetchMessages]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedId || !user) return;
    await supabase.from("messages").insert({
      content: newMsg,
      conversation_id: selectedId,
      sender_id: user.id,
    });
    setNewMsg("");
    refetchMessages();
  };

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setShowList(false);
  };

  const createConversation = async (targetUserId: string, targetName: string) => {
    if (!user) return;

    // Check if a 1-on-1 conversation already exists
    const myConvIds = (conversations ?? []).map((c: any) => c.id);
    for (const conv of conversations ?? []) {
      const participants = (conv as any).conversation_participants ?? [];
      if (
        !conv.is_group &&
        participants.length === 2 &&
        participants.some((p: any) => p.user_id === targetUserId)
      ) {
        setSelectedId(conv.id);
        setShowList(false);
        setShowNewDialog(false);
        setSearchUser("");
        return;
      }
    }

    // Create new conversation
    const { data: conv, error: cErr } = await supabase
      .from("conversations")
      .insert({ title: targetName, is_group: false })
      .select()
      .single();
    if (cErr || !conv) return;

    // Add self first (satisfies user_id = auth.uid()), then add other user (satisfies is_conversation_member)
    await supabase.from("conversation_participants").insert({ conversation_id: conv.id, user_id: user.id });
    await supabase.from("conversation_participants").insert({ conversation_id: conv.id, user_id: targetUserId });

    qc.invalidateQueries({ queryKey: ["conversations"] });
    setSelectedId(conv.id);
    setShowList(false);
    setShowNewDialog(false);
    setSearchUser("");
  };

  const getConversationLabel = (conv: any) => {
    if (conv.title) return conv.title;
    const participants = conv.conversation_participants ?? [];
    const otherIds = participants
      .map((p: any) => p.user_id)
      .filter((id: string) => id !== user?.id);
    const otherProfiles = otherIds.map((id: string) => profileMap.get(id));
    return otherProfiles.map((p: any) => p?.full_name || "Utilisateur").join(", ") || "Conversation";
  };

  const getLastMessagePreview = (conv: any) => {
    return conv.is_group ? "Groupe" : "Privé";
  };

  const selectedConv = conversations?.find((c) => c.id === selectedId);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Messagerie"
        subtitle="Messagerie interne de la plateforme"
        actions={
          <GhButton variant="primary" onClick={() => setShowNewDialog(true)}>
            + Nouvelle conversation
          </GhButton>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-220px)]">
        {/* Conversations list */}
        <div
          className={`bg-card border border-border rounded-xl overflow-hidden flex flex-col ${
            !showList ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="font-display text-sm font-bold text-foreground">
              Conversations
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {conversations?.length ?? 0}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 m-2 rounded-lg" />
              ))
            ) : !conversations || conversations.length === 0 ? (
              <EmptyState
                icon="💬"
                title="Aucune conversation"
                description="Démarrez une nouvelle conversation"
                actionLabel="Nouveau message"
                onAction={() => setShowNewDialog(true)}
              />
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full px-4 py-3 text-left border-b border-border hover:bg-secondary transition-colors ${
                    selectedId === c.id ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {c.is_group ? "👥" : "💬"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {getConversationLabel(c)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {getLastMessagePreview(c)} ·{" "}
                        {format(new Date(c.created_at), "dd MMM", { locale: fr })}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages panel */}
        <div
          className={`bg-card border border-border rounded-xl overflow-hidden flex flex-col ${
            showList ? "hidden md:flex" : "flex"
          }`}
        >
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
              <span className="text-4xl">💬</span>
              <span>Sélectionnez une conversation</span>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <button
                  onClick={() => setShowList(true)}
                  className="md:hidden text-muted-foreground hover:text-foreground text-sm"
                >
                  ← Retour
                </button>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {selectedConv?.is_group ? "👥" : "💬"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {selectedConv ? getConversationLabel(selectedConv) : "Conversation"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {(selectedConv as any)?.conversation_participants?.length ?? 0} participant(s)
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {!messages || messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-10">
                    Aucun message. Commencez la conversation !
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.sender_id === user?.id;
                    const senderProfile = profileMap.get(m.sender_id);
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                          {!isMine && (
                            <span className="text-[10px] text-muted-foreground mb-0.5 font-medium">
                              {senderProfile?.full_name || "Utilisateur"}
                            </span>
                          )}
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-secondary text-foreground rounded-bl-md"
                            }`}
                          >
                            {m.content}
                          </div>
                          <div className="font-mono text-[9px] text-muted-foreground mt-0.5 px-1">
                            {format(new Date(m.created_at), "HH:mm", { locale: fr })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border flex gap-2">
                <input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  className="flex-1 h-10 rounded-xl border border-input bg-secondary px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  placeholder="Écrire un message…"
                />
                <GhButton onClick={sendMessage} variant="primary" disabled={!newMsg.trim()}>
                  Envoyer
                </GhButton>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New conversation dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nouvelle conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Rechercher un utilisateur
              </label>
              <input
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                placeholder="Nom de l'utilisateur…"
                autoFocus
              />
            </div>
            <div className="max-h-[250px] overflow-y-auto space-y-1">
              {searchUser.length < 2 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tapez au moins 2 caractères pour rechercher
                </p>
              ) : !searchResults || searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun utilisateur trouvé
                </p>
              ) : (
                searchResults
                  .filter((u) => u.user_id !== user?.id)
                  .map((u) => (
                    <button
                      key={u.user_id}
                      onClick={() => createConversation(u.user_id, u.full_name)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{u.full_name}</div>
                        {u.email && (
                          <div className="text-[11px] text-muted-foreground">{u.email}</div>
                        )}
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
