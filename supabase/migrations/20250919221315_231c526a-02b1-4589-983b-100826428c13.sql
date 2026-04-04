-- Add department_structure column to companies table
ALTER TABLE public.companies 
ADD COLUMN department_structure jsonb DEFAULT '[]'::jsonb;