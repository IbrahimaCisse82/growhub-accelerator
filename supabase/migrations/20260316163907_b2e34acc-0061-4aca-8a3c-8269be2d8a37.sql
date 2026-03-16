
-- =============================================
-- FIX 1: Invitations - use security definer function for token verification
-- =============================================
DROP POLICY IF EXISTS "Verify invitation by token" ON public.invitations;

-- No anon SELECT at all on invitations table
-- Create a security definer function for token verification
CREATE OR REPLACE FUNCTION public.verify_invitation_token(_token text)
RETURNS TABLE(email text, role app_role, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT email, role, status
  FROM public.invitations
  WHERE token = _token AND status = 'pending' AND expires_at > now()
  LIMIT 1;
$$;

-- Only admins can view invitations list
CREATE POLICY "Only admins view invitations"
  ON public.invitations FOR SELECT TO authenticated
  USING (is_admin_or_coordinator(auth.uid()));

-- =============================================
-- FIX 2: Resources - respect is_public flag
-- =============================================
DROP POLICY IF EXISTS "Resources viewable by authenticated" ON public.resources;
CREATE POLICY "Public resources viewable"
  ON public.resources FOR SELECT TO authenticated
  USING (is_public = true);
CREATE POLICY "Admins view all resources"
  ON public.resources FOR SELECT TO authenticated
  USING (is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Uploader views own resources"
  ON public.resources FOR SELECT TO authenticated
  USING (auth.uid() = uploaded_by);
