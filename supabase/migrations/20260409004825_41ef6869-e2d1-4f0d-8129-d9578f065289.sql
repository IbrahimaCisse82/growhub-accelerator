
ALTER TABLE public.grants ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX idx_grants_project_id ON public.grants(project_id);
