-- Add auto_grant_monitor_access column to company_investor_share_settings
ALTER TABLE public.company_investor_share_settings 
ADD COLUMN IF NOT EXISTS auto_grant_monitor_access BOOLEAN DEFAULT false;