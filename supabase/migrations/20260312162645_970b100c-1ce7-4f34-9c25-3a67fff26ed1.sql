-- Drop existing check constraint and recreate with quality_manual included
ALTER TABLE public.template_settings 
DROP CONSTRAINT IF EXISTS template_settings_category_check;

ALTER TABLE public.template_settings 
ADD CONSTRAINT template_settings_category_check 
CHECK (category IN ('defaults', 'udi_configuration', 'general', 'company', 'product', 'regulatory', 'quality_manual', 'digital_templates', 'document_numbering', 'notifications', 'workflows', 'rules', 'integrations'));