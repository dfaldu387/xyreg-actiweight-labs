-- Fix unique constraint for span dependencies to include end_phase_id
ALTER TABLE product_phase_dependencies 
DROP CONSTRAINT IF EXISTS unique_phase_dependency;

-- Create new constraint that properly handles span dependencies
ALTER TABLE product_phase_dependencies 
ADD CONSTRAINT unique_phase_dependency_with_span 
UNIQUE (source_phase_id, target_phase_id, dependency_type, COALESCE(end_phase_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Also ensure we have proper indexing for span dependency queries
CREATE INDEX IF NOT EXISTS idx_product_phase_dependencies_span 
ON product_phase_dependencies (source_phase_id, end_phase_id, dependency_type) 
WHERE dependency_type = 'span_between_phases';