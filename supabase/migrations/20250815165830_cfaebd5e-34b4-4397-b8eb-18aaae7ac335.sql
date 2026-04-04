-- Create company_api_keys table for storing encrypted API keys
CREATE TABLE public.company_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL CHECK (key_type IN ('gemini', 'openai', 'anthropic')),
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, key_type)
);

-- Enable RLS
ALTER TABLE public.company_api_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view API keys for accessible companies" 
ON public.company_api_keys 
FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage API keys for their companies" 
ON public.company_api_keys 
FOR ALL 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level = 'admin'::user_role_type
))
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level = 'admin'::user_role_type
));

-- Add trigger for updated_at
CREATE TRIGGER update_company_api_keys_updated_at
  BEFORE UPDATE ON public.company_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();