-- Restructure user_document_permissions from per-row (one row per user+document)
-- to array-based (one row per user with document_ids UUID[]).
--
-- The old table had reviewer columns (is_active_reviewer, review_scope, etc.)
-- that are no longer used. The new table is purely for document access control.

-- Step 1: Create the new table
CREATE TABLE user_document_permissions_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  document_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Step 2: Migrate existing data — aggregate document_ids per user
-- We derive company_id from the documents table / phase_assigned_document_template
INSERT INTO user_document_permissions_new (user_id, company_id, document_ids)
SELECT
  udp.user_id,
  COALESCE(d.company_id, padt.company_id) AS company_id,
  array_agg(DISTINCT udp.document_id) AS document_ids
FROM user_document_permissions udp
LEFT JOIN documents d ON d.id = udp.document_id
LEFT JOIN phase_assigned_document_template padt ON padt.id = udp.document_id
WHERE COALESCE(d.company_id, padt.company_id) IS NOT NULL
GROUP BY udp.user_id, COALESCE(d.company_id, padt.company_id);

-- Step 3: Drop the old table and rename the new one
DROP TABLE user_document_permissions;
ALTER TABLE user_document_permissions_new RENAME TO user_document_permissions;

-- Step 4: Create indexes for efficient lookups
CREATE INDEX idx_user_document_permissions_user_id
  ON user_document_permissions(user_id);
CREATE INDEX idx_user_document_permissions_company_id
  ON user_document_permissions(company_id);
CREATE INDEX idx_user_document_permissions_document_ids
  ON user_document_permissions USING GIN(document_ids);

-- Step 5: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_document_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_document_permissions_updated_at
  BEFORE UPDATE ON user_document_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_document_permissions_updated_at();
