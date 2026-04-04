
-- Add document protection and inclusion control fields
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS is_protected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS inclusion_rules jsonb DEFAULT '{"type": "always_include"}'::jsonb,
ADD COLUMN IF NOT EXISTS market_applicability jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS class_applicability jsonb DEFAULT '[]'::jsonb;

ALTER TABLE phase_assigned_documents 
ADD COLUMN IF NOT EXISTS is_protected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS inclusion_rules jsonb DEFAULT '{"type": "always_include"}'::jsonb;

ALTER TABLE company_document_templates 
ADD COLUMN IF NOT EXISTS is_protected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS inclusion_rules jsonb DEFAULT '{"type": "always_include"}'::jsonb;

-- Update existing standard regulatory documents to be protected
UPDATE phase_assigned_documents 
SET is_protected = true,
    inclusion_rules = '{"type": "always_include"}'::jsonb
WHERE document_type IN ('Regulatory', 'Standard') 
AND name IN (
  'Design & Development Plan',
  'Risk Management Plan',
  'Clinical Evaluation Plan',
  'Technical Documentation',
  'Quality Manual',
  'Design Controls Procedure'
);

-- Create index for inclusion rules queries
CREATE INDEX IF NOT EXISTS idx_documents_inclusion_rules ON documents USING gin(inclusion_rules);
CREATE INDEX IF NOT EXISTS idx_phase_assigned_documents_inclusion_rules ON phase_assigned_documents USING gin(inclusion_rules);
