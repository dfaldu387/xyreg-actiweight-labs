-- Create Company Product Models table
CREATE TABLE company_product_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Create Company Platforms table  
CREATE TABLE company_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,  
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Enable RLS on both tables
ALTER TABLE company_product_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_platforms ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_product_models
CREATE POLICY "Users can view models for their companies" 
ON company_product_models FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create models for their companies" 
ON company_product_models FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update models for their companies" 
ON company_product_models FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete models for their companies" 
ON company_product_models FOR DELETE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

-- RLS policies for company_platforms
CREATE POLICY "Users can view platforms for their companies" 
ON company_platforms FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create platforms for their companies" 
ON company_platforms FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update platforms for their companies" 
ON company_platforms FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete platforms for their companies" 
ON company_platforms FOR DELETE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_company_product_models
  BEFORE UPDATE ON company_product_models
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_company_platforms
  BEFORE UPDATE ON company_platforms
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();