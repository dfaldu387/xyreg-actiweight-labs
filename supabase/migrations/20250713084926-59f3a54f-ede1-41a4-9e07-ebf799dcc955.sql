-- Update template scopes to align with the TypeScript definitions
-- 'regulatory' scope should become 'company' since regulatory requirements are typically company-wide

UPDATE gap_analysis_templates 
SET scope = 'company' 
WHERE scope = 'regulatory';

-- Verify the update
SELECT id, name, framework, scope, description FROM gap_analysis_templates WHERE is_active = true ORDER BY name;