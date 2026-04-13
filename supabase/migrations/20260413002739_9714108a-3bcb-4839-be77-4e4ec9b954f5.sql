ALTER TABLE public.grants
  ADD COLUMN IF NOT EXISTS pays text,
  ADD COLUMN IF NOT EXISTS taux_change numeric DEFAULT 655.957,
  ADD COLUMN IF NOT EXISTS periodicite text DEFAULT 'Trimestrielle',
  ADD COLUMN IF NOT EXISTS org_type text,
  ADD COLUMN IF NOT EXISTS convention text,
  ADD COLUMN IF NOT EXISTS risk_score numeric,
  ADD COLUMN IF NOT EXISTS prepared_by text,
  ADD COLUMN IF NOT EXISTS submit_date text,
  ADD COLUMN IF NOT EXISTS version text;