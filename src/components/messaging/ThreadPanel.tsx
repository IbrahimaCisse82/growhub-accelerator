import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { X } from "lucide-react";
import { ChannelMessage, ReactionGroup, Attachment } from "@/hooks/useMessaging";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

type Props = {
  parentMessage: ChannelMessage;
  replies: ChannelMessage[];
  profileMap: Map<string, { user_id: string; full_name: string; avatar_url: string | null }>;
  presenceMap: Map<string, { status: string }>;
  reactionsMap: Map<string, ReactionGroup[]>;
  attachmentsMap: Map<string, Attachment[]>;
  pinnedIds: Set<string>;
  currentUserId: string;
  onClose: () => void;
  onSend: (content: string, attachments?: any[], mentionIds?: string[]) => void;
  onReact: (messageId: string, emoji: string) => void;
  onPin: (messageId: string, isPinned: boolean) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onTyping: () => void;
  typingUsers: string[];
  members: { user_id: string; full_name: string }[];
};

export default function ThreadPanel({
  parentMessage, replies, profileMap, presenceMap, reactionsMap, attachmentsMap,
  pinnedIds, currentUserId, onClose, onSend, onReact, onPin, onEdit, onDelete,
  onTyping, typingUsers, members,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [replies.length]);

  const getProfile = (userId: string) => profileMap.get(userId) ?? { user_id: userId, full_name: "Utilisateur", avatar_url: null };
  const getReactions = (msgId: string) => {
    const r = reactionsMap.get(msgId) ?? [];
    return r.map(rg => ({ ...rg, reacted: rg.users.includes(currentUserId) }));
  };

  const parentProfile = getProfile(parentMessage.sender_id);

  return (
    <div className="w-full h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-foreground">Fil de discussion</div>
          <div className="text-[10px] text-muted-foreground">{replies.length} réponse{replies.length !== 1 ? "s" : ""}</div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Parent message */}
        <div className="border-b border-border">
          <MessageBubble
            message={parentMessage}
            senderName={parentProfile.full_name}
            senderAvatar={parentProfile.avatar_url}
            isOnline={presenceMap.get(parentMessage.sender_id)?.status === "online"}
            reactions={getReactions(parentMessage.id)}
            attachments={attachmentsMap.get(parentMessage.id) ?? []}
            isMine={parentMessage.sender_id === currentUserId}
            isPinned={pinnedIds.has(parentMessage.id)}
            onReact={(emoji) => onReact(parentMessage.id, emoji)}
            onThreadOpen={() => {}}
            onPin={() => onPin(parentMessage.id, pinnedIds.has(parentMessage.id))}
            onEdit={(c) => onEdit(parentMessage.id, c)}
            onDelete={() => onDelete(parentMessage.id)}
          />
        </div>

        <div className="px-4 py-2 text-[10px] text-muted-foreground font-medium">
          {replies.length} réponse{replies.length !== 1 ? "s" : ""}
        </div>

        {/* Replies */}
        {replies.map(msg => {
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
              isMine={msg.sender_id === currentUserId}
              isPinned={pinnedIds.has(msg.id)}
              onReact={(emoji) => onReact(msg.id, emoji)}
              onThreadOpen={() => {}}
              onPin={() => onPin(msg.id, pinnedIds.has(msg.id))}
              onEdit={(c) => onEdit(msg.id, c)}
              onDelete={() => onDelete(msg.id)}
            />
          );
        })}
      </div>

      {/* Typing */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-[10px] text-muted-foreground italic">
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "écrit" : "écrivent"}…
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSend={(content, attachments, mentionIds) => onSend(content, attachments, mentionIds)}
        onTyping={onTyping}
        placeholder="Répondre dans le fil…"
        members={members}
      />
    </div>
  );
}
