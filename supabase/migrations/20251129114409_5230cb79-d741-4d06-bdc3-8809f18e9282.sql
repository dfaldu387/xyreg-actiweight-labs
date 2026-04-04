-- Create company_investor_share_settings table
CREATE TABLE company_investor_share_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  public_slug TEXT UNIQUE,
  access_code_hash TEXT,
  expires_at TIMESTAMPTZ,
  
  -- Visibility Settings
  show_viability_score BOOLEAN DEFAULT true,
  show_technical_specs BOOLEAN DEFAULT true,
  show_media_gallery BOOLEAN DEFAULT true,
  show_business_canvas BOOLEAN DEFAULT true,
  show_roadmap BOOLEAN DEFAULT true,
  show_team_profile BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_company_share_settings UNIQUE(company_id)
);

-- Create index on public_slug for fast lookups
CREATE INDEX idx_investor_share_settings_slug ON company_investor_share_settings(public_slug);

-- Enable RLS
ALTER TABLE company_investor_share_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Company members can view own share settings
CREATE POLICY "Company members can view own share settings"
  ON company_investor_share_settings FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
    )
  );

-- Policy: Company admins can manage share settings
CREATE POLICY "Company admins can insert share settings"
  ON company_investor_share_settings FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Company admins can update share settings"
  ON company_investor_share_settings FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
    )
  );

CREATE POLICY "Company admins can delete share settings"
  ON company_investor_share_settings FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
    )
  );

-- Policy: Public can view active share settings (for investor view page)
CREATE POLICY "Public can view active share settings by slug"
  ON company_investor_share_settings FOR SELECT
  USING (is_active = true AND public_slug IS NOT NULL);