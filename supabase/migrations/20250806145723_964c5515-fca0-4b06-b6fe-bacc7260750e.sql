-- Create company_device_categories table
CREATE TABLE public.company_device_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.company_device_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view device categories for their companies" 
ON public.company_device_categories 
FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create device categories for their companies" 
ON public.company_device_categories 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update device categories for their companies" 
ON public.company_device_categories 
FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete device categories for their companies" 
ON public.company_device_categories 
FOR DELETE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_device_categories_updated_at
  BEFORE UPDATE ON public.company_device_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();