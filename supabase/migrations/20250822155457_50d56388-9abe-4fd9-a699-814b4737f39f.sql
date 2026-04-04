-- Create FDA document cache table for storing enhanced document content
CREATE TABLE IF NOT EXISTS public.fda_document_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  k_number TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fast K-number lookups
CREATE INDEX IF NOT EXISTS idx_fda_document_cache_k_number ON public.fda_document_cache(k_number);

-- Create index for content search
CREATE INDEX IF NOT EXISTS idx_fda_document_cache_content ON public.fda_document_cache USING GIN(content);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_fda_document_cache_updated_at
  BEFORE UPDATE ON public.fda_document_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fda_document_cache_updated_at();

-- Add RLS policies
ALTER TABLE public.fda_document_cache ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read FDA document cache
CREATE POLICY "FDA document cache is readable by authenticated users" 
ON public.fda_document_cache 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow all authenticated users to insert/update FDA document cache
CREATE POLICY "FDA document cache is writable by authenticated users" 
ON public.fda_document_cache 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE public.fda_document_cache IS 'Cache table for storing enhanced FDA document content and predicate analysis';
COMMENT ON COLUMN public.fda_document_cache.k_number IS 'FDA 510(k) K-number identifier';
COMMENT ON COLUMN public.fda_document_cache.content IS 'Enhanced document content with predicate analysis in JSON format';