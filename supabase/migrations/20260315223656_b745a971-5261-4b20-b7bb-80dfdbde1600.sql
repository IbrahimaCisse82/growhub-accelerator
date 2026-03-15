
-- Drop old program_id foreign key and column
ALTER TABLE public.cohorts DROP CONSTRAINT IF EXISTS cohorts_program_id_fkey;
ALTER TABLE public.cohorts DROP COLUMN IF EXISTS program_id;

-- Add project_id column with FK to projects
ALTER TABLE public.cohorts ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
