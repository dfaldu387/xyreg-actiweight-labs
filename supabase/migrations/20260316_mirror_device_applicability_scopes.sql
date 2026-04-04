-- Migration: Mirror Device Applicability scopes to all family members
--
-- Previously, scope data (which devices a field/feature/component/hazard/document applies to)
-- was stored on only ONE product. Other family members had no knowledge of the group.
-- This migration copies scope entries from any product that has them to all siblings
-- in the same company, so every device sees the same group membership.

DO $$
DECLARE
  scope_key TEXT;
  company RECORD;
  product RECORD;
  sibling RECORD;
  merged_scopes JSONB;
  item_key TEXT;
  item_scope JSONB;
  existing_overrides JSONB;
  existing_scopes JSONB;
  updated BOOLEAN;
BEGIN
  -- Process each scope storage key
  FOREACH scope_key IN ARRAY ARRAY[
    'classification_exclusion_scopes',
    'feature_exclusion_scopes',
    'component_exclusion_scopes',
    'hazard_exclusion_scopes',
    'document_ci_exclusion_scopes'
  ] LOOP

    -- For each company that has products with scope data
    FOR company IN
      SELECT DISTINCT p.company_id
      FROM products p
      WHERE p.is_archived = false
        AND p.company_id IS NOT NULL
        AND p.field_scope_overrides IS NOT NULL
        AND p.field_scope_overrides ? scope_key
        AND jsonb_typeof(p.field_scope_overrides -> scope_key) = 'object'
        AND (p.field_scope_overrides -> scope_key) != '{}'::jsonb
    LOOP

      -- Merge all scope entries across all products in this company
      merged_scopes := '{}'::jsonb;

      FOR product IN
        SELECT p.id, p.field_scope_overrides
        FROM products p
        WHERE p.company_id = company.company_id
          AND p.is_archived = false
          AND p.field_scope_overrides IS NOT NULL
          AND p.field_scope_overrides ? scope_key
          AND jsonb_typeof(p.field_scope_overrides -> scope_key) = 'object'
      LOOP
        -- Merge each item's scope (first writer wins — don't overwrite existing)
        FOR item_key, item_scope IN
          SELECT key, value FROM jsonb_each(product.field_scope_overrides -> scope_key)
        LOOP
          IF NOT (merged_scopes ? item_key) THEN
            merged_scopes := merged_scopes || jsonb_build_object(item_key, item_scope);
          END IF;
        END LOOP;
      END LOOP;

      -- Skip if nothing to merge
      IF merged_scopes = '{}'::jsonb THEN
        CONTINUE;
      END IF;

      -- Apply merged scopes to ALL products in this company
      FOR sibling IN
        SELECT p.id, p.field_scope_overrides
        FROM products p
        WHERE p.company_id = company.company_id
          AND p.is_archived = false
      LOOP
        existing_overrides := COALESCE(sibling.field_scope_overrides, '{}'::jsonb);
        existing_scopes := COALESCE(existing_overrides -> scope_key, '{}'::jsonb);

        -- Check if sibling is missing any scope entries
        updated := false;
        FOR item_key, item_scope IN
          SELECT key, value FROM jsonb_each(merged_scopes)
        LOOP
          IF NOT (existing_scopes ? item_key) THEN
            existing_scopes := existing_scopes || jsonb_build_object(item_key, item_scope);
            updated := true;
          END IF;
        END LOOP;

        -- Only write if we actually added new entries
        IF updated THEN
          existing_overrides := jsonb_set(existing_overrides, ARRAY[scope_key], existing_scopes);
          UPDATE products
            SET field_scope_overrides = existing_overrides
            WHERE id = sibling.id;
        END IF;
      END LOOP;

    END LOOP; -- company loop

    RAISE NOTICE 'Finished mirroring scope key: %', scope_key;

  END LOOP; -- scope_key loop

  RAISE NOTICE 'Migration complete: Device Applicability scopes mirrored to all family members.';
END $$;
