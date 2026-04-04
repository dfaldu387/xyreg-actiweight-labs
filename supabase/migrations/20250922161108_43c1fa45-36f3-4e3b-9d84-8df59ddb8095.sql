-- Fix unique constraint for span dependencies
ALTER TABLE product_phase_dependencies 
DROP CONSTRAINT IF EXISTS unique_phase_dependency;

-- Create separate unique constraints for different dependency types
-- For normal dependencies (no end_phase_id)
CREATE UNIQUE INDEX unique_normal_dependency 
ON product_phase_dependencies (source_phase_id, target_phase_id, dependency_type) 
WHERE end_phase_id IS NULL;

-- For span dependencies (with end_phase_id)
CREATE UNIQUE INDEX unique_span_dependency 
ON product_phase_dependencies (source_phase_id, target_phase_id, end_phase_id, dependency_type) 
WHERE end_phase_id IS NOT NULL AND dependency_type = 'span_between_phases';

-- Add index for span dependency queries
CREATE INDEX IF NOT EXISTS idx_product_phase_dependencies_span 
ON product_phase_dependencies (source_phase_id, end_phase_id, dependency_type) 
WHERE dependency_type = 'span_between_phases';