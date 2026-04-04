-- Add scope column to company_document_templates table
ALTER TABLE public.company_document_templates 
ADD COLUMN scope TEXT DEFAULT 'company' CHECK (scope IN ('company', 'product'));