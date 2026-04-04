-- Remove is_pre_launch column from company_phases table
ALTER TABLE public.company_phases DROP COLUMN IF EXISTS is_pre_launch;

-- Update phase_categories table to include predefined categories
-- First, let's ensure we have the standard medical device phase categories
INSERT INTO public.phase_categories (name, description, company_id) 
SELECT 'R&D', 'Research and Development activities', c.id
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'R&D' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, description, company_id) 
SELECT 'Regulatory Affairs', 'Regulatory submission and compliance activities', c.id
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Regulatory Affairs' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, description, company_id) 
SELECT 'Clinical Trials', 'Clinical studies and validation activities', c.id
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Clinical Trials' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, description, company_id) 
SELECT 'Commercial Launch', 'Product launch and go-to-market activities', c.id
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Commercial Launch' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, description, company_id) 
SELECT 'Project Management', 'Project coordination and management activities', c.id
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Project Management' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, description, company_id) 
SELECT 'Quality Oversight', 'Quality assurance and control activities', c.id
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Quality Oversight' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, description, company_id) 
SELECT 'Manufacturing', 'Production and manufacturing activities', c.id
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Manufacturing' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, description, company_id) 
SELECT 'Post-Market Surveillance', 'Post-market monitoring and surveillance activities', c.id
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Post-Market Surveillance' AND pc.company_id = c.id
);

-- Update existing phases to have category_id if they don't have one
-- Map phases without categories to 'R&D' as a default
UPDATE public.company_phases cp
SET category_id = (
  SELECT pc.id 
  FROM public.phase_categories pc 
  WHERE pc.name = 'R&D' AND pc.company_id = cp.company_id
  LIMIT 1
)
WHERE cp.category_id IS NULL;