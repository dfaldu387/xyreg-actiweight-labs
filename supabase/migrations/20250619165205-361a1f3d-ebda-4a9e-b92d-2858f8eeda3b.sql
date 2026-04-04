
-- Add system category flag and update existing Design Control categories
-- Fixed version that works with actual table structure

-- Step 1: Add is_system_category column to phase_categories table
ALTER TABLE public.phase_categories 
ADD COLUMN IF NOT EXISTS is_system_category boolean DEFAULT false;

-- Step 2: Mark all existing "Detailed Design Control Steps" categories as system categories
UPDATE public.phase_categories 
SET is_system_category = true 
WHERE name = 'Detailed Design Control Steps';

-- Step 3: Mark all phases in Design Control categories as system phases
-- Only update the phases table which has the is_predefined_core_phase column
UPDATE public.phases 
SET is_predefined_core_phase = true
WHERE category_id IN (
  SELECT id FROM public.phase_categories 
  WHERE name = 'Detailed Design Control Steps'
);

-- Step 4: Create index for performance on the new column
CREATE INDEX IF NOT EXISTS idx_phase_categories_is_system 
ON public.phase_categories (is_system_category);

-- Step 5: Verify the changes with a summary query
SELECT 
  pc.name as category_name,
  pc.is_system_category,
  COUNT(p.id) as phase_count,
  COUNT(CASE WHEN p.is_predefined_core_phase THEN 1 END) as system_phase_count
FROM public.phase_categories pc
LEFT JOIN public.phases p ON pc.id = p.category_id
WHERE pc.name = 'Detailed Design Control Steps'
GROUP BY pc.id, pc.name, pc.is_system_category;
