
-- 1. Cadre logique (Logical Framework)
CREATE TABLE public.logical_frameworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  overall_objective text,
  specific_objectives jsonb DEFAULT '[]'::jsonb,
  expected_results jsonb DEFAULT '[]'::jsonb,
  activities jsonb DEFAULT '[]'::jsonb,
  assumptions text,
  pre_conditions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- 2. Théorie du changement (Theory of Change)
CREATE TABLE public.theory_of_change (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  inputs jsonb DEFAULT '[]'::jsonb,
  activities jsonb DEFAULT '[]'::jsonb,
  outputs jsonb DEFAULT '[]'::jsonb,
  outcomes jsonb DEFAULT '[]'::jsonb,
  impact text,
  assumptions jsonb DEFAULT '[]'::jsonb,
  risks jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- 3. Indicateurs KPI du projet
CREATE TABLE public.project_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text DEFAULT 'output',
  unit text,
  baseline_value numeric DEFAULT 0,
  target_value numeric DEFAULT 0,
  current_value numeric DEFAULT 0,
  frequency text DEFAULT 'quarterly',
  data_source text,
  responsible text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Lignes budgétaires du projet
CREATE TABLE public.project_budget_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  label text NOT NULL,
  unit text,
  quantity numeric DEFAULT 1,
  unit_cost numeric DEFAULT 0,
  total_cost numeric GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  funding_source text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Ajout colonnes au projet pour le workflow de validation/candidatures
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS applications_open boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS applications_start_date date,
  ADD COLUMN IF NOT EXISTS applications_end_date date,
  ADD COLUMN IF NOT EXISTS validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS validated_by uuid;

-- RLS policies
ALTER TABLE public.logical_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theory_of_change ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budget_lines ENABLE ROW LEVEL SECURITY;

-- Viewable by authenticated
CREATE POLICY "Logical frameworks viewable" ON public.logical_frameworks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Theory of change viewable" ON public.theory_of_change FOR SELECT TO authenticated USING (true);
CREATE POLICY "Project indicators viewable" ON public.project_indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Project budget lines viewable" ON public.project_budget_lines FOR SELECT TO authenticated USING (true);

-- Admins/coordinators manage
CREATE POLICY "Admins manage logical frameworks" ON public.logical_frameworks FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Admins manage theory of change" ON public.theory_of_change FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Admins manage project indicators" ON public.project_indicators FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Admins manage project budget lines" ON public.project_budget_lines FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));

-- Project owners can manage their own project data
CREATE POLICY "Owners manage logical frameworks" ON public.logical_frameworks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = logical_frameworks.project_id AND projects.owner_id = auth.uid()));
CREATE POLICY "Owners manage theory of change" ON public.theory_of_change FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = theory_of_change.project_id AND projects.owner_id = auth.uid()));
CREATE POLICY "Owners manage project indicators" ON public.project_indicators FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_indicators.project_id AND projects.owner_id = auth.uid()));
CREATE POLICY "Owners manage project budget lines" ON public.project_budget_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_budget_lines.project_id AND projects.owner_id = auth.uid()));

-- updated_at triggers
CREATE TRIGGER update_logical_frameworks_updated_at BEFORE UPDATE ON public.logical_frameworks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_theory_of_change_updated_at BEFORE UPDATE ON public.theory_of_change FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_indicators_updated_at BEFORE UPDATE ON public.project_indicators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_budget_lines_updated_at BEFORE UPDATE ON public.project_budget_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
