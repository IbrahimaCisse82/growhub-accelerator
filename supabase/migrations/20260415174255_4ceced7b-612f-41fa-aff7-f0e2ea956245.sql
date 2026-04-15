
-- Tables already created by partial migrations: sub_tasks, milestone_dependencies, message_reactions
-- Just add remaining columns

-- Add is_pinned to channel_messages (may already exist)
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Add archiving fields to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS closure_notes TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- Add tags to resources
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add depends_on to milestones
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS depends_on UUID REFERENCES public.milestones(id);

-- Enable realtime on reactions (ignore if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;
END $$;
