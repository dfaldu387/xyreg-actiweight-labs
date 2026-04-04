-- Enable RLS on key document tables that are missing it (skip tables that don't exist or have issues)
ALTER TABLE company_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_cleanup_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_recommended_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_completion_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE excluded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_document_links ENABLE ROW LEVEL SECURITY;

-- Create basic policies for company_document_templates (this should solve the inheritance issue)
CREATE POLICY "Users can view templates for their companies" 
ON company_document_templates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND company_id = company_document_templates.company_id
  )
);

CREATE POLICY "Users can insert templates for their companies" 
ON company_document_templates 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND company_id = company_document_templates.company_id
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update templates for their companies" 
ON company_document_templates 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND company_id = company_document_templates.company_id
    AND access_level IN ('admin', 'editor')
  )
);