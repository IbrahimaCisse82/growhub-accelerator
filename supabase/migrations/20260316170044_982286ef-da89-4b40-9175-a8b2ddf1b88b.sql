
-- 1. Create grant_addendums table for budget amendment requests
CREATE TABLE public.grant_addendums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  num integer NOT NULL DEFAULT 1,
  date date,
  motif text,
  justification text,
  status text NOT NULL DEFAULT 'brouillon',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create grant_addendum_lines table for per-line budget deltas
CREATE TABLE public.grant_addendum_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  addendum_id uuid NOT NULL REFERENCES public.grant_addendums(id) ON DELETE CASCADE,
  budget_line_code text NOT NULL,
  delta_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Add exchange rate columns to grant_transactions
ALTER TABLE public.grant_transactions
  ADD COLUMN IF NOT EXISTS exchange_rate numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS amount_local numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS report_id uuid REFERENCES public.grant_reports(id) ON DELETE SET NULL;

-- 4. Enable RLS on new tables
ALTER TABLE public.grant_addendums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grant_addendum_lines ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for grant_addendums
CREATE POLICY "Admins manage grant addendums" ON public.grant_addendums FOR ALL TO authenticated
  USING (is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Grant addendums viewable by authenticated" ON public.grant_addendums FOR SELECT TO authenticated
  USING (true);

-- 6. RLS policies for grant_addendum_lines
CREATE POLICY "Admins manage addendum lines" ON public.grant_addendum_lines FOR ALL TO authenticated
  USING (is_admin_or_coordinator(auth.uid()));
CREATE POLICY "Addendum lines viewable by authenticated" ON public.grant_addendum_lines FOR SELECT TO authenticated
  USING (true);

-- 7. Updated_at trigger for addendums
CREATE TRIGGER update_grant_addendums_updated_at BEFORE UPDATE ON public.grant_addendums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Enable realtime for addendums
ALTER PUBLICATION supabase_realtime ADD TABLE public.grant_addendums;
