
-- Migration: Refactor Phase Management Schema (Fixed for Orphaned Data)
-- Step 1: Create new company_phases table
CREATE TABLE company_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES phase_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, name),
  UNIQUE(company_id, position)
);

-- Step 2: Add position column to phase_categories
ALTER TABLE phase_categories ADD COLUMN position INTEGER DEFAULT 0;

-- Step 3: Create indexes for performance
CREATE INDEX idx_company_phases_company_id ON company_phases(company_id);
CREATE INDEX idx_company_phases_position ON company_phases(company_id, position);
CREATE INDEX idx_phase_categories_position ON phase_categories(company_id, position);

-- Step 4: Migrate data with guaranteed unique positions per company (only valid company references)
WITH ranked_phases AS (
  SELECT 
    p.id,
    p.company_id,
    p.category_id,
    p.name,
    p.description,
    p.inserted_at,
    p.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY p.company_id 
      ORDER BY COALESCE(ccp.position, 999999), p.inserted_at
    ) - 1 as new_position
  FROM phases p
  LEFT JOIN company_chosen_phases ccp ON p.id = ccp.phase_id
  INNER JOIN companies c ON p.company_id = c.id  -- Only include phases with valid company references
  WHERE p.company_id IS NOT NULL
)
INSERT INTO company_phases (id, company_id, category_id, name, description, position, is_active, created_at, updated_at)
SELECT 
  id,
  company_id,
  category_id,
  name,
  description,
  new_position,
  true as is_active,
  inserted_at,
  updated_at
FROM ranked_phases;

-- Step 5: Create new phase_document_templates table
CREATE TABLE phase_document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_phase_id UUID NOT NULL REFERENCES company_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT DEFAULT 'Standard',
  status TEXT DEFAULT 'Not Started',
  tech_applicability TEXT DEFAULT 'All device types',
  markets JSONB DEFAULT '[]',
  classes_by_market JSONB DEFAULT '{}',
  document_scope document_scope DEFAULT 'company_template',
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Migrate data from phase_assigned_documents to phase_document_templates (only valid references)
INSERT INTO phase_document_templates (
  id, company_phase_id, name, document_type, status, tech_applicability, 
  markets, classes_by_market, document_scope, deadline, created_at, updated_at
)
SELECT 
  pad.id,
  cp.id as company_phase_id,
  pad.name,
  pad.document_type,
  pad.status,
  pad.tech_applicability,
  pad.markets,
  pad.classes_by_market,
  pad.document_scope,
  pad.deadline,
  pad.created_at,
  pad.updated_at
FROM phase_assigned_documents pad
JOIN phases p ON pad.phase_id = p.id
JOIN company_phases cp ON p.id = cp.id
INNER JOIN companies c ON p.company_id = c.id  -- Only include documents with valid company references
WHERE p.company_id IS NOT NULL;

-- Step 7: Update lifecycle_phases to reference company_phases
ALTER TABLE lifecycle_phases ADD COLUMN company_phase_id UUID REFERENCES company_phases(id);

-- Populate company_phase_id in lifecycle_phases (only valid references)
UPDATE lifecycle_phases lp
SET company_phase_id = cp.id
FROM company_phases cp, products pr, companies c
WHERE lp.product_id = pr.id 
AND cp.company_id = pr.company_id 
AND cp.company_id = c.id  -- Ensure company exists
AND cp.name = lp.name;

-- Step 8: Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_phases_updated_at BEFORE UPDATE ON company_phases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phase_document_templates_updated_at BEFORE UPDATE ON phase_document_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
