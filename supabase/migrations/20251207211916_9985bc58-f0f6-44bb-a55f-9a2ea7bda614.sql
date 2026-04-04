-- Add phase_dates column for manual timeline date entry (free tier)
-- and timeline_auto_sync flag for paid tier
ALTER TABLE public.company_investor_share_settings
ADD COLUMN IF NOT EXISTS phase_dates JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS timeline_auto_sync BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.company_investor_share_settings.phase_dates IS 'Manual timeline dates for free tier: [{phaseId: string, startDate: string, endDate: string}]';
COMMENT ON COLUMN public.company_investor_share_settings.timeline_auto_sync IS 'When true (paid tier), syncs timeline dates from lifecycle_phases table';