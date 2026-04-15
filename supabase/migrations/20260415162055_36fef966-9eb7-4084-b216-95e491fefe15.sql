
-- Drop the broken trigger
DROP TRIGGER IF EXISTS trg_sync_program_stats_budget ON public.project_budget_lines;

-- Create a fixed version specific to budget lines
CREATE OR REPLACE FUNCTION public.update_program_stats_from_budget_lines()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _project_id uuid;
  _program_id uuid;
  _count int;
  _budget numeric;
BEGIN
  _project_id := COALESCE(NEW.project_id, OLD.project_id);
  IF _project_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT program_id INTO _program_id FROM public.projects WHERE id = _project_id;
  IF _program_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT COUNT(*) INTO _count FROM public.projects WHERE program_id = _program_id;
  SELECT COALESCE(SUM(total_cost), 0) INTO _budget
  FROM public.project_budget_lines pbl
  JOIN public.projects p ON p.id = pbl.project_id
  WHERE p.program_id = _program_id;

  UPDATE public.programs SET project_count = _count, total_budget = _budget WHERE id = _program_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_program_stats_budget
AFTER INSERT OR UPDATE OR DELETE ON public.project_budget_lines
FOR EACH ROW EXECUTE FUNCTION public.update_program_stats_from_budget_lines();
