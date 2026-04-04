-- Remove the ISO 13485 template with 63 requirements
-- First delete all template items for this template
DELETE FROM gap_template_items 
WHERE template_id = '9147d3ba-ea2d-4147-b684-8f03df4ebc26';

-- Then delete the template itself
DELETE FROM gap_analysis_templates 
WHERE id = '9147d3ba-ea2d-4147-b684-8f03df4ebc26';