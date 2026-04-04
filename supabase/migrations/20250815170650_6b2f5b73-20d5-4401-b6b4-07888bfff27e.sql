-- Migrate existing API keys from template_settings to company_api_keys
INSERT INTO public.company_api_keys (company_id, key_type, encrypted_key)
SELECT 
  ts.company_id,
  CASE 
    WHEN ts.setting_key = 'gemini_api_key' THEN 'gemini'
    WHEN ts.setting_key = 'openai_api_key' THEN 'openai'
    WHEN ts.setting_key = 'anthropic_api_key' THEN 'anthropic'
  END::text as key_type,
  -- Simple encryption using XOR and base64
  encode(
    convert_to(
      array_to_string(
        ARRAY(
          SELECT chr(
            ascii(substring(ts.setting_value, generate_series(1, length(ts.setting_value)), 1)) # 
            ascii(substring('medtech-api-key-2024', ((generate_series(1, length(ts.setting_value)) - 1) % length('medtech-api-key-2024')) + 1, 1))
          )
        ), 
        ''
      ),
      'UTF8'
    ),
    'base64'
  ) as encrypted_key
FROM template_settings ts
WHERE ts.setting_key IN ('gemini_api_key', 'openai_api_key', 'anthropic_api_key')
  AND ts.setting_value IS NOT NULL 
  AND ts.setting_value != ''
ON CONFLICT (company_id, key_type) DO NOTHING;