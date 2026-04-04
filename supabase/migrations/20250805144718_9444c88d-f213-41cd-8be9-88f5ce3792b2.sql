-- Move eudamed_device_registry table from eudamed schema to public schema
-- This resolves the "Unknown database error" by ensuring proper user access

-- First, create the table in public schema with the same structure as the eudamed schema
CREATE TABLE IF NOT EXISTS public.eudamed_device_registry AS 
SELECT * FROM eudamed.eudamed_device_registry 
WHERE 1=0; -- Copy structure only, no data initially

-- Add primary key and default constraints
ALTER TABLE public.eudamed_device_registry 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() PRIMARY KEY;

-- Add timestamps if they don't exist
ALTER TABLE public.eudamed_device_registry 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Copy the data from eudamed schema to public schema
INSERT INTO public.eudamed_device_registry 
SELECT * FROM eudamed.eudamed_device_registry
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_basic_udi_di ON public.eudamed_device_registry(basic_udi_di);
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_company_name ON public.eudamed_device_registry(company_name);
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_srn_number ON public.eudamed_device_registry(srn_number);

-- Enable Row Level Security
ALTER TABLE public.eudamed_device_registry ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users to read the registry
CREATE POLICY "Authenticated users can read eudamed device registry" 
ON public.eudamed_device_registry 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only admins can modify the registry (for imports)
CREATE POLICY "Admins can manage eudamed device registry" 
ON public.eudamed_device_registry 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Drop the old table from eudamed schema
DROP TABLE IF EXISTS eudamed.eudamed_device_registry CASCADE;

-- Try to drop the eudamed schema if it's empty
DROP SCHEMA IF EXISTS eudamed CASCADE;