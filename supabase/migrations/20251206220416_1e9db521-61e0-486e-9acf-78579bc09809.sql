-- Add show_venture_blueprint column to company_investor_share_settings
ALTER TABLE public.company_investor_share_settings 
ADD COLUMN IF NOT EXISTS show_venture_blueprint boolean NOT NULL DEFAULT true;