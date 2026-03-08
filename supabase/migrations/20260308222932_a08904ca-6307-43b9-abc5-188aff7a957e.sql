
-- Fix: restrict INSERT to system-level (triggers are SECURITY DEFINER so they bypass RLS)
DROP POLICY "System insert grant changes" ON public.grant_changes;

CREATE POLICY "Admins insert grant changes"
  ON public.grant_changes FOR INSERT
  WITH CHECK (is_admin_or_coordinator(auth.uid()));
