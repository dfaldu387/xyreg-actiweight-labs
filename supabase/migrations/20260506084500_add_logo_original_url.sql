-- Store the original (uncropped) uploaded logo so users can re-crop later without re-uploading.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS logo_original_url text;

COMMENT ON COLUMN public.companies.logo_original_url IS
  'URL of the original uploaded logo file before cropping. Used for lossless re-crop in Settings.';
