
-- Table for grant transactions (real expenses)
CREATE TABLE public.grant_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  budget_code text,
  label text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  category text,
  vendor text,
  reference text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grant_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Grant transactions viewable by authenticated"
  ON public.grant_transactions FOR SELECT
  USING (true);

CREATE POLICY "Admins manage grant transactions"
  ON public.grant_transactions FOR ALL
  USING (is_admin_or_coordinator(auth.uid()));

CREATE POLICY "Users insert own transactions"
  ON public.grant_transactions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Updated_at trigger
CREATE TRIGGER trg_grant_transactions_updated
  BEFORE UPDATE ON public.grant_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Storage RLS for receipts
CREATE POLICY "Authenticated users upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Public read receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Admins delete receipts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts' AND is_admin_or_coordinator(auth.uid()));
