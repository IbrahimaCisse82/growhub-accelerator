
-- =====================================================
-- SLACK-LIKE MESSAGING SYSTEM - COMPLETE SCHEMA
-- =====================================================

-- 1. CHANNELS TABLE
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  channel_type text NOT NULL DEFAULT 'public' CHECK (channel_type IN ('public', 'private', 'direct')),
  created_by uuid NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL,
  is_archived boolean NOT NULL DEFAULT false,
  topic text,
  icon text DEFAULT '#',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. CHANNEL MEMBERS
CREATE TABLE public.channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  muted boolean NOT NULL DEFAULT false,
  last_read_at timestamptz DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- 3. CHANNEL MESSAGES (replaces old messages for channels)
CREATE TABLE public.channel_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  thread_id uuid REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  is_thread_reply boolean NOT NULL DEFAULT false,
  reply_count integer NOT NULL DEFAULT 0,
  last_reply_at timestamptz,
  is_edited boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  edited_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. MESSAGE REACTIONS
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- 5. MESSAGE ATTACHMENTS
CREATE TABLE public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. MESSAGE MENTIONS
CREATE TABLE public.message_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- 7. PINNED MESSAGES
CREATE TABLE public.pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id)
);

-- 8. USER PRESENCE
CREATE TABLE public.user_presence (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'dnd', 'offline')),
  custom_status text,
  custom_emoji text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_channel_messages_channel ON public.channel_messages(channel_id, created_at DESC);
CREATE INDEX idx_channel_messages_thread ON public.channel_messages(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX idx_channel_members_user ON public.channel_members(user_id);
CREATE INDEX idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX idx_message_mentions_user ON public.message_mentions(user_id);
CREATE INDEX idx_channel_messages_search ON public.channel_messages USING gin(to_tsvector('french', content));

-- =====================================================
-- ENABLE REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Channels
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage channels" ON public.channels FOR ALL TO authenticated
  USING (is_admin_or_coordinator(auth.uid()));

CREATE POLICY "Members view channels" ON public.channels FOR SELECT TO authenticated
  USING (
    channel_type = 'public' 
    OR EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = channels.id AND user_id = auth.uid())
    OR is_admin_or_coordinator(auth.uid())
  );

CREATE POLICY "Users create channels" ON public.channels FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Channel Members
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view channel members" ON public.channel_members FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channel_members.channel_id AND cm.user_id = auth.uid())
    OR is_admin_or_coordinator(auth.uid())
  );

CREATE POLICY "Admins manage members" ON public.channel_members FOR ALL TO authenticated
  USING (is_admin_or_coordinator(auth.uid()));

CREATE POLICY "Users join public channels" ON public.channel_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (SELECT 1 FROM public.channels WHERE id = channel_id AND channel_type = 'public')
  );

CREATE POLICY "Users leave channels" ON public.channel_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Channel Messages
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view messages" ON public.channel_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = channel_messages.channel_id AND user_id = auth.uid())
    OR is_admin_or_coordinator(auth.uid())
  );

CREATE POLICY "Members send messages" ON public.channel_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = channel_messages.channel_id AND user_id = auth.uid())
  );

CREATE POLICY "Authors edit messages" ON public.channel_messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Authors delete messages" ON public.channel_messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR is_admin_or_coordinator(auth.uid()));

-- Reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view reactions" ON public.message_reactions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.channel_messages cm
      JOIN public.channel_members cmb ON cmb.channel_id = cm.channel_id
      WHERE cm.id = message_reactions.message_id AND cmb.user_id = auth.uid()
    )
  );

CREATE POLICY "Members add reactions" ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own reactions" ON public.message_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Attachments
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view attachments" ON public.message_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.channel_messages cm
      JOIN public.channel_members cmb ON cmb.channel_id = cm.channel_id
      WHERE cm.id = message_attachments.message_id AND cmb.user_id = auth.uid()
    )
  );

CREATE POLICY "Members add attachments" ON public.message_attachments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.channel_messages cm WHERE cm.id = message_attachments.message_id AND cm.sender_id = auth.uid()
    )
  );

-- Mentions
ALTER TABLE public.message_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mentions" ON public.message_mentions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin_or_coordinator(auth.uid()));

CREATE POLICY "Members create mentions" ON public.message_mentions FOR INSERT TO authenticated
  WITH CHECK (true);

-- Pinned Messages
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view pins" ON public.pinned_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = pinned_messages.channel_id AND user_id = auth.uid())
  );

CREATE POLICY "Members pin messages" ON public.pinned_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = pinned_by);

CREATE POLICY "Pinners or admins unpin" ON public.pinned_messages FOR DELETE TO authenticated
  USING (auth.uid() = pinned_by OR is_admin_or_coordinator(auth.uid()));

-- User Presence
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Presence viewable by authenticated" ON public.user_presence FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users update own presence" ON public.user_presence FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own presence" ON public.user_presence FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update reply_count on thread parent
CREATE OR REPLACE FUNCTION public.update_thread_reply_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.thread_id IS NOT NULL AND NEW.is_thread_reply = true THEN
    UPDATE public.channel_messages
    SET reply_count = reply_count + 1, last_reply_at = NEW.created_at
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_reply_count
  AFTER INSERT ON public.channel_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_thread_reply_count();

-- Update updated_at
CREATE TRIGGER trg_channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_channel_messages_updated_at
  BEFORE UPDATE ON public.channel_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_presence_updated_at
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET FOR MESSAGE ATTACHMENTS
-- =====================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', true);

CREATE POLICY "Authenticated upload attachments" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Public read attachments" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'message-attachments');

CREATE POLICY "Users delete own attachments" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'message-attachments');

-- =====================================================
-- SEARCH FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.search_messages(_query text, _channel_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  channel_id uuid,
  sender_id uuid,
  content text,
  created_at timestamptz,
  channel_name text,
  rank real
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT 
    cm.id, cm.channel_id, cm.sender_id, cm.content, cm.created_at,
    c.name as channel_name,
    ts_rank(to_tsvector('french', cm.content), plainto_tsquery('french', _query)) as rank
  FROM public.channel_messages cm
  JOIN public.channels c ON c.id = cm.channel_id
  JOIN public.channel_members cmb ON cmb.channel_id = cm.channel_id AND cmb.user_id = auth.uid()
  WHERE cm.is_deleted = false
    AND to_tsvector('french', cm.content) @@ plainto_tsquery('french', _query)
    AND (_channel_id IS NULL OR cm.channel_id = _channel_id)
  ORDER BY rank DESC, cm.created_at DESC
  LIMIT 50;
$$;
