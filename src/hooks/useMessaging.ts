import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useCallback, useRef } from "react";

// ── Types ──
export type Channel = {
  id: string;
  name: string;
  description: string | null;
  channel_type: string;
  created_by: string;
  program_id: string | null;
  cohort_id: string | null;
  is_archived: boolean;
  topic: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
};

export type ChannelMessage = {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  thread_id: string | null;
  is_thread_reply: boolean;
  reply_count: number;
  last_reply_at: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  edited_at: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  reactions?: ReactionGroup[];
  attachments?: Attachment[];
};

export type ReactionGroup = {
  emoji: string;
  count: number;
  users: string[];
  reacted: boolean;
};

export type Attachment = {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
};

export type UserPresence = {
  user_id: string;
  status: "online" | "away" | "dnd" | "offline";
  custom_status: string | null;
  custom_emoji: string | null;
  last_seen_at: string;
};

// ── Channels ──
export function useChannels() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Channel[];
    },
    enabled: !!user,
  });
}

export function useChannelMembers(channelId: string | null) {
  return useQuery({
    queryKey: ["channel-members", channelId],
    queryFn: async () => {
      if (!channelId) return [];
      const { data, error } = await supabase
        .from("channel_members")
        .select("*")
        .eq("channel_id", channelId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!channelId,
  });
}

// ── Messages ──
export function useChannelMessages(channelId: string | null, threadId?: string | null) {
  return useQuery({
    queryKey: ["channel-messages", channelId, threadId ?? "main"],
    queryFn: async () => {
      if (!channelId) return [];
      let query = supabase
        .from("channel_messages")
        .select("*")
        .eq("channel_id", channelId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (threadId) {
        query = query.or(`id.eq.${threadId},thread_id.eq.${threadId}`);
      } else {
        query = query.eq("is_thread_reply", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ChannelMessage[];
    },
    enabled: !!channelId,
  });
}

// ── Reactions for messages ──
export function useMessageReactions(messageIds: string[]) {
  return useQuery({
    queryKey: ["message-reactions", messageIds.sort().join(",")],
    queryFn: async () => {
      if (messageIds.length === 0) return new Map<string, ReactionGroup[]>();
      const { data, error } = await supabase
        .from("message_reactions")
        .select("*")
        .in("message_id", messageIds);
      if (error) throw error;

      const grouped = new Map<string, ReactionGroup[]>();
      const byMessage = new Map<string, Map<string, { count: number; users: string[] }>>();

      for (const r of data ?? []) {
        if (!byMessage.has(r.message_id)) byMessage.set(r.message_id, new Map());
        const emojiMap = byMessage.get(r.message_id)!;
        if (!emojiMap.has(r.emoji)) emojiMap.set(r.emoji, { count: 0, users: [] });
        const entry = emojiMap.get(r.emoji)!;
        entry.count++;
        entry.users.push(r.user_id);
      }

      for (const [msgId, emojiMap] of byMessage) {
        grouped.set(
          msgId,
          Array.from(emojiMap.entries()).map(([emoji, { count, users }]) => ({
            emoji,
            count,
            users,
            reacted: false, // will be set by component
          }))
        );
      }

      return grouped;
    },
    enabled: messageIds.length > 0,
  });
}

// ── Attachments for messages ──
export function useMessageAttachments(messageIds: string[]) {
  return useQuery({
    queryKey: ["message-attachments", messageIds.sort().join(",")],
    queryFn: async () => {
      if (messageIds.length === 0) return new Map<string, Attachment[]>();
      const { data, error } = await supabase
        .from("message_attachments")
        .select("*")
        .in("message_id", messageIds);
      if (error) throw error;

      const grouped = new Map<string, Attachment[]>();
      for (const a of data ?? []) {
        if (!grouped.has(a.message_id)) grouped.set(a.message_id, []);
        grouped.get(a.message_id)!.push(a as Attachment);
      }
      return grouped;
    },
    enabled: messageIds.length > 0,
  });
}

// ── Mutations ──
export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      channelId: string;
      senderId: string;
      content: string;
      threadId?: string;
      mentionIds?: string[];
      attachments?: { file_name: string; file_url: string; file_size?: number; file_type?: string }[];
    }) => {
      const { data: msg, error } = await supabase
        .from("channel_messages")
        .insert({
          channel_id: params.channelId,
          sender_id: params.senderId,
          content: params.content,
          thread_id: params.threadId ?? null,
          is_thread_reply: !!params.threadId,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert mentions
      if (params.mentionIds && params.mentionIds.length > 0) {
        await supabase.from("message_mentions").insert(
          params.mentionIds.map((uid) => ({ message_id: msg.id, user_id: uid }))
        );
      }

      // Insert attachments
      if (params.attachments && params.attachments.length > 0) {
        await supabase.from("message_attachments").insert(
          params.attachments.map((a) => ({ message_id: msg.id, ...a }))
        );
      }

      return msg;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["channel-messages", vars.channelId] });
    },
  });
}

export function useEditMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { messageId: string; content: string; channelId: string }) => {
      const { error } = await supabase
        .from("channel_messages")
        .update({ content: params.content, is_edited: true, edited_at: new Date().toISOString() })
        .eq("id", params.messageId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["channel-messages", vars.channelId] });
    },
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { messageId: string; channelId: string }) => {
      const { error } = await supabase
        .from("channel_messages")
        .update({ is_deleted: true })
        .eq("id", params.messageId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["channel-messages", vars.channelId] });
    },
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { messageId: string; userId: string; emoji: string }) => {
      // Check if exists
      const { data: existing } = await supabase
        .from("message_reactions")
        .select("id")
        .eq("message_id", params.messageId)
        .eq("user_id", params.userId)
        .eq("emoji", params.emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from("message_reactions").delete().eq("id", existing.id);
      } else {
        await supabase.from("message_reactions").insert({
          message_id: params.messageId,
          user_id: params.userId,
          emoji: params.emoji,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message-reactions"] });
    },
  });
}

export function useTogglePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { messageId: string; channelId: string; userId: string; isPinned: boolean }) => {
      if (params.isPinned) {
        await supabase.from("pinned_messages").delete().eq("message_id", params.messageId);
      } else {
        await supabase.from("pinned_messages").insert({
          message_id: params.messageId,
          channel_id: params.channelId,
          pinned_by: params.userId,
        });
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["pinned-messages", vars.channelId] });
    },
  });
}

export function usePinnedMessages(channelId: string | null) {
  return useQuery({
    queryKey: ["pinned-messages", channelId],
    queryFn: async () => {
      if (!channelId) return [];
      const { data, error } = await supabase
        .from("pinned_messages")
        .select("*, channel_messages(*)")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!channelId,
  });
}

// ── Channel mutations ──
export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      description?: string;
      channel_type: string;
      created_by: string;
      topic?: string;
      icon?: string;
    }) => {
      const { data: channel, error } = await supabase
        .from("channels")
        .insert(params)
        .select()
        .single();
      if (error) throw error;

      // Add creator as owner
      await supabase.from("channel_members").insert({
        channel_id: channel.id,
        user_id: params.created_by,
        role: "owner",
      });

      return channel;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useJoinChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { channelId: string; userId: string }) => {
      const { error } = await supabase
        .from("channel_members")
        .insert({ channel_id: params.channelId, user_id: params.userId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["channels"] });
      qc.invalidateQueries({ queryKey: ["channel-members"] });
    },
  });
}

export function useLeaveChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { channelId: string; userId: string }) => {
      const { error } = await supabase
        .from("channel_members")
        .delete()
        .eq("channel_id", params.channelId)
        .eq("user_id", params.userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["channels"] });
      qc.invalidateQueries({ queryKey: ["channel-members"] });
    },
  });
}

// ── Search ──
export function useSearchMessages(query: string, channelId?: string) {
  return useQuery({
    queryKey: ["search-messages", query, channelId],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase.rpc("search_messages", {
        _query: query,
        _channel_id: channelId ?? null,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: query.length >= 2,
  });
}

// ── Presence ──
export function usePresence() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Heartbeat: update presence every 30s
  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      await supabase.from("user_presence").upsert({
        user_id: user.id,
        status: "online",
        last_seen_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    };

    updatePresence();
    const interval = setInterval(updatePresence, 30_000);

    // Set offline on unmount
    return () => {
      clearInterval(interval);
      supabase.from("user_presence").upsert({
        user_id: user.id,
        status: "offline",
        last_seen_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    };
  }, [user?.id]);

  return useQuery({
    queryKey: ["user-presence"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_presence").select("*");
      if (error) throw error;
      return new Map((data ?? []).map((p) => [p.user_id, p as UserPresence]));
    },
    refetchInterval: 30_000,
    enabled: !!user,
  });
}

// ── Realtime subscriptions ──
export function useMessagingRealtime(channelId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!channelId) return;

    const channel = supabase
      .channel(`slack-messages-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "channel_messages", filter: `channel_id=eq.${channelId}` },
        () => qc.invalidateQueries({ queryKey: ["channel-messages", channelId] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        () => qc.invalidateQueries({ queryKey: ["message-reactions"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, qc]);
}

// ── Typing indicator using Realtime Broadcast ──
export function useTypingIndicator(channelId: string | null) {
  const { user } = useAuth();
  const typingRef = useRef<Record<string, { name: string; timeout: NodeJS.Timeout }>>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!channelId || !user) return;

    const ch = supabase.channel(`typing-${channelId}`);
    channelRef.current = ch;

    ch.on("broadcast", { event: "typing" }, (payload: any) => {
      const { userId, userName } = payload.payload;
      if (userId === user.id) return;

      // Clear existing timeout
      if (typingRef.current[userId]) {
        clearTimeout(typingRef.current[userId].timeout);
      }

      typingRef.current[userId] = {
        name: userName,
        timeout: setTimeout(() => {
          delete typingRef.current[userId];
          setTypingUsers(Object.values(typingRef.current).map((t) => t.name));
        }, 3000),
      };

      setTypingUsers(Object.values(typingRef.current).map((t) => t.name));
    }).subscribe();

    return () => {
      supabase.removeChannel(ch);
      Object.values(typingRef.current).forEach((t) => clearTimeout(t.timeout));
      typingRef.current = {};
    };
  }, [channelId, user?.id]);

  const sendTyping = useCallback(
    (userName: string) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: user?.id, userName },
      });
    },
    [user?.id]
  );

  return { typingUsers, sendTyping };
}

// Need to import useState for typing indicator
import { useState } from "react";

// ── Profiles batch ──
export function useProfilesBatch(userIds: string[]) {
  return useQuery({
    queryKey: ["profiles-batch", userIds.sort().join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return new Map<string, { user_id: string; full_name: string; avatar_url: string | null }>();
      const { data, error } = await supabase
        .from("profiles_safe")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      if (error) throw error;
      return new Map((data ?? []).map((p) => [p.user_id, p]));
    },
    enabled: userIds.length > 0,
  });
}
