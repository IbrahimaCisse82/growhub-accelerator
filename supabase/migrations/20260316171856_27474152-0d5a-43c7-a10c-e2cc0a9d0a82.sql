
-- 1. Startup KPIs table
CREATE TABLE public.startup_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  period TEXT NOT NULL DEFAULT 'monthly',
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.startup_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "KPIs viewable by authenticated" ON public.startup_kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage KPIs" ON public.startup_kpis FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Founders manage own KPIs" ON public.startup_kpis FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.startups WHERE startups.id = startup_kpis.startup_id AND startups.founder_id = auth.uid())
);

-- 2. Partners / Investors table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'investor',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  description TEXT,
  country TEXT,
  sector TEXT,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners viewable by authenticated" ON public.partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage partners" ON public.partners FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));

-- 3. Surveys table
CREATE TABLE public.surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  survey_type TEXT NOT NULL DEFAULT 'feedback',
  target_type TEXT,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Surveys viewable by authenticated" ON public.surveys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage surveys" ON public.surveys FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));

-- 4. Survey responses table
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  respondent_id UUID NOT NULL,
  rating INTEGER,
  feedback TEXT,
  answers JSONB DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all responses" ON public.survey_responses FOR SELECT TO authenticated USING (is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Users view own responses" ON public.survey_responses FOR SELECT TO authenticated USING (auth.uid() = respondent_id);
CREATE POLICY "Users submit responses" ON public.survey_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = respondent_id);

-- 5. Add alumni fields to startups
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS is_alumni BOOLEAN DEFAULT false;
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS alumni_date DATE;
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS alumni_notes TEXT;

-- Activity log triggers for new tables
CREATE TRIGGER log_startup_kpis_activity AFTER INSERT OR UPDATE OR DELETE ON public.startup_kpis FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_partners_activity AFTER INSERT OR UPDATE OR DELETE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_surveys_activity AFTER INSERT OR UPDATE OR DELETE ON public.surveys FOR EACH ROW EXECUTE FUNCTION public.log_activity();
