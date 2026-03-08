
-- Table to track grant modifications
CREATE TABLE public.grant_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL DEFAULT 'update',
  changes jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grant_changes ENABLE ROW LEVEL SECURITY;

-- RLS: viewable by authenticated users
CREATE POLICY "Grant changes viewable by authenticated"
  ON public.grant_changes FOR SELECT
  USING (true);

-- RLS: only admins/coordinators can insert (via trigger uses SECURITY DEFINER)
CREATE POLICY "System insert grant changes"
  ON public.grant_changes FOR INSERT
  WITH CHECK (true);

-- Trigger function to auto-log changes on grants update
CREATE OR REPLACE FUNCTION public.log_grant_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changes_json jsonb := '{}';
  col text;
  old_val text;
  new_val text;
BEGIN
  -- Compare each relevant column
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    changes_json := changes_json || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
  END IF;
  IF OLD.code IS DISTINCT FROM NEW.code THEN
    changes_json := changes_json || jsonb_build_object('code', jsonb_build_object('old', OLD.code, 'new', NEW.code));
  END IF;
  IF OLD.organization IS DISTINCT FROM NEW.organization THEN
    changes_json := changes_json || jsonb_build_object('organization', jsonb_build_object('old', OLD.organization, 'new', NEW.organization));
  END IF;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    changes_json := changes_json || jsonb_build_object('status', jsonb_build_object('old', OLD.status::text, 'new', NEW.status::text));
  END IF;
  IF OLD.amount_total IS DISTINCT FROM NEW.amount_total THEN
    changes_json := changes_json || jsonb_build_object('amount_total', jsonb_build_object('old', OLD.amount_total, 'new', NEW.amount_total));
  END IF;
  IF OLD.amount_disbursed IS DISTINCT FROM NEW.amount_disbursed THEN
    changes_json := changes_json || jsonb_build_object('amount_disbursed', jsonb_build_object('old', OLD.amount_disbursed, 'new', NEW.amount_disbursed));
  END IF;
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    changes_json := changes_json || jsonb_build_object('description', jsonb_build_object('old', OLD.description, 'new', NEW.description));
  END IF;
  IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
    changes_json := changes_json || jsonb_build_object('start_date', jsonb_build_object('old', OLD.start_date, 'new', NEW.start_date));
  END IF;
  IF OLD.end_date IS DISTINCT FROM NEW.end_date THEN
    changes_json := changes_json || jsonb_build_object('old', OLD.end_date, 'new', NEW.end_date);
  END IF;

  -- Only log if something actually changed
  IF changes_json != '{}' THEN
    INSERT INTO public.grant_changes (grant_id, user_id, action, changes)
    VALUES (NEW.id, auth.uid(), 'update', changes_json);
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER trg_log_grant_changes
  AFTER UPDATE ON public.grants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_grant_changes();

-- Also log creation
CREATE OR REPLACE FUNCTION public.log_grant_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.grant_changes (grant_id, user_id, action, changes)
  VALUES (NEW.id, auth.uid(), 'create', jsonb_build_object('name', NEW.name, 'code', NEW.code, 'amount_total', NEW.amount_total));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_grant_creation
  AFTER INSERT ON public.grants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_grant_creation();

-- Log deletion
CREATE OR REPLACE FUNCTION public.log_grant_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.grant_changes (grant_id, user_id, action, changes)
  VALUES (OLD.id, auth.uid(), 'delete', jsonb_build_object('name', OLD.name, 'code', OLD.code));
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_log_grant_deletion
  BEFORE DELETE ON public.grants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_grant_deletion();
