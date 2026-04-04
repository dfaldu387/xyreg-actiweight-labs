-- Create table for business model canvas
CREATE TABLE public.business_canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_segments TEXT,
  value_propositions TEXT,
  channels TEXT,
  customer_relationships TEXT,
  revenue_streams TEXT,
  key_resources TEXT,
  key_activities TEXT,
  key_partnerships TEXT,
  cost_structure TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  last_modified TIMESTAMPTZ DEFAULT now(),
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_product_canvas UNIQUE (product_id)
);

-- Enable Row Level Security
ALTER TABLE public.business_canvas ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Enable all access for authenticated users"
  ON public.business_canvas
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_business_canvas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_canvas_updated_at
  BEFORE UPDATE ON public.business_canvas
  FOR EACH ROW
  EXECUTE FUNCTION update_business_canvas_updated_at();