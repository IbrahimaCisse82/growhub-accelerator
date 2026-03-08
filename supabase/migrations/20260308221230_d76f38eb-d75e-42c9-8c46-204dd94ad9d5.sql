
ALTER TABLE public.project_budget_lines
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS section text DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS allocation_pct numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS description text;
