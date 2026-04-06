-- Add app_url column to companies table
-- This stores the custom deployment URL for each company.
-- When set, invitation emails will use this URL instead of the current origin.
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS app_url text NULL;

COMMENT ON COLUMN public.companies.app_url IS 'Custom deployment URL for this company (e.g. https://act9k2.vercel.app). Used for invitation links.';
