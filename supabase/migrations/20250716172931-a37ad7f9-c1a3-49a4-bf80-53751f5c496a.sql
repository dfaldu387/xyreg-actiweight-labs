-- Fix template_settings category check constraint to allow udi_configuration
ALTER TABLE public.template_settings 
DROP CONSTRAINT IF EXISTS template_settings_category_check;

-- Add new check constraint that includes udi_configuration
ALTER TABLE public.template_settings 
ADD CONSTRAINT template_settings_category_check 
CHECK (category IN ('defaults', 'udi_configuration', 'general', 'company', 'product', 'regulatory'));