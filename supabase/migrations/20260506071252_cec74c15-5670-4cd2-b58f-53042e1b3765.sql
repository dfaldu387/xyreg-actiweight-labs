ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS logo_original_url text,
  ADD COLUMN IF NOT EXISTS document_logo_url text,
  ADD COLUMN IF NOT EXISTS document_logo_original_url text;

COMMENT ON COLUMN public.companies.logo_original_url IS 'Original uploaded file for the square logo (lossless re-crop).';
COMMENT ON COLUMN public.companies.document_logo_url IS 'Wide (16:9) logo used on document headers/exports. Falls back to logo_url when null.';
COMMENT ON COLUMN public.companies.document_logo_original_url IS 'Original uploaded file for the document logo (lossless re-crop).';