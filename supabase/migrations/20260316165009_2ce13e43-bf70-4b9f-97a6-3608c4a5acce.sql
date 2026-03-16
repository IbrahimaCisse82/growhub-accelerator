
-- 1. Fix profiles_safe view: use SECURITY INVOKER and mask PII for non-admins
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe WITH (security_invoker = on) AS
SELECT
  id,
  user_id,
  full_name,
  avatar_url,
  bio,
  organization,
  position,
  linkedin_url,
  is_approved,
  created_at,
  updated_at,
  CASE WHEN (user_id = auth.uid() OR public.is_admin_or_coordinator(auth.uid())) THEN email ELSE NULL END AS email,
  CASE WHEN (user_id = auth.uid() OR public.is_admin_or_coordinator(auth.uid())) THEN phone ELSE NULL END AS phone
FROM public.profiles;

-- 2. Fix startup_members_safe view: mask email for non-admins
DROP VIEW IF EXISTS public.startup_members_safe;
CREATE VIEW public.startup_members_safe WITH (security_invoker = on) AS
SELECT
  id,
  startup_id,
  user_id,
  full_name,
  role,
  created_at,
  CASE WHEN public.is_admin_or_coordinator(auth.uid()) THEN email ELSE NULL END AS email
FROM public.startup_members;

-- 3. Fix conversation_participants INSERT policy: prevent member from adding arbitrary users
DROP POLICY IF EXISTS "Users add participants to own conversations" ON public.conversation_participants;
CREATE POLICY "Users add participants to own conversations"
ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid()) OR is_admin_or_coordinator(auth.uid())
);
