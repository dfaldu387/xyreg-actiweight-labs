-- Create table for caching FDA document analysis results
CREATE TABLE IF NOT EXISTS public.fda_document_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  k_number TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fda_document_cache ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (since this is reference data)
CREATE POLICY "FDA document cache is publicly readable" 
ON public.fda_document_cache 
FOR SELECT 
USING (true);

-- Create policy to allow service role to insert/update
CREATE POLICY "Service role can manage FDA document cache" 
ON public.fda_document_cache 
FOR ALL 
USING (true);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_fda_document_cache_k_number 
ON public.fda_document_cache(k_number);

-- Create index on created_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_fda_document_cache_created_at 
ON public.fda_document_cache(created_at);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_fda_document_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fda_document_cache_updated_at
    BEFORE UPDATE ON public.fda_document_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_fda_document_cache_updated_at();