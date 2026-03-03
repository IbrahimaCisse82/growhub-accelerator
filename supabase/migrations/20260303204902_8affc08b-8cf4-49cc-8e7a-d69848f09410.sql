
-- Drop partial types if they exist and recreate cleanly
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE public.project_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE public.application_status AS ENUM ('submitted', 'screening', 'interview', 'due_diligence', 'accepted', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
    CREATE TYPE public.session_status AS ENUM ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'in_review', 'done');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grant_status') THEN
    CREATE TYPE public.grant_status AS ENUM ('draft', 'active', 'disbursing', 'closing', 'closed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE public.event_type AS ENUM ('demo_day', 'workshop', 'networking', 'hackathon', 'committee', 'webinar', 'other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_level') THEN
    CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '', email TEXT, phone TEXT, avatar_url TEXT, bio TEXT,
  organization TEXT, position TEXT, linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- USER ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL, UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin', 'coordinator'))
$$;

-- PROFILES RLS
DO $$ BEGIN
  CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- USER ROLES RLS
DO $$ BEGIN
  CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PORTFOLIOS
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  description TEXT, objectives TEXT, owner_id UUID REFERENCES auth.users(id),
  status project_status NOT NULL DEFAULT 'draft', start_date DATE, end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON public.portfolios;
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Portfolios viewable" ON public.portfolios FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage portfolios" ON public.portfolios FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PROGRAMS
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT, funder TEXT,
  status project_status NOT NULL DEFAULT 'draft', start_date DATE, end_date DATE,
  budget_total NUMERIC(15,2) DEFAULT 0, currency TEXT DEFAULT 'XOF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_programs_updated_at ON public.programs;
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Programs viewable" ON public.programs FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage programs" ON public.programs FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- COHORTS
CREATE TABLE IF NOT EXISTS public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  name TEXT NOT NULL, description TEXT, status project_status NOT NULL DEFAULT 'draft',
  start_date DATE, end_date DATE, max_startups INT DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_cohorts_updated_at ON public.cohorts;
CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON public.cohorts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Cohorts viewable" ON public.cohorts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage cohorts" ON public.cohorts FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- STARTUPS
CREATE TABLE IF NOT EXISTS public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, description TEXT,
  sector TEXT, stage TEXT, founder_id UUID REFERENCES auth.users(id),
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL, logo_url TEXT, website TEXT,
  pitch_deck_url TEXT, score NUMERIC(5,2), country TEXT DEFAULT 'Sénégal', city TEXT,
  team_size INT DEFAULT 1, founded_date DATE, revenue_monthly NUMERIC(15,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_startups_updated_at ON public.startups;
CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON public.startups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Startups viewable" ON public.startups FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Founders update startup" ON public.startups FOR UPDATE TO authenticated USING (auth.uid() = founder_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Founders insert startup" ON public.startups FOR INSERT TO authenticated WITH CHECK (auth.uid() = founder_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage startups" ON public.startups FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- STARTUP MEMBERS
CREATE TABLE IF NOT EXISTS public.startup_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, full_name TEXT NOT NULL, role TEXT, email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.startup_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Members viewable" ON public.startup_members FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage members" ON public.startup_members FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- APPLICATIONS
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL, cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  applicant_id UUID NOT NULL REFERENCES auth.users(id), status application_status NOT NULL DEFAULT 'submitted',
  motivation TEXT, score NUMERIC(5,2), evaluator_id UUID REFERENCES auth.users(id), evaluation_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(), reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Applicants view own" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = applicant_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Evaluators view assigned" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = evaluator_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins view all apps" ON public.applications FOR SELECT TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users submit apps" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = applicant_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage apps" ON public.applications FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- MENTOR PROFILES
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  expertise_areas TEXT[], bio TEXT, hourly_rate NUMERIC(10,2), availability TEXT DEFAULT 'available',
  max_startups INT DEFAULT 5, linkedin_url TEXT, total_sessions INT DEFAULT 0, average_rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_mentor_profiles_updated_at ON public.mentor_profiles;
CREATE TRIGGER update_mentor_profiles_updated_at BEFORE UPDATE ON public.mentor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Mentor profiles viewable" ON public.mentor_profiles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Mentors update own" ON public.mentor_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Mentors insert own" ON public.mentor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage mentors" ON public.mentor_profiles FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- MENTOR MATCHES
CREATE TABLE IF NOT EXISTS public.mentor_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), mentor_id UUID NOT NULL REFERENCES auth.users(id),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  match_score NUMERIC(5,2), status TEXT DEFAULT 'pending', matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mentor_id, startup_id)
);
ALTER TABLE public.mentor_matches ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Matches viewable" ON public.mentor_matches FOR SELECT TO authenticated USING (auth.uid() = mentor_id OR public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage matches" ON public.mentor_matches FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- COACHING SESSIONS
CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), mentor_id UUID NOT NULL REFERENCES auth.users(id),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, scheduled_at TIMESTAMPTZ NOT NULL, duration_minutes INT DEFAULT 60,
  status session_status NOT NULL DEFAULT 'planned', notes TEXT, rating NUMERIC(3,2), feedback TEXT, meeting_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_coaching_sessions_updated_at ON public.coaching_sessions;
CREATE TRIGGER update_coaching_sessions_updated_at BEFORE UPDATE ON public.coaching_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Sessions viewable" ON public.coaching_sessions FOR SELECT TO authenticated USING (auth.uid() = mentor_id OR public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage sessions" ON public.coaching_sessions FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Mentors update sessions" ON public.coaching_sessions FOR UPDATE TO authenticated USING (auth.uid() = mentor_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  startup_id UUID REFERENCES public.startups(id) ON DELETE SET NULL, code TEXT, name TEXT NOT NULL,
  description TEXT, status project_status NOT NULL DEFAULT 'draft', progress NUMERIC(5,2) DEFAULT 0,
  start_date DATE, end_date DATE, budget NUMERIC(15,2) DEFAULT 0, owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Projects viewable" ON public.projects FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Owners update project" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = owner_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage projects" ON public.projects FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium', assignee_id UUID REFERENCES auth.users(id),
  due_date DATE, tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Tasks viewable" ON public.tasks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Assignees update tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = assignee_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage tasks" ON public.tasks FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- MILESTONES
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, due_date DATE, completed_at TIMESTAMPTZ, status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Milestones viewable" ON public.milestones FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage milestones" ON public.milestones FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RISKS
CREATE TABLE IF NOT EXISTS public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, level risk_level NOT NULL DEFAULT 'medium', mitigation TEXT,
  owner_id UUID REFERENCES auth.users(id), status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_risks_updated_at ON public.risks;
CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON public.risks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Risks viewable" ON public.risks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage risks" ON public.risks FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- GRANTS
CREATE TABLE IF NOT EXISTS public.grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  organization TEXT, description TEXT, amount_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_disbursed NUMERIC(15,2) DEFAULT 0, currency TEXT DEFAULT 'XOF',
  status grant_status NOT NULL DEFAULT 'draft', program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  start_date DATE, end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_grants_updated_at ON public.grants;
CREATE TRIGGER update_grants_updated_at BEFORE UPDATE ON public.grants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Grants viewable" ON public.grants FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage grants" ON public.grants FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- BUDGETS
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  grant_id UUID REFERENCES public.grants(id) ON DELETE SET NULL, category TEXT NOT NULL, label TEXT NOT NULL,
  amount_planned NUMERIC(15,2) DEFAULT 0, amount_spent NUMERIC(15,2) DEFAULT 0, currency TEXT DEFAULT 'XOF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Budgets viewable" ON public.budgets FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage budgets" ON public.budgets FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- COURSES
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT,
  level TEXT DEFAULT 'beginner', duration_hours NUMERIC(5,1) DEFAULT 0, modules_count INT DEFAULT 0,
  thumbnail_url TEXT, instructor_id UUID REFERENCES auth.users(id),
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL, is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Courses viewable" ON public.courses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- COURSE ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, progress NUMERIC(5,2) DEFAULT 0,
  completed_at TIMESTAMPTZ, enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (course_id, user_id)
);
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users view enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins view enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users enroll" ON public.course_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users update progress" ON public.course_enrollments FOR UPDATE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT,
  event_type event_type NOT NULL DEFAULT 'other', location TEXT, is_online BOOLEAN DEFAULT false,
  meeting_url TEXT, start_at TIMESTAMPTZ NOT NULL, end_at TIMESTAMPTZ, max_attendees INT,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL, organizer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN CREATE POLICY "Events viewable" ON public.events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- EVENT REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users view registrations" ON public.event_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users register" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins view registrations" ON public.event_registrations FOR SELECT TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT, is_group BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id), content TEXT NOT NULL, read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id UUID, _conversation_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants WHERE user_id = _user_id AND conversation_id = _conversation_id)
$$;

DO $$ BEGIN CREATE POLICY "Members view conversations" ON public.conversations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = id AND user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Participants viewable" ON public.conversation_participants FOR SELECT TO authenticated USING (public.is_conversation_member(auth.uid(), conversation_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Messages viewable" ON public.messages FOR SELECT TO authenticated USING (public.is_conversation_member(auth.uid(), conversation_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Members send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND public.is_conversation_member(auth.uid(), conversation_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, content TEXT, type TEXT DEFAULT 'info', is_read BOOLEAN DEFAULT false, link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users view notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users update notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "System create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RESOURCES
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT,
  type TEXT DEFAULT 'document', file_url TEXT, category TEXT,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL, uploaded_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Resources viewable" ON public.resources FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage resources" ON public.resources FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ACTIVITY LOG
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, entity_type TEXT, entity_id UUID, metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Activity viewable by admins" ON public.activity_log FOR SELECT TO authenticated USING (public.is_admin_or_coordinator(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "System log activities" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'entrepreneur');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_startups_cohort ON public.startups(cohort_id);
CREATE INDEX IF NOT EXISTS idx_startups_founder ON public.startups(founder_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON public.applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_mentor ON public.coaching_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_scheduled ON public.coaching_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
