-- Fix: PostgreSQL UNIQUE constraint doesn't match NULL = NULL
-- This caused duplicate rows when release_id is NULL

-- Drop the old constraint that doesn't handle NULLs
ALTER TABLE module_group_validations DROP CONSTRAINT IF EXISTS module_group_validations_company_id_release_id_module_group_key;

-- Create partial unique indexes that handle NULLs properly
CREATE UNIQUE INDEX IF NOT EXISTS idx_mgv_unique_with_release
  ON module_group_validations(company_id, release_id, module_group_id)
  WHERE release_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mgv_unique_without_release
  ON module_group_validations(company_id, module_group_id)
  WHERE release_id IS NULL;

-- Clean up existing duplicates (keep only the latest per module)
DELETE FROM module_group_validations a
USING module_group_validations b
WHERE a.company_id = b.company_id
  AND a.module_group_id = b.module_group_id
  AND a.release_id IS NOT DISTINCT FROM b.release_id
  AND a.updated_at < b.updated_at;
