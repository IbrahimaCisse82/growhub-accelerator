-- Add missing columns to grants table
ALTER TABLE public.grants
  ADD COLUMN IF NOT EXISTS frais_structure_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contribution_propre numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS politique_change text DEFAULT NULL;

-- Add forecast columns to grant_reports table
ALTER TABLE public.grant_reports
  ADD COLUMN IF NOT EXISTS forecast_q1 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forecast_q2 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forecast_q3 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forecast_year1 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forecast_year2 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forecast_year3 numeric DEFAULT 0;