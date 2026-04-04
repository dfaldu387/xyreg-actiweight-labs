-- Create template_settings table for UDI configuration and other template settings
CREATE TABLE IF NOT EXISTS public.template_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'string',
  category TEXT NOT NULL DEFAULT 'defaults',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique settings per company
  UNIQUE(company_id, setting_key)
);

-- Add foreign key constraint to companies table
ALTER TABLE public.template_settings 
ADD CONSTRAINT template_settings_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.template_settings ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_template_settings_updated_at
BEFORE UPDATE ON public.template_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_template_settings_company_id ON public.template_settings(company_id);
CREATE INDEX idx_template_settings_category ON public.template_settings(category);