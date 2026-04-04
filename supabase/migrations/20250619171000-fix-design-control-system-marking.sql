
-- Fix Design Control category system marking
-- This migration correctly identifies "Design Control" categories and marks them as system

-- Step 1: Mark "Design Control" categories as system categories
UPDATE public.phase_categories 
SET is_system_category = true 
WHERE name ILIKE '%design control%'
  OR name = 'Design Control'
  OR name = 'Detailed Design Control Steps';

-- Step 2: Mark all phases in Design Control categories as system phases
UPDATE public.phases 
SET is_predefined_core_phase = true,
    is_custom = false
WHERE category_id IN (
  SELECT id FROM public.phase_categories 
  WHERE is_system_category = true
  AND (name ILIKE '%design control%' OR name = 'Design Control' OR name = 'Detailed Design Control Steps')
);

-- Step 3: Verify the changes with a summary query
SELECT 
  pc.name as category_name,
  pc.is_system_category,
  COUNT(p.id) as phase_count,
  COUNT(CASE WHEN p.is_predefined_core_phase THEN 1 END) as system_phase_count
FROM public.phase_categories pc
LEFT JOIN public.phases p ON pc.id = p.category_id
WHERE pc.name ILIKE '%design control%' 
  OR pc.name = 'Design Control'
  OR pc.name = 'Detailed Design Control Steps'
GROUP BY pc.id, pc.name, pc.is_system_category
ORDER BY pc.name;
