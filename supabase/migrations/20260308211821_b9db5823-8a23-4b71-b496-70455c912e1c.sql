
-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create storage buckets for avatars, logos, resources
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage RLS policies for logos
CREATE POLICY "Anyone can view logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Authenticated users upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "Admins manage logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND public.is_admin_or_coordinator(auth.uid()));

-- Storage RLS policies for resources
CREATE POLICY "Anyone can view resources files" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
CREATE POLICY "Authenticated upload resources" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.role() = 'authenticated');
CREATE POLICY "Admins delete resources files" ON storage.objects FOR DELETE USING (bucket_id = 'resources' AND public.is_admin_or_coordinator(auth.uid()));

-- Activity log trigger function
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'create', TG_TABLE_NAME, NEW.id, jsonb_build_object('name', COALESCE(NEW.name, NEW.title, '')));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id, jsonb_build_object('name', COALESCE(NEW.name, NEW.title, '')));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, jsonb_build_object('name', COALESCE(OLD.name, OLD.title, '')));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach activity triggers to key tables
CREATE TRIGGER log_startups_activity AFTER INSERT OR UPDATE OR DELETE ON public.startups FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_programs_activity AFTER INSERT OR UPDATE OR DELETE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_cohorts_activity AFTER INSERT OR UPDATE OR DELETE ON public.cohorts FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_projects_activity AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_grants_activity AFTER INSERT OR UPDATE OR DELETE ON public.grants FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_events_activity AFTER INSERT OR UPDATE OR DELETE ON public.events FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- Drop duplicate RLS policies
DROP POLICY IF EXISTS "Admins manage apps" ON public.applications;
DROP POLICY IF EXISTS "Admins view all apps" ON public.applications;
DROP POLICY IF EXISTS "Applicants view own" ON public.applications;
DROP POLICY IF EXISTS "Users submit apps" ON public.applications;

DROP POLICY IF EXISTS "Admins manage budgets" ON public.budgets;
DROP POLICY IF EXISTS "Budgets viewable" ON public.budgets;

DROP POLICY IF EXISTS "Admins manage cohorts" ON public.cohorts;
DROP POLICY IF EXISTS "Cohorts viewable" ON public.cohorts;

DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
DROP POLICY IF EXISTS "Courses viewable" ON public.courses;

DROP POLICY IF EXISTS "Admins manage events" ON public.events;
DROP POLICY IF EXISTS "Events viewable" ON public.events;

DROP POLICY IF EXISTS "Admins manage grants" ON public.grants;
DROP POLICY IF EXISTS "Grants viewable" ON public.grants;

DROP POLICY IF EXISTS "Admins manage mentors" ON public.mentor_profiles;
DROP POLICY IF EXISTS "Mentors insert own" ON public.mentor_profiles;
DROP POLICY IF EXISTS "Mentors update own" ON public.mentor_profiles;

DROP POLICY IF EXISTS "Admins manage milestones" ON public.milestones;
DROP POLICY IF EXISTS "Milestones viewable" ON public.milestones;

DROP POLICY IF EXISTS "Admins manage portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Portfolios viewable" ON public.portfolios;

DROP POLICY IF EXISTS "Admins manage programs" ON public.programs;
DROP POLICY IF EXISTS "Programs viewable" ON public.programs;

DROP POLICY IF EXISTS "Admins manage projects" ON public.projects;
DROP POLICY IF EXISTS "Projects viewable" ON public.projects;
DROP POLICY IF EXISTS "Owners update project" ON public.projects;

DROP POLICY IF EXISTS "Admins manage resources" ON public.resources;
DROP POLICY IF EXISTS "Resources viewable" ON public.resources;

DROP POLICY IF EXISTS "Admins manage risks" ON public.risks;
DROP POLICY IF EXISTS "Risks viewable" ON public.risks;

DROP POLICY IF EXISTS "Admins manage startups" ON public.startups;
DROP POLICY IF EXISTS "Startups viewable" ON public.startups;
DROP POLICY IF EXISTS "Founders insert startup" ON public.startups;
DROP POLICY IF EXISTS "Founders can update own startup" ON public.startups;

DROP POLICY IF EXISTS "Admins manage tasks" ON public.tasks;
DROP POLICY IF EXISTS "Tasks viewable" ON public.tasks;

DROP POLICY IF EXISTS "Matches viewable" ON public.mentor_matches;

DROP POLICY IF EXISTS "Sessions viewable" ON public.coaching_sessions;
DROP POLICY IF EXISTS "Mentors update sessions" ON public.coaching_sessions;

DROP POLICY IF EXISTS "Admins view enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users enroll" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users update progress" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users view enrollments" ON public.course_enrollments;

DROP POLICY IF EXISTS "Admins view registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users register" ON public.event_registrations;
DROP POLICY IF EXISTS "Users view registrations" ON public.event_registrations;

DROP POLICY IF EXISTS "Participants viewable" ON public.conversation_participants;

DROP POLICY IF EXISTS "Messages viewable" ON public.messages;

DROP POLICY IF EXISTS "Startup members viewable by authenticated" ON public.startup_members;

DROP POLICY IF EXISTS "Users view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update notifications" ON public.notifications;

-- Attach handle_new_user trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;
