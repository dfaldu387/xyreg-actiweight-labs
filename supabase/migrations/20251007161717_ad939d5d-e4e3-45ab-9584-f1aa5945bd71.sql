-- Add token usage and last usage tracking columns to company_api_keys table
ALTER TABLE company_api_keys 
ADD COLUMN IF NOT EXISTS token_usage_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_usage_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS usage_last_synced_at timestamp with time zone;

-- Add comment to explain the token_usage_data structure
COMMENT ON COLUMN company_api_keys.token_usage_data IS 'Stores usage statistics from the API provider, structure varies by provider: {total_tokens, prompt_tokens, completion_tokens, requests_count, etc.}';
COMMENT ON COLUMN company_api_keys.last_usage_at IS 'Timestamp of the last API key usage as reported by the provider';
COMMENT ON COLUMN company_api_keys.usage_last_synced_at IS 'Timestamp when usage data was last synced from the provider';