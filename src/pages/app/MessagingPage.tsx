import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  useChannels, useChannelMembers, useChannelMessages, useMessageReactions,
  useMessageAttachments, useSendMessage, useEditMessage, useDeleteMessage,
  useToggleReaction, useTogglePin, usePinnedMessages, useCreateChannel,
  useJoinChannel, usePresence, useMessagingRealtime, useTypingIndicator,
  useProfilesBatch, Channel,
} from "@/hooks/useMessaging";
import ChannelSidebar from "@/components/messaging/ChannelSidebar";
import MessageBubble from "@/components/messaging/MessageBubble";
import MessageInput from "@/components/messaging/MessageInput";
import ThreadPanel from "@/components/messaging/ThreadPanel";
import SearchPanel from "@/components/messaging/SearchPanel";
import { Hash, Lock, MessageSquare, Users, Pin, Settings, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MessagingPage() {
  const { user, profile } = useAuth();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Data
  const { data: channels = [] } = useChannels();
  const { data: channelMembers = [] } = useChannelMembers(selectedChannelId);
  const { data: messages = [], isLoading: loadingMessages } = useChannelMessages(selectedChannelId, null);
  const { data: threadMessages = [] } = useChannelMessages(selectedChannelId, threadId);
  const { data: pinnedMessages = [] } = usePinnedMessages(selectedChannelId);
  const { data: presenceMap = new Map() } = usePresence();

  const createChannel = useCreateChannel();
  const joinChannel = useJoinChannel();
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const toggleReaction = useToggleReaction();
  const togglePin = useTogglePin();

  // Realtime
  useMessagingRealtime(selectedChannelId);
  const { typingUsers, sendTyping } = useTypingIndicator(selectedChannelId);

  // Get all user IDs for profiles
  const allUserIds = useMemo(() => {
    const ids = new Set<string>();
    messages.forEach(m => ids.add(m.sender_id));
    threadMessages.forEach(m => ids.add(m.sender_id));
    channelMembers.forEach(m => ids.add(m.user_id));
    return Array.from(ids);
  }, [messages, threadMessages, channelMembers]);

  const { data: profileMap = new Map() } = useProfilesBatch(allUserIds);

  // Reactions
  const allMessageIds = useMemo(() => {
    return [...messages, ...threadMessages].map(m => m.id);
  }, [messages, threadMessages]);
  const { data: reactionsMap = new Map() } = useMessageReactions(allMessageIds);
  const { data: attachmentsMap = new Map() } = useMessageAttachments(allMessageIds);

  // My channel IDs
  const myChannelIds = useMemo(() => {
    const set = new Set<string>();
    // We need to check membership - for now use channels that are public or the user is in
    channelMembers.forEach(m => {
      if (m.user_id === user?.id) set.add(m.channel_id);
    });
    // Also add public channels where we might already be members
    return set;
  }, [channelMembers, user?.id]);

  // Actually, we need a global membership query. Let's use the channels themselves.
  // Since RLS already filters, all channels returned are ones we can see.
  const allMyChannelIds = useMemo(() => {
    // Until we have per-user membership query, mark all visible channels
    return new Set(channels.map(c => c.id));
  }, [channels]);

  const pinnedIds = useMemo(() => new Set(pinnedMessages.map((p: any) => p.message_id)), [pinnedMessages]);

  // Auto-select first channel
  useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      setSelectedChannelId(channels[0].id);
      setShowMobileList(false);
    }
  }, [channels, selectedChannelId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  // Handlers
  const handleSelectChannel = (id: string) => {
    setSelectedChannelId(id);
    setThreadId(null);
    setShowSearch(false);
    setShowMobileList(false);

    // Auto-join public channels
    const ch = channels.find(c => c.id === id);
    if (ch && ch.channel_type === "public" && user) {
      joinChannel.mutate({ channelId: id, userId: user.id });
    }
  };

  const handleCreateChannel = async (data: { name: string; description?: string; channel_type: string }) => {
    if (!user) return;
    const ch = await createChannel.mutateAsync({ ...data, created_by: user.id });
    setSelectedChannelId(ch.id);
    setShowMobileList(false);
  };

  const handleSendMessage = (content: string, attachments?: any[], mentionIds?: string[]) => {
    if (!user || !selectedChannelId) return;
    sendMessage.mutate({
      channelId: selectedChannelId,
      senderId: user.id,
      content,
      threadId: undefined,
      mentionIds,
      attachments,
    });
  };

  const handleSendThreadReply = (content: string, attachments?: any[], mentionIds?: string[]) => {
    if (!user || !selectedChannelId || !threadId) return;
    sendMessage.mutate({
      channelId: selectedChannelId,
      senderId: user.id,
      content,
      threadId,
      mentionIds,
      attachments,
    });
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (!user) return;
    toggleReaction.mutate({ messageId, userId: user.id, emoji });
  };

  const handlePin = (messageId: string, isPinned: boolean) => {
    if (!user || !selectedChannelId) return;
    togglePin.mutate({ messageId, channelId: selectedChannelId, userId: user.id, isPinned });
  };

  const handleEdit = (messageId: string, content: string) => {
    if (!selectedChannelId) return;
    editMessage.mutate({ messageId, content, channelId: selectedChannelId });
  };

  const handleDelete = (messageId: string) => {
    if (!selectedChannelId) return;
    deleteMessage.mutate({ messageId, channelId: selectedChannelId });
  };

  const getProfile = (userId: string) => profileMap.get(userId) ?? { user_id: userId, full_name: "Utilisateur", avatar_url: null };
  const getReactions = (msgId: string) => {
    const r = reactionsMap.get(msgId) ?? [];
    return r.map(rg => ({ ...rg, reacted: rg.users.includes(user?.id ?? "") }));
  };

  const membersList = channelMembers.map(m => ({
    user_id: m.user_id,
    full_name: profileMap.get(m.user_id)?.full_name ?? "Utilisateur",
  }));

  // Group messages by date
  const messagesByDate = useMemo(() => {
    const groups: { date: string; messages: typeof messages }[] = [];
    let currentDate = "";
    for (const msg of messages) {
      const date = new Date(msg.created_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }
    return groups;
  }, [messages]);

  const threadParent = threadId ? messages.find(m => m.id === threadId) : null;
  const threadReplies = threadMessages.filter(m => m.id !== threadId);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-80px)] flex rounded-xl overflow-hidden border border-border bg-card">
      {/* Channel Sidebar */}
      <div className={`w-[240px] flex-shrink-0 ${showMobileList ? "flex" : "hidden"} md:flex`}>
        <ChannelSidebar
          channels={channels}
          selectedId={selectedChannelId}
          onSelect={handleSelectChannel}
          onCreateChannel={handleCreateChannel}
          onSearch={() => setShowSearch(true)}
          myChannelIds={allMyChannelIds}
        />
      </div>

      {/* Main Messages Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${showMobileList ? "hidden" : "flex"} md:flex`}>
        {!selectedChannelId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p className="text-sm">Sélectionnez un canal</p>
          </div>
        ) : (
          <>
            {/* Channel Header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <button onClick={() => setShowMobileList(true)} className="md:hidden text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-5 h-5" />
              </button>
              {selectedChannel?.channel_type === "private" ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Hash className="w-4 h-4 text-muted-foreground" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground">{selectedChannel?.name}</div>
                {selectedChannel?.topic && (
                  <div className="text-[10px] text-muted-foreground truncate">{selectedChannel.topic}</div>
                )}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <button onClick={() => setShowSearch(!showSearch)} className="p-1.5 rounded hover:bg-secondary hover:text-foreground transition-colors" title="Rechercher">
                  <Pin className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-2">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-mono">{channelMembers.length}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              {loadingMessages ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <div className="space-y-1.5">
                        <Skeleton className="w-24 h-3" />
                        <Skeleton className="w-48 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <Hash className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium">Bienvenue dans #{selectedChannel?.name}</p>
                  <p className="text-[11px]">C'est le début du canal. Envoyez le premier message !</p>
                </div>
              ) : (
                messagesByDate.map(group => (
                  <div key={group.date}>
                    <div className="flex items-center gap-3 px-4 py-2 my-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">{group.date}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    {group.messages.map(msg => {
                      const p = getProfile(msg.sender_id);
                      return (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          senderName={p.full_name}
                          senderAvatar={p.avatar_url}
                          isOnline={presenceMap.get(msg.sender_id)?.status === "online"}
                          reactions={getReactions(msg.id)}
                          attachments={attachmentsMap.get(msg.id) ?? []}
                          isMine={msg.sender_id === user?.id}
                          isPinned={pinnedIds.has(msg.id)}
                          onReact={(emoji) => handleReact(msg.id, emoji)}
                          onThreadOpen={() => setThreadId(msg.id)}
                          onPin={() => handlePin(msg.id, pinnedIds.has(msg.id))}
                          onEdit={(c) => handleEdit(msg.id, c)}
                          onDelete={() => handleDelete(msg.id)}
                        />
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="px-4 py-1 text-[10px] text-muted-foreground italic border-t border-border/50">
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "est en train d'écrire" : "sont en train d'écrire"}…
              </div>
            )}

            {/* Input */}
            <MessageInput
              onSend={handleSendMessage}
              onTyping={() => sendTyping(profile?.full_name ?? "Utilisateur")}
              placeholder={`Message #${selectedChannel?.name ?? "canal"}…`}
              members={membersList}
            />
          </>
        )}
      </div>

      {/* Thread Panel */}
      {threadId && threadParent && (
        <div className="w-[350px] flex-shrink-0 hidden lg:flex">
          <ThreadPanel
            parentMessage={threadParent}
            replies={threadReplies}
            profileMap={profileMap}
            presenceMap={presenceMap as any}
            reactionsMap={reactionsMap}
            attachmentsMap={attachmentsMap}
            pinnedIds={pinnedIds}
            currentUserId={user?.id ?? ""}
            onClose={() => setThreadId(null)}
            onSend={handleSendThreadReply}
            onReact={handleReact}
            onPin={handlePin}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTyping={() => sendTyping(profile?.full_name ?? "Utilisateur")}
            typingUsers={typingUsers}
            members={membersList}
          />
        </div>
      )}

      {/* Search Panel */}
      {showSearch && (
        <div className="w-[350px] flex-shrink-0 hidden lg:flex">
          <SearchPanel
            onClose={() => setShowSearch(false)}
            onNavigate={(channelId, messageId) => {
              setSelectedChannelId(channelId);
              setShowSearch(false);
            }}
          />
        </div>
      )}
    </motion.div>
  );
}
