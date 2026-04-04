-- Remove is_pre_launch column from company_phases table
ALTER TABLE public.company_phases DROP COLUMN IF EXISTS is_pre_launch;

-- Update phase_categories table to include predefined categories
-- Insert standard medical device phase categories
INSERT INTO public.phase_categories (name, company_id, is_system_category) 
SELECT 'R&D', c.id, true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'R&D' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, company_id, is_system_category) 
SELECT 'Regulatory Affairs', c.id, true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Regulatory Affairs' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, company_id, is_system_category) 
SELECT 'Clinical Trials', c.id, true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Clinical Trials' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, company_id, is_system_category) 
SELECT 'Commercial Launch', c.id, true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Commercial Launch' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, company_id, is_system_category) 
SELECT 'Project Management', c.id, true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Project Management' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, company_id, is_system_category) 
SELECT 'Quality Oversight', c.id, true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Quality Oversight' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, company_id, is_system_category) 
SELECT 'Manufacturing', c.id, true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.phase_categories pc 
  WHERE pc.name = 'Manufacturing' AND pc.company_id = c.id
);

INSERT INTO public.phase_categories (name, company_id, is_system_category) 
SELECT 'Post-Market Surveillance', c.id, true
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