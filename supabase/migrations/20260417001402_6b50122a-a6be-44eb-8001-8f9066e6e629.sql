-- V4: User notification preferences
CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
  user_id UUID PRIMARY KEY,
  task_notifications BOOLEAN NOT NULL DEFAULT true,
  application_notifications BOOLEAN NOT NULL DEFAULT true,
  coaching_notifications BOOLEAN NOT NULL DEFAULT true,
  milestone_notifications BOOLEAN NOT NULL DEFAULT true,
  risk_notifications BOOLEAN NOT NULL DEFAULT true,
  message_notifications BOOLEAN NOT NULL DEFAULT true,
  email_digest_enabled BOOLEAN NOT NULL DEFAULT false,
  email_digest_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (email_digest_frequency IN ('daily','weekly','never')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prefs"
  ON public.user_notification_prefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prefs"
  ON public.user_notification_prefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prefs"
  ON public.user_notification_prefs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_notification_prefs_updated_at
  BEFORE UPDATE ON public.user_notification_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- V4: Generic entity comments
CREATE TABLE IF NOT EXISTS public.entity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.entity_comments(id) ON DELETE CASCADE,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entity_comments_entity ON public.entity_comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_comments_author ON public.entity_comments(author_id);

ALTER TABLE public.entity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
  ON public.entity_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.entity_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their comments"
  ON public.entity_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete comments"
  ON public.entity_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_admin_or_coordinator(auth.uid()));

CREATE TRIGGER trg_entity_comments_updated_at
  BEFORE UPDATE ON public.entity_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();