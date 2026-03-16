
-- Create entity_documents table (polymorphic: project, program, startup)
CREATE TABLE public.entity_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'project', 'program', 'startup'
  entity_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'autre',
  file_url text,
  file_name text,
  file_size integer,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_entity_documents_lookup ON public.entity_documents (entity_type, entity_id);

-- RLS
ALTER TABLE public.entity_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entity documents viewable by authenticated"
  ON public.entity_documents FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage entity documents"
  ON public.entity_documents FOR ALL TO authenticated
  USING (is_admin_or_coordinator(auth.uid()));

CREATE POLICY "Users insert own documents"
  ON public.entity_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users delete own documents"
  ON public.entity_documents FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by);

-- Updated at trigger
CREATE TRIGGER update_entity_documents_updated_at
  BEFORE UPDATE ON public.entity_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage buckets for entity documents
INSERT INTO storage.buckets (id, name, public) VALUES ('entity-documents', 'entity-documents', true);

-- Storage policies
CREATE POLICY "Authenticated users upload entity docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'entity-documents');

CREATE POLICY "Anyone can view entity docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'entity-documents');

CREATE POLICY "Users delete own entity docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'entity-documents');
