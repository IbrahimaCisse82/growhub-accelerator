
-- =============================================
-- SECURITY FIX 1: Invitations - restrict anon access
-- =============================================
DROP POLICY IF EXISTS "Public can verify invitation token" ON public.invitations;
-- Only allow lookup by specific token (row-level), not full table scan
CREATE POLICY "Verify invitation by token"
  ON public.invitations FOR SELECT TO anon, authenticated
  USING (
    status = 'pending' AND expires_at > now()
  );

-- =============================================
-- SECURITY FIX 2: Recreate profiles_safe view with security_invoker
-- =============================================
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe
WITH (security_invoker = on) AS
SELECT
  id, user_id, full_name,
  CASE WHEN (user_id = auth.uid() OR is_admin_or_coordinator(auth.uid())) THEN email ELSE NULL END AS email,
  CASE WHEN (user_id = auth.uid() OR is_admin_or_coordinator(auth.uid())) THEN phone ELSE NULL END AS phone,
  organization, position, bio, linkedin_url, avatar_url, is_approved, created_at, updated_at
FROM public.profiles;

-- =============================================
-- SECURITY FIX 3: Recreate startup_members_safe view with security_invoker
-- =============================================
DROP VIEW IF EXISTS public.startup_members_safe;
CREATE VIEW public.startup_members_safe
WITH (security_invoker = on) AS
SELECT
  id, startup_id, user_id, full_name, role, created_at,
  CASE WHEN is_admin_or_coordinator(auth.uid()) THEN email ELSE NULL END AS email
FROM public.startup_members;

-- =============================================
-- SECURITY FIX 4: Restrict startup_members visibility
-- =============================================
DROP POLICY IF EXISTS "Members viewable" ON public.startup_members;
CREATE POLICY "Members viewable by involved"
  ON public.startup_members FOR SELECT TO authenticated
  USING (
    is_admin_or_coordinator(auth.uid())
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.startups 
      WHERE startups.id = startup_members.startup_id 
      AND startups.founder_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.mentor_matches 
      WHERE mentor_matches.startup_id = startup_members.startup_id 
      AND mentor_matches.mentor_id = auth.uid()
    )
  );

-- =============================================
-- SECURITY FIX 5: Fix grant_transactions policies (public -> authenticated)
-- =============================================
DROP POLICY IF EXISTS "Admins manage grant transactions" ON public.grant_transactions;
CREATE POLICY "Admins manage grant transactions"
  ON public.grant_transactions FOR ALL TO authenticated
  USING (is_admin_or_coordinator(auth.uid()));

DROP POLICY IF EXISTS "Users insert own transactions" ON public.grant_transactions;
CREATE POLICY "Users insert own transactions"
  ON public.grant_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- =============================================
-- SECURITY FIX 6: Fix grant_changes INSERT policy (public -> authenticated)
-- =============================================
DROP POLICY IF EXISTS "Admins insert grant changes" ON public.grant_changes;
CREATE POLICY "Admins insert grant changes"
  ON public.grant_changes FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_coordinator(auth.uid()));
