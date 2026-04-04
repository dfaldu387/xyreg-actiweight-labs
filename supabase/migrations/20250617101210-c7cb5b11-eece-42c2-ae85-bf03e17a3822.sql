
-- Create the junction table for many-to-many relationship between phases and categories
CREATE TABLE phase_category_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_phase_id UUID NOT NULL REFERENCES company_phases(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES phase_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_phase_id, category_id)
);

-- Add indexes for performance
CREATE INDEX idx_phase_category_assignments_company_phase_id ON phase_category_assignments(company_phase_id);
CREATE INDEX idx_phase_category_assignments_category_id ON phase_category_assignments(category_id);

-- Add RLS policy for the new table
ALTER TABLE phase_category_assignments ENABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE TRIGGER update_phase_category_assignments_updated_at
  BEFORE UPDATE ON phase_category_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing category assignments from company_phases to the new junction table
INSERT INTO phase_category_assignments (company_phase_id, category_id, created_at, updated_at)
SELECT id, category_id, created_at, updated_at
FROM company_phases
WHERE category_id IS NOT NULL;

-- Note: We'll keep the category_id column in company_phases for now to maintain backward compatibility
-- It can be removed in a future migration once the many-to-many system is fully tested
