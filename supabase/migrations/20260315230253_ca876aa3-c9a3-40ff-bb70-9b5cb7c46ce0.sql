-- Add project_manager to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_manager';

-- Add coordinator_id to programs table
ALTER TABLE public.programs ADD COLUMN coordinator_id uuid;

-- Update is_admin_or_coordinator to also include project_manager for relevant checks
-- (project_manager should not be admin, just assignable to projects)