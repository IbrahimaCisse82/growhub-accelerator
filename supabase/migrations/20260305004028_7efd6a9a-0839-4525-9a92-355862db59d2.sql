
-- Allow admins to update any profile (for approval/revocation)
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_admin_or_coordinator(auth.uid()))
WITH CHECK (is_admin_or_coordinator(auth.uid()));
