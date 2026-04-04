-- Update the check constraint for company_api_keys to include serpapi and google_vertex
ALTER TABLE company_api_keys 
DROP CONSTRAINT IF EXISTS company_api_keys_key_type_check;

ALTER TABLE company_api_keys 
ADD CONSTRAINT company_api_keys_key_type_check 
CHECK (key_type IN ('gemini', 'openai', 'anthropic', 'serpapi', 'google_vertex'));