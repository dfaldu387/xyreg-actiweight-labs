-- Remove the duplicate ISO 14971 template with 0 requirements
DELETE FROM gap_analysis_templates 
WHERE id = 'f484828c-15d8-4252-b751-240439fb2b1b' 
AND name = 'ISO 14971 - Risk Management' 
AND framework = 'ISO_14971';

-- Also clean up any company template associations with this deleted template
DELETE FROM company_gap_templates 
WHERE template_id = 'f484828c-15d8-4252-b751-240439fb2b1b';