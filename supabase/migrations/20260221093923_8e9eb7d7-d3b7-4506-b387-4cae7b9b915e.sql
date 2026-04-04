-- Backfill archived_at for companies that were archived before the column existed
UPDATE public.companies
SET archived_at = updated_at
WHERE is_archived = true AND archived_at IS NULL;

-- Backfill archived_at for products that were archived before the column existed
UPDATE public.products
SET archived_at = updated_at
WHERE is_archived = true AND archived_at IS NULL;