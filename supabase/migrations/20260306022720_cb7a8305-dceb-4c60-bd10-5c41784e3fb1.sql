
-- Fix broken conversations SELECT policy (was comparing conversation_id to participants.id instead of conversations.id)
DROP POLICY IF EXISTS "Members view conversations" ON public.conversations;
CREATE POLICY "Members view conversations" ON public.conversations FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.conversation_participants
  WHERE conversation_participants.conversation_id = conversations.id
  AND conversation_participants.user_id = auth.uid()
));

-- Add INSERT policy for conversations (admins)
CREATE POLICY "Admins create conversations" ON public.conversations FOR INSERT TO authenticated
WITH CHECK (is_admin_or_coordinator(auth.uid()));

-- Add UPDATE policy for conversations
CREATE POLICY "Admins update conversations" ON public.conversations FOR UPDATE TO authenticated
USING (is_admin_or_coordinator(auth.uid()));

-- Add INSERT policy for conversation_participants (admins)
CREATE POLICY "Admins manage participants" ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (is_admin_or_coordinator(auth.uid()));

-- Add DELETE policy for conversation_participants
CREATE POLICY "Admins remove participants" ON public.conversation_participants FOR DELETE TO authenticated
USING (is_admin_or_coordinator(auth.uid()));

-- Users see own activities
CREATE POLICY "Users view own activities" ON public.activity_log FOR SELECT TO authenticated
USING (user_id = auth.uid());
