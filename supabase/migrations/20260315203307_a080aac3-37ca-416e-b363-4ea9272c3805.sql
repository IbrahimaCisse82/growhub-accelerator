
CREATE OR REPLACE FUNCTION public.log_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  entity_name text := '';
BEGIN
  IF TG_OP = 'DELETE' THEN
    BEGIN entity_name := OLD.name; EXCEPTION WHEN undefined_column THEN BEGIN entity_name := OLD.title; EXCEPTION WHEN undefined_column THEN entity_name := ''; END; END;
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, jsonb_build_object('name', entity_name));
  ELSE
    BEGIN entity_name := NEW.name; EXCEPTION WHEN undefined_column THEN BEGIN entity_name := NEW.title; EXCEPTION WHEN undefined_column THEN entity_name := ''; END; END;
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata)
      VALUES (auth.uid(), 'create', TG_TABLE_NAME, NEW.id, jsonb_build_object('name', entity_name));
    ELSIF TG_OP = 'UPDATE' THEN
      INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata)
      VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id, jsonb_build_object('name', entity_name));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;
