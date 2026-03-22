
-- Mentor availability slots for self-service scheduling
CREATE TABLE public.mentor_availability_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  booked_by UUID REFERENCES auth.users(id),
  booked_at TIMESTAMPTZ,
  session_id UUID REFERENCES public.coaching_sessions(id),
  recurrence TEXT DEFAULT 'none',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_availability_slots ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can see slots
CREATE POLICY "Authenticated users can view slots"
  ON public.mentor_availability_slots FOR SELECT
  TO authenticated USING (true);

-- Mentors can manage their own slots
CREATE POLICY "Mentors can insert own slots"
  ON public.mentor_availability_slots FOR INSERT
  TO authenticated WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Mentors can update own slots"
  ON public.mentor_availability_slots FOR UPDATE
  TO authenticated USING (mentor_id = auth.uid() OR public.is_admin_or_coordinator(auth.uid()));

CREATE POLICY "Mentors can delete own slots"
  ON public.mentor_availability_slots FOR DELETE
  TO authenticated USING (mentor_id = auth.uid() OR public.is_admin_or_coordinator(auth.uid()));

-- Entrepreneurs can book (update is_booked)
CREATE POLICY "Entrepreneurs can book slots"
  ON public.mentor_availability_slots FOR UPDATE
  TO authenticated USING (is_booked = false);

-- Public applications table for unauthenticated candidates
CREATE TABLE public.public_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  startup_name TEXT NOT NULL,
  sector TEXT,
  stage TEXT,
  website TEXT,
  pitch TEXT,
  motivation TEXT,
  program_id UUID REFERENCES public.programs(id),
  project_id UUID REFERENCES public.projects(id),
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.public_applications ENABLE ROW LEVEL SECURITY;

-- Anon can insert (public form)
CREATE POLICY "Anyone can submit public applications"
  ON public.public_applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Admins/coordinators can read
CREATE POLICY "Admins can view public applications"
  ON public.public_applications FOR SELECT
  TO authenticated USING (public.is_admin_or_coordinator(auth.uid()));

-- Admins can update (review)
CREATE POLICY "Admins can update public applications"
  ON public.public_applications FOR UPDATE
  TO authenticated USING (public.is_admin_or_coordinator(auth.uid()));
