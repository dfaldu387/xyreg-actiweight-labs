-- Create user_needs table
CREATE TABLE public.user_needs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_need_id TEXT NOT NULL,
  description TEXT NOT NULL,
  linked_requirements TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Not Met' CHECK (status IN ('Met', 'Not Met')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_user_needs_product_id ON public.user_needs(product_id);
CREATE INDEX idx_user_needs_company_id ON public.user_needs(company_id);

-- Create unique index for user_need_id per product
CREATE UNIQUE INDEX idx_user_needs_unique_id_per_product ON public.user_needs(product_id, user_need_id);

-- Enable Row Level Security
ALTER TABLE public.user_needs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view user needs for accessible companies" 
ON public.user_needs 
FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create user needs for accessible companies" 
ON public.user_needs 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update user needs for accessible companies" 
ON public.user_needs 
FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete user needs for accessible companies" 
ON public.user_needs 
FOR DELETE 
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

-- Create trigger for updated_at
CREATE TRIGGER update_user_needs_updated_at
  BEFORE UPDATE ON public.user_needs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();