-- Check if RLS is enabled and create policies for template_settings
ALTER TABLE public.template_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view template settings for their companies" ON public.template_settings;
DROP POLICY IF EXISTS "Users can create template settings for their companies" ON public.template_settings;
DROP POLICY IF EXISTS "Users can update template settings for their companies" ON public.template_settings;
DROP POLICY IF EXISTS "Users can delete template settings for their companies" ON public.template_settings;

-- Create policies for template_settings
CREATE POLICY "Users can view template settings for their companies" 
ON public.template_settings 
FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create template settings for their companies" 
ON public.template_settings 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update template settings for their companies" 
ON public.template_settings 
FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete template settings for their companies" 
ON public.template_settings 
FOR DELETE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));