ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS country text DEFAULT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS locations text[] DEFAULT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS duration_months integer DEFAULT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;