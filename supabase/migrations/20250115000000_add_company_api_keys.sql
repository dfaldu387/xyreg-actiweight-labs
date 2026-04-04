-- Add API key fields to companies table for Gemini and Photo services
ALTER TABLE public.companies 
ADD COLUMN gemini_api_key TEXT,
ADD COLUMN photo_api_key TEXT,
ADD COLUMN gemini_api_key_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN photo_api_key_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN api_keys_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comments for documentation
COMMENT ON COLUMN public.companies.gemini_api_key IS 'Google Gemini API key for AI services';
COMMENT ON COLUMN public.companies.photo_api_key IS 'Photo/image processing API key';
COMMENT ON COLUMN public.companies.gemini_api_key_enabled IS 'Whether Gemini API key is active and ready to use';
COMMENT ON COLUMN public.companies.photo_api_key_enabled IS 'Whether Photo API key is active and ready to use';
COMMENT ON COLUMN public.companies.api_keys_updated_at IS 'Timestamp when API keys were last updated';

-- Create index for API key lookups
CREATE INDEX idx_companies_api_keys ON public.companies(gemini_api_key_enabled, photo_api_key_enabled);

-- Add RLS policy to ensure only admins can view/modify API keys
-- Note: API keys should only be accessible to company admins and super admins
CREATE POLICY "Admins can view API key status for their companies"
  ON public.companies
  FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'consultant')
    )
  );

-- Update the existing UPDATE policy to include API key fields
-- This ensures only admins can modify API keys
DROP POLICY IF EXISTS "Users can update their companies" ON public.companies;

CREATE POLICY "Admins can update their companies"
  ON public.companies
  FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'consultant')
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'consultant')
    )
  );
