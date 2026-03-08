
-- 1. Fix coaching_sessions: allow startup founders to see their sessions
DROP POLICY IF EXISTS "Sessions viewable by involved" ON public.coaching_sessions;
CREATE POLICY "Sessions viewable by involved" ON public.coaching_sessions FOR SELECT TO authenticated
  USING (
    auth.uid() = mentor_id 
    OR is_admin_or_coordinator(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.startups 
      WHERE startups.id = coaching_sessions.startup_id 
      AND startups.founder_id = auth.uid()
    )
  );

-- 2. Fix mentor_matches: allow startup founders to see their matches
DROP POLICY IF EXISTS "Matches viewable by involved" ON public.mentor_matches;
CREATE POLICY "Matches viewable by involved" ON public.mentor_matches FOR SELECT TO authenticated
  USING (
    auth.uid() = mentor_id 
    OR is_admin_or_coordinator(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.startups 
      WHERE startups.id = mentor_matches.startup_id 
      AND startups.founder_id = auth.uid()
    )
  );
