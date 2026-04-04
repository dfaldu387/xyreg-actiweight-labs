
-- Fix Design Control category system marking - Updated to handle existing phases
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

-- Step 3: Also mark phases by name pattern as system phases (for phases that might not be in the right category yet)
UPDATE public.phases 
SET is_predefined_core_phase = true,
    is_custom = false
WHERE name ILIKE '%(3) Design Input%'
   OR name ILIKE '%(4) Design Output%'
   OR name ILIKE '%(5) Verification%'
   OR name ILIKE '%(6) Validation%'
   OR name ILIKE '%(7) Design Transfer%'
   OR name ILIKE '%(8) Design Change Control%'
   OR name ILIKE '%(9) Risk Management%'
   OR name ILIKE '%(11) Technical Documentation%'
   OR name ILIKE '%(12) Clinical Evaluation%'
   OR name ILIKE '%(14) Design Review%'
   OR name ILIKE '%(15) Design History File%';

-- Step 4: Verify the changes with a summary query
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
