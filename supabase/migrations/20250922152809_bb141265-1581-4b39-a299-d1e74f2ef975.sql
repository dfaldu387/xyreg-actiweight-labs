-- Add span_between_phases to the allowed dependency types
ALTER TABLE public.phase_dependencies 
DROP CONSTRAINT phase_dependencies_dependency_type_check;

ALTER TABLE public.phase_dependencies 
ADD CONSTRAINT phase_dependencies_dependency_type_check 
CHECK (dependency_type = ANY (ARRAY[
  'finish_to_start'::text, 
  'start_to_start'::text, 
  'finish_to_finish'::text, 
  'start_to_finish'::text,
  'span_between_phases'::text
]));