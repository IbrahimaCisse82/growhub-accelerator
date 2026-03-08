
-- Table: Rapports financiers périodiques
CREATE TABLE public.grant_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL DEFAULT 'quarterly',
  period_label TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  amount_declared NUMERIC DEFAULT 0,
  amount_validated NUMERIC DEFAULT 0,
  amount_received NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  submitted_by UUID,
  submitted_at TIMESTAMPTZ,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grant_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Grant reports viewable by authenticated" ON public.grant_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage grant reports" ON public.grant_reports FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Users insert own reports" ON public.grant_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);

-- Table: Décaissements avec workflow
CREATE TABLE public.grant_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  tranche_number INTEGER NOT NULL DEFAULT 1,
  label TEXT NOT NULL,
  amount_requested NUMERIC NOT NULL DEFAULT 0,
  amount_approved NUMERIC DEFAULT 0,
  amount_received NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID,
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  justification TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grant_disbursements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Grant disbursements viewable by authenticated" ON public.grant_disbursements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage grant disbursements" ON public.grant_disbursements FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Users insert own disbursements" ON public.grant_disbursements FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);

-- Table: Documents contractuels
CREATE TABLE public.grant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'convention',
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grant_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Grant documents viewable by authenticated" ON public.grant_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage grant documents" ON public.grant_documents FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Users insert own documents" ON public.grant_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

-- Table: Indicateurs de performance grant
CREATE TABLE public.grant_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'output',
  unit TEXT,
  baseline_value NUMERIC DEFAULT 0,
  target_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  data_source TEXT,
  frequency TEXT DEFAULT 'quarterly',
  responsible TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grant_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Grant indicators viewable by authenticated" ON public.grant_indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage grant indicators" ON public.grant_indicators FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));

-- Table: Activités / plan de travail grant
CREATE TABLE public.grant_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsible TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned',
  priority TEXT DEFAULT 'medium',
  progress NUMERIC DEFAULT 0,
  deliverables TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grant_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Grant activities viewable by authenticated" ON public.grant_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage grant activities" ON public.grant_activities FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));

-- Storage bucket for grant documents
INSERT INTO storage.buckets (id, name, public) VALUES ('grant-documents', 'grant-documents', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Grant docs public read" ON storage.objects FOR SELECT USING (bucket_id = 'grant-documents');
CREATE POLICY "Auth users upload grant docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'grant-documents');
CREATE POLICY "Auth users delete grant docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'grant-documents');
