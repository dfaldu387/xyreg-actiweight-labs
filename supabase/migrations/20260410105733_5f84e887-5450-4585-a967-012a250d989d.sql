-- Create regulatory_news_items table for the Regulatory News widget
CREATE TABLE public.regulatory_news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  source_name TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  category TEXT DEFAULT 'general',
  region TEXT,
  relevance_score SMALLINT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regulatory_news_items ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read regulatory news
CREATE POLICY "Authenticated users can read regulatory news"
  ON public.regulatory_news_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Index for efficient querying by date
CREATE INDEX idx_regulatory_news_scraped ON public.regulatory_news_items(scraped_at DESC);
CREATE INDEX idx_regulatory_news_region ON public.regulatory_news_items(region);
CREATE INDEX idx_regulatory_news_category ON public.regulatory_news_items(category);

-- Also fix the 3 mismatched framework_keys in standard_version_status
UPDATE public.standard_version_status SET framework_key = 'IEC_62366_1' WHERE framework_key = 'IEC_62366';
UPDATE public.standard_version_status SET framework_key = 'ISO_15223_1' WHERE framework_key = 'ISO_15223';
UPDATE public.standard_version_status SET framework_key = 'ISO_14971_DEVICE' WHERE framework_key = 'IEEE_14971';