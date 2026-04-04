
-- Delete duplicate non-completed training records, keeping the oldest one
DELETE FROM training_records
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER(PARTITION BY user_id, training_module_id, company_id ORDER BY created_at ASC) as rn
        FROM training_records
        WHERE status != 'completed'
    ) t
    WHERE t.rn > 1
);

-- Also delete non-completed duplicates where a completed record already exists
DELETE FROM training_records
WHERE id IN (
    SELECT tr.id
    FROM training_records tr
    WHERE tr.status != 'completed'
    AND EXISTS (
        SELECT 1 FROM training_records tr2
        WHERE tr2.user_id = tr.user_id
        AND tr2.training_module_id = tr.training_module_id
        AND tr2.company_id = tr.company_id
        AND tr2.status = 'completed'
    )
);

-- Add partial unique index to prevent future duplicates for non-completed records
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_module_company_non_completed
ON training_records (user_id, training_module_id, company_id)
WHERE status != 'completed';
