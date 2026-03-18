
-- ==========================================
-- 1. APPLICATION ROUNDS (funnel de sélection multi-rounds)
-- ==========================================
CREATE TABLE public.application_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  round_number int NOT NULL DEFAULT 1,
  name text NOT NULL,
  description text,
  round_type text NOT NULL DEFAULT 'evaluation', -- evaluation, interview, committee
  is_active boolean DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.application_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read rounds" ON public.application_rounds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage rounds" ON public.application_rounds FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid()));

-- ==========================================
-- 2. EVALUATION CRITERIA (scoring sheets)
-- ==========================================
CREATE TABLE public.evaluation_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES public.application_rounds(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  max_score int NOT NULL DEFAULT 10,
  weight numeric(5,2) DEFAULT 1.0,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read criteria" ON public.evaluation_criteria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage criteria" ON public.evaluation_criteria FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid()));

-- ==========================================
-- 3. APPLICATION EVALUATIONS (judge scoring)
-- ==========================================
CREATE TABLE public.application_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  round_id uuid REFERENCES public.application_rounds(id) ON DELETE CASCADE NOT NULL,
  evaluator_id uuid NOT NULL,
  scores jsonb DEFAULT '{}', -- {criterion_id: score}
  notes text,
  recommendation text, -- advance, reject, hold
  total_score numeric(8,2),
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(application_id, round_id, evaluator_id)
);

ALTER TABLE public.application_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own evaluations" ON public.application_evaluations FOR SELECT TO authenticated USING (evaluator_id = auth.uid() OR public.is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Users can create own evaluations" ON public.application_evaluations FOR INSERT TO authenticated WITH CHECK (evaluator_id = auth.uid());
CREATE POLICY "Users can update own evaluations" ON public.application_evaluations FOR UPDATE TO authenticated USING (evaluator_id = auth.uid());
CREATE POLICY "Admins can manage all evaluations" ON public.application_evaluations FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid()));

-- ==========================================
-- 4. ROUND JUDGES (assignation de juges)
-- ==========================================
CREATE TABLE public.round_judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES public.application_rounds(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(round_id, user_id)
);

ALTER TABLE public.round_judges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read judges" ON public.round_judges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage judges" ON public.round_judges FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid()));

-- ==========================================
-- 5. COACHING NOTES & TASKS
-- ==========================================
CREATE TABLE public.coaching_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.coaching_sessions(id) ON DELETE CASCADE NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.coaching_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Session participants can read notes" ON public.coaching_notes FOR SELECT TO authenticated USING (author_id = auth.uid() OR public.is_admin_or_coordinator(auth.uid()) OR NOT is_private);
CREATE POLICY "Authors can manage own notes" ON public.coaching_notes FOR ALL TO authenticated USING (author_id = auth.uid() OR public.is_admin_or_coordinator(auth.uid()));

CREATE TABLE public.coaching_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.coaching_sessions(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  assignee_id uuid,
  due_date timestamptz,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.coaching_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read coaching tasks" ON public.coaching_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators and admins can manage" ON public.coaching_tasks FOR ALL TO authenticated USING (created_by = auth.uid() OR assignee_id = auth.uid() OR public.is_admin_or_coordinator(auth.uid()));

-- ==========================================
-- 6. DATA COLLECTION FORMS (collecte automatique startup data)
-- ==========================================
CREATE TABLE public.data_collection_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  target_stages text[] DEFAULT '{}', -- which stages this form applies to
  frequency text DEFAULT 'monthly', -- monthly, quarterly, one_time
  fields jsonb NOT NULL DEFAULT '[]', -- array of {id, label, type, required, options, conditional}
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.data_collection_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read forms" ON public.data_collection_forms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage forms" ON public.data_collection_forms FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid()));

CREATE TABLE public.data_collection_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.data_collection_forms(id) ON DELETE CASCADE NOT NULL,
  startup_id uuid REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  respondent_id uuid NOT NULL,
  responses jsonb NOT NULL DEFAULT '{}', -- {field_id: value}
  period text, -- e.g. "2026-03" for monthly
  status text DEFAULT 'draft', -- draft, submitted
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.data_collection_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Respondents and admins can read" ON public.data_collection_responses FOR SELECT TO authenticated USING (respondent_id = auth.uid() OR public.is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Respondents can create" ON public.data_collection_responses FOR INSERT TO authenticated WITH CHECK (respondent_id = auth.uid());
CREATE POLICY "Respondents can update own" ON public.data_collection_responses FOR UPDATE TO authenticated USING (respondent_id = auth.uid() AND status = 'draft');
CREATE POLICY "Admins full access" ON public.data_collection_responses FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid()));

-- ==========================================
-- 7. EVENT REGISTRATIONS enhancement (already exists, add attendance tracking)
-- ==========================================
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS attended boolean DEFAULT false;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

-- ==========================================
-- 8. ZAPIER WEBHOOKS config table
-- ==========================================
CREATE TABLE public.webhook_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  event_type text NOT NULL, -- application_submitted, application_status_changed, session_completed, etc.
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage webhooks" ON public.webhook_configs FOR ALL TO authenticated USING (public.is_admin_or_coordinator(auth.uid()));

-- Add current_round to applications
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS current_round_id uuid REFERENCES public.application_rounds(id);

-- Triggers for updated_at
CREATE TRIGGER update_application_rounds_ts BEFORE UPDATE ON public.application_rounds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_application_evaluations_ts BEFORE UPDATE ON public.application_evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coaching_notes_ts BEFORE UPDATE ON public.coaching_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coaching_tasks_ts BEFORE UPDATE ON public.coaching_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_collection_forms_ts BEFORE UPDATE ON public.data_collection_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_collection_responses_ts BEFORE UPDATE ON public.data_collection_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhook_configs_ts BEFORE UPDATE ON public.webhook_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
