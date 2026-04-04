-- Enable RLS on phases table and create policies
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for phases table
CREATE POLICY "Users can view phases for accessible companies" 
ON public.phases 
FOR SELECT 
USING (company_id IN (
  SELECT company_id 
  FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create phases for accessible companies" 
ON public.phases 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id 
  FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update phases for accessible companies" 
ON public.phases 
FOR UPDATE 
USING (company_id IN (
  SELECT company_id 
  FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete phases for accessible companies" 
ON public.phases 
FOR DELETE 
USING (company_id IN (
  SELECT company_id 
  FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));