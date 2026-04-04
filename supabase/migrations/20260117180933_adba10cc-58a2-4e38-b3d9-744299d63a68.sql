-- Add TRL (Technology Readiness Level) column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS trl_level integer CHECK (trl_level IS NULL OR (trl_level >= 3 AND trl_level <= 8));

-- Add TRL notes for optional context
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS trl_notes text;

-- Add comment explaining the column
COMMENT ON COLUMN public.products.trl_level IS 'MedTech Technology Readiness Level (3-8): 3=Proof of Concept, 4=Lab Validation, 5=Technology Validation, 6=Clinical Pilot, 7=Clinical Pivotal, 8=Market Ready';