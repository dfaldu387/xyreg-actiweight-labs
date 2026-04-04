-- Enable RLS on key document tables that are missing it
ALTER TABLE company_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_assigned_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_cleanup_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_recommended_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_completion_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE excluded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_document_links ENABLE ROW LEVEL SECURITY;

-- Create policies for company_document_templates
CREATE POLICY "Users can view templates for their companies" 
ON company_document_templates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_company_roles 
    WHERE user_id = auth.uid() 
    AND company_id = company_document_templates.company_id
  )
);

CREATE POLICY "Users can insert templates for their companies" 
ON company_document_templates 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_roles 
    WHERE user_id = auth.uid() 
    AND company_id = company_document_templates.company_id
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update templates for their companies" 
ON company_document_templates 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_company_roles 
    WHERE user_id = auth.uid() 
    AND company_id = company_document_templates.company_id
    AND role IN ('admin', 'editor')
  )
);

-- Create policies for phase_assigned_documents
CREATE POLICY "Users can view phase assigned documents for their companies" 
ON phase_assigned_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM phases p
    JOIN user_company_roles ucr ON p.company_id = ucr.company_id
    WHERE p.id = phase_assigned_documents.phase_id
    AND ucr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert phase assigned documents for their companies" 
ON phase_assigned_documents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM phases p
    JOIN user_company_roles ucr ON p.company_id = ucr.company_id
    WHERE p.id = phase_assigned_documents.phase_id
    AND ucr.user_id = auth.uid()
    AND ucr.role IN ('admin', 'editor')
  )
);

-- Create policies for phase_document_templates
CREATE POLICY "Users can view phase document templates for their companies" 
ON phase_document_templates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM phases p
    JOIN user_company_roles ucr ON p.company_id = ucr.company_id
    WHERE p.id = phase_document_templates.phase_id
    AND ucr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert phase document templates for their companies" 
ON phase_document_templates 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM phases p
    JOIN user_company_roles ucr ON p.company_id = ucr.company_id
    WHERE p.id = phase_document_templates.phase_id
    AND ucr.user_id = auth.uid()
    AND ucr.role IN ('admin', 'editor')
  )
);