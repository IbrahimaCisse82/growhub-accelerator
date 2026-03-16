
-- Course modules table for structured e-learning content
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  module_order INTEGER NOT NULL DEFAULT 1,
  duration_minutes INTEGER DEFAULT 15,
  module_type TEXT NOT NULL DEFAULT 'lesson',
  quiz_questions JSONB DEFAULT '[]',
  resources JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modules viewable by authenticated" ON public.course_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage modules" ON public.course_modules FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));
