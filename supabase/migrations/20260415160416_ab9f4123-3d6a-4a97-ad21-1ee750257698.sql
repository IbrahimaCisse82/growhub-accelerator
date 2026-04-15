
-- 1. Auto-update grants.amount_disbursed from grant_transactions
CREATE OR REPLACE FUNCTION public.update_grant_amount_disbursed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grant_id uuid;
  _total numeric;
BEGIN
  _grant_id := COALESCE(NEW.grant_id, OLD.grant_id);
  SELECT COALESCE(SUM(amount), 0) INTO _total
  FROM public.grant_transactions
  WHERE grant_id = _grant_id;
  UPDATE public.grants SET amount_disbursed = _total WHERE id = _grant_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_grant_disbursed
AFTER INSERT OR UPDATE OR DELETE ON public.grant_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_grant_amount_disbursed();

-- 2. Auto-update project progress from milestones
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress numeric DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_project_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_id uuid;
  _total int;
  _done int;
BEGIN
  _project_id := COALESCE(NEW.project_id, OLD.project_id);
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO _total, _done
  FROM public.milestones
  WHERE project_id = _project_id;
  
  IF _total > 0 THEN
    UPDATE public.projects SET progress = ROUND((_done::numeric / _total) * 100, 1) WHERE id = _project_id;
  ELSE
    UPDATE public.projects SET progress = 0 WHERE id = _project_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_project_progress
AFTER INSERT OR UPDATE OR DELETE ON public.milestones
FOR EACH ROW EXECUTE FUNCTION public.update_project_progress();

-- 3. Auto-count startups in cohort
ALTER TABLE public.cohorts ADD COLUMN IF NOT EXISTS current_startups integer DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_cohort_startup_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cohort_id uuid;
  _count int;
BEGIN
  _cohort_id := COALESCE(NEW.cohort_id, OLD.cohort_id);
  IF _cohort_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  SELECT COUNT(*) INTO _count FROM public.startups WHERE cohort_id = _cohort_id;
  UPDATE public.cohorts SET current_startups = _count WHERE id = _cohort_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_cohort_startups
AFTER INSERT OR UPDATE OR DELETE ON public.startups
FOR EACH ROW EXECUTE FUNCTION public.update_cohort_startup_count();

-- 4. Auto-aggregate program stats (project count + total budget)
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS project_count integer DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS total_budget numeric DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_program_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _program_id uuid;
  _count int;
  _budget numeric;
BEGIN
  _program_id := COALESCE(NEW.program_id, OLD.program_id);
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

CREATE TRIGGER trg_sync_program_stats_projects
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_program_stats();

CREATE TRIGGER trg_sync_program_stats_budget
AFTER INSERT OR UPDATE OR DELETE ON public.project_budget_lines
FOR EACH ROW EXECUTE FUNCTION public.update_program_stats();
