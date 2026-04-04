
-- Create company_document_templates table to store all available document templates
CREATE TABLE IF NOT EXISTS company_document_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  document_type text NOT NULL DEFAULT 'Standard',
  description text,
  tech_applicability text DEFAULT 'All device types',
  markets jsonb DEFAULT '[]'::jsonb,
  classes_by_market jsonb DEFAULT '{}'::jsonb,
  is_user_removed boolean DEFAULT false, -- Track if user explicitly removed this template
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Add RLS policies
ALTER TABLE company_document_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for company_document_templates
CREATE POLICY "Users can view templates for their companies" ON company_document_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND company_id = company_document_templates.company_id
    )
  );

CREATE POLICY "Users can insert templates for their companies" ON company_document_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND company_id = company_document_templates.company_id
    )
  );

CREATE POLICY "Users can update templates for their companies" ON company_document_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND company_id = company_document_templates.company_id
    )
  );

CREATE POLICY "Users can delete templates for their companies" ON company_document_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_company_access 
      WHERE user_id = auth.uid() 
      AND company_id = company_document_templates.company_id
    )
  );

-- Migrate existing data from phase_assigned_documents to company_document_templates
INSERT INTO company_document_templates (
  company_id,
  name,
  document_type,
  tech_applicability,
  markets,
  classes_by_market,
  created_at
)
SELECT DISTINCT
  p.company_id,
  pad.name,
  COALESCE(pad.document_type, 'Standard'),
  COALESCE(pad.tech_applicability, 'All device types'),
  COALESCE(pad.markets, '[]'::jsonb),
  COALESCE(pad.classes_by_market, '{}'::jsonb),
  COALESCE(pad.created_at, now())
FROM phase_assigned_documents pad
JOIN phases p ON p.id = pad.phase_id
WHERE NOT EXISTS (
  SELECT 1 FROM company_document_templates cdt 
  WHERE cdt.company_id = p.company_id 
  AND cdt.name = pad.name
);

-- Create function to ensure document template exists before assignment
CREATE OR REPLACE FUNCTION ensure_document_template_exists()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  company_id_val uuid;
BEGIN
  -- Get company_id from phase
  SELECT p.company_id INTO company_id_val
  FROM phases p
  WHERE p.id = NEW.phase_id;
  
  -- Insert template if it doesn't exist
  INSERT INTO company_document_templates (
    company_id,
    name,
    document_type,
    tech_applicability,
    markets,
    classes_by_market
  ) VALUES (
    company_id_val,
    NEW.name,
    COALESCE(NEW.document_type, 'Standard'),
    COALESCE(NEW.tech_applicability, 'All device types'),
    COALESCE(NEW.markets, '[]'::jsonb),
    COALESCE(NEW.classes_by_market, '{}'::jsonb)
  )
  ON CONFLICT (company_id, name) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to ensure template exists when assigning to phase
CREATE TRIGGER ensure_template_exists_trigger
  BEFORE INSERT ON phase_assigned_documents
  FOR EACH ROW
  EXECUTE FUNCTION ensure_document_template_exists();
