-- Add Single Registration Number (SRN) field to companies table
ALTER TABLE public.companies 
ADD COLUMN srn text;