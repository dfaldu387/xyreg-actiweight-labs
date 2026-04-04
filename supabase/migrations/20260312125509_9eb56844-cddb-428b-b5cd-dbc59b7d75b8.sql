
ALTER TABLE public.device_components
  ADD COLUMN IF NOT EXISTS is_root_level BOOLEAN NOT NULL DEFAULT true;

-- Set existing children (those in hierarchy table) to false
UPDATE public.device_components
SET is_root_level = false
WHERE id IN (SELECT DISTINCT child_id FROM public.device_component_hierarchy);
