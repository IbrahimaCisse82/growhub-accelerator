
-- Table for Sheet 2: Détail par WP (activity-level budget breakdown)
CREATE TABLE public.project_budget_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  work_package text NOT NULL,
  code text NOT NULL,
  activity text NOT NULL,
  category text,
  unit text,
  quantity numeric DEFAULT 0,
  unit_cost numeric DEFAULT 0,
  year_1 numeric DEFAULT 0,
  year_2 numeric DEFAULT 0,
  year_3 numeric DEFAULT 0,
  year_4 numeric DEFAULT 0,
  year_5 numeric DEFAULT 0,
  total numeric DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_budget_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Budget details viewable by authenticated"
ON public.project_budget_details FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins manage budget details"
ON public.project_budget_details FOR ALL TO authenticated
USING (is_admin_or_coordinator(auth.uid()));

-- Table for Sheet 4: Hypothèses & Paramètres
CREATE TABLE public.project_budget_assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  section text NOT NULL DEFAULT 'general',
  label text NOT NULL,
  value text,
  detail text,
  note text,
  numeric_value numeric,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_budget_assumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Budget assumptions viewable by authenticated"
ON public.project_budget_assumptions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins manage budget assumptions"
ON public.project_budget_assumptions FOR ALL TO authenticated
USING (is_admin_or_coordinator(auth.uid()));

-- Note: Sheet 3 (Récap par Catégorie) will be computed dynamically from project_budget_details
-- by aggregating on the 'category' field — no separate table needed.
