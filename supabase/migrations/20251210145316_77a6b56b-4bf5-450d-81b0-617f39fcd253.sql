-- Add version and date columns to documents table (replacing version_date)
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS version text,
ADD COLUMN IF NOT EXISTS date text;

-- Migrate existing version_date data to date column (if any exists)
UPDATE public.documents 
SET date = version_date 
WHERE version_date IS NOT NULL AND date IS NULL;

-- Drop the old version_date column
ALTER TABLE public.documents 
DROP COLUMN IF EXISTS version_date;