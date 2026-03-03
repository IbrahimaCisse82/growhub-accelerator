
-- Fix permissive INSERT policies
DROP POLICY IF EXISTS "System create notifications" ON public.notifications;
CREATE POLICY "System create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin_or_coordinator(auth.uid()));

DROP POLICY IF EXISTS "Users create tasks" ON public.tasks;
CREATE POLICY "Users create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = assignee_id OR public.is_admin_or_coordinator(auth.uid()));

DROP POLICY IF EXISTS "System log activities" ON public.activity_log;
CREATE POLICY "System log activities" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin_or_coordinator(auth.uid()));
