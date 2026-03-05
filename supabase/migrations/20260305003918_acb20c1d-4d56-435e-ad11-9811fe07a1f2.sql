
-- Add is_approved column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Replace the handle_new_user trigger function
-- First user becomes super_admin + auto-approved, others get entrepreneur + not approved
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count int;
BEGIN
  SELECT count(*) INTO user_count FROM public.profiles;
  
  IF user_count = 0 THEN
    -- First user: super_admin + auto-approved
    INSERT INTO public.profiles (user_id, full_name, email, is_approved)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, true);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    -- Subsequent users: entrepreneur + pending approval
    INSERT INTO public.profiles (user_id, full_name, email, is_approved)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, false);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'entrepreneur');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
