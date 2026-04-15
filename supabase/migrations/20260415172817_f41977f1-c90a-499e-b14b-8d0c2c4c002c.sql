
-- Add impact and probability to risks for the visual matrix
ALTER TABLE public.risks ADD COLUMN IF NOT EXISTS impact integer DEFAULT 3;
ALTER TABLE public.risks ADD COLUMN IF NOT EXISTS probability integer DEFAULT 3;

-- Add approval workflow to grant_transactions
ALTER TABLE public.grant_transactions ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.grant_transactions ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE public.grant_transactions ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
