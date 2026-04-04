-- Fix unique constraint for product phase dependencies
-- Drop existing constraint
ALTER TABLE product_phase_dependencies 
DROP CONSTRAINT IF EXISTS unique_normal_dependency;

-- Create a simple unique constraint that allows multiple span dependencies
CREATE UNIQUE INDEX unique_product_phase_dependency 
ON product_phase_dependencies (product_id, source_phase_id, target_phase_id, dependency_type);