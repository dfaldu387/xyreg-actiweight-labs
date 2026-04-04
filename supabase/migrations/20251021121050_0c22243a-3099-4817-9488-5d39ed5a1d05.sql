-- Create permission_categories table
CREATE TABLE IF NOT EXISTS permission_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_key TEXT NOT NULL,
  category_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#6366f1',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, category_key)
);

-- Add index for faster lookups
CREATE INDEX idx_permission_categories_company ON permission_categories(company_id);

-- Enable RLS
ALTER TABLE permission_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view categories for their company"
  ON permission_categories FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage categories"
  ON permission_categories FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND access_level IN ('admin', 'business')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_permission_categories_updated_at
  BEFORE UPDATE ON permission_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();