-- Phase 1: Database Schema Enhancement for Traceability-Driven Requirements

-- Create enum for requirement types
CREATE TYPE requirement_type AS ENUM ('system', 'software', 'hardware');

-- Extend requirement_specifications table
ALTER TABLE requirement_specifications 
ADD COLUMN requirement_type requirement_type DEFAULT 'system',
ADD COLUMN parent_requirements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN child_requirements JSONB DEFAULT '[]'::jsonb;

-- Update user_needs table for better traceability
ALTER TABLE user_needs 
ADD COLUMN child_requirements JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better performance on traceability queries
CREATE INDEX idx_requirement_specifications_type ON requirement_specifications(requirement_type);
CREATE INDEX idx_requirement_specifications_parent_requirements ON requirement_specifications USING GIN(parent_requirements);
CREATE INDEX idx_requirement_specifications_child_requirements ON requirement_specifications USING GIN(child_requirements);
CREATE INDEX idx_user_needs_child_requirements ON user_needs USING GIN(child_requirements);

-- Update the requirement ID generation function to support prefixes
CREATE OR REPLACE FUNCTION generate_requirement_id(
  p_product_id UUID,
  p_requirement_type requirement_type DEFAULT 'system'
) RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  last_number INTEGER := 0;
  next_number INTEGER;
  existing_id TEXT;
BEGIN
  -- Set prefix based on requirement type
  CASE p_requirement_type
    WHEN 'system' THEN prefix := 'SR-';
    WHEN 'software' THEN prefix := 'SWR-';
    WHEN 'hardware' THEN prefix := 'HWR-';
    ELSE prefix := 'RS-'; -- fallback
  END CASE;
  
  -- Find the highest existing number for this type and product
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(requirement_id FROM LENGTH(prefix) + 1) AS INTEGER
      )
    ), 0
  ) INTO last_number
  FROM requirement_specifications 
  WHERE product_id = p_product_id 
    AND requirement_type = p_requirement_type
    AND requirement_id ~ ('^' || prefix || '[0-9]+$');
  
  -- Generate next number
  next_number := last_number + 1;
  
  -- Format with leading zeros (3 digits)
  RETURN prefix || LPAD(next_number::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Update existing records to have proper requirement_type
UPDATE requirement_specifications 
SET requirement_type = 'system'
WHERE requirement_type IS NULL;

-- Create function to update traceability links
CREATE OR REPLACE FUNCTION update_traceability_links(
  p_parent_id TEXT,
  p_child_id TEXT,
  p_parent_table TEXT DEFAULT 'requirement_specifications'
) RETURNS VOID AS $$
BEGIN
  -- Add child to parent's child_requirements
  IF p_parent_table = 'user_needs' THEN
    UPDATE user_needs 
    SET child_requirements = COALESCE(child_requirements, '[]'::jsonb) || jsonb_build_array(p_child_id)
    WHERE user_need_id = p_parent_id
      AND NOT (child_requirements @> jsonb_build_array(p_child_id));
  ELSE
    UPDATE requirement_specifications 
    SET child_requirements = COALESCE(child_requirements, '[]'::jsonb) || jsonb_build_array(p_child_id)
    WHERE requirement_id = p_parent_id
      AND NOT (child_requirements @> jsonb_build_array(p_child_id));
  END IF;
  
  -- Add parent to child's parent_requirements
  UPDATE requirement_specifications 
  SET parent_requirements = COALESCE(parent_requirements, '[]'::jsonb) || jsonb_build_array(p_parent_id)
  WHERE requirement_id = p_child_id
    AND NOT (parent_requirements @> jsonb_build_array(p_parent_id));
END;
$$ LANGUAGE plpgsql;