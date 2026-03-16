
-- Tighten conversation creation: any authenticated user can create
DROP POLICY IF EXISTS "Authenticated create conversations" ON public.conversations;
CREATE POLICY "Authenticated create conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tighten participant addition: user can only add themselves or if they're admin
DROP POLICY IF EXISTS "Authenticated add participants" ON public.conversation_participants;
CREATE POLICY "Users add participants to own conversations"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    OR is_conversation_member(auth.uid(), conversation_id)
    OR is_admin_or_coordinator(auth.uid())
  );
