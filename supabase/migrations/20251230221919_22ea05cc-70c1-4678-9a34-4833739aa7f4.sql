-- Add date_format column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS date_format text DEFAULT 'dd-MM-yyyy';