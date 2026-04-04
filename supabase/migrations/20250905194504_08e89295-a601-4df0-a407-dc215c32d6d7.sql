-- Create RLS policies for company_phases table
CREATE POLICY "Users can view company phases for accessible companies" 
ON public.company_phases 
FOR SELECT 
USING (company_id IN (
  SELECT company_id 
  FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create company phases for accessible companies" 
ON public.company_phases 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id 
  FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update company phases for accessible companies" 
ON public.company_phases 
FOR UPDATE 
USING (company_id IN (
  SELECT company_id 
  FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete company phases for accessible companies" 
ON public.company_phases 
FOR DELETE 
USING (company_id IN (
  SELECT company_id 
  FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));