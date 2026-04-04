-- Add company_id and product_id columns to phase_assigned_document_template
-- These will be nullable and without foreign key constraints
ALTER TABLE phase_assigned_document_template
ADD COLUMN IF NOT EXISTS company_id uuid,
ADD COLUMN IF NOT EXISTS product_id uuid;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_phase_assigned_document_template_company_id 
ON phase_assigned_document_template(company_id) WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_phase_assigned_document_template_product_id 
ON phase_assigned_document_template(product_id) WHERE product_id IS NOT NULL;

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_phase_assigned_document_template_company_product 
ON phase_assigned_document_template(company_id, product_id) 
WHERE company_id IS NOT NULL AND product_id IS NOT NULL;