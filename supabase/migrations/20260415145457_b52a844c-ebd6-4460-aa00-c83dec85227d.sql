
-- Add yearly breakdown columns to project_budget_lines
ALTER TABLE public.project_budget_lines
  ADD COLUMN IF NOT EXISTS year1 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS year2 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS year3 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS year4 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS year5 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS marker_gender text DEFAULT '○',
  ADD COLUMN IF NOT EXISTS marker_climate text DEFAULT '○',
  ADD COLUMN IF NOT EXISTS budget_category text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Update total_cost to be computed from yearly values via trigger
CREATE OR REPLACE FUNCTION public.compute_budget_line_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_cost := COALESCE(NEW.year1, 0) + COALESCE(NEW.year2, 0) + COALESCE(NEW.year3, 0) + COALESCE(NEW.year4, 0) + COALESCE(NEW.year5, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_compute_budget_line_total ON public.project_budget_lines;
CREATE TRIGGER trg_compute_budget_line_total
  BEFORE INSERT OR UPDATE ON public.project_budget_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_budget_line_total();
