-- Add notified_body_id column to companies table
ALTER TABLE public.companies 
ADD COLUMN notified_body_id uuid REFERENCES public.notified_bodies(id);

-- Add comment for documentation
COMMENT ON COLUMN public.companies.notified_body_id IS 'Reference to the company''s selected notified body for regulatory compliance';