-- Create table to cache FDA product codes
CREATE TABLE IF NOT EXISTS fda_product_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  device_class text,
  regulation_number text,
  medical_specialty text,
  product_code_name text,
  definition text,
  guidance_documents jsonb DEFAULT '[]'::jsonb,
  submission_type_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_fetched_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE fda_product_codes ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users (this is public FDA data)
CREATE POLICY "Allow read access to FDA product codes" ON fda_product_codes
  FOR SELECT USING (true);

-- Only allow system/admin to insert/update (for caching purposes)
CREATE POLICY "Allow system to manage FDA product codes" ON fda_product_codes
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create index for fast lookups
CREATE INDEX idx_fda_product_codes_code ON fda_product_codes(code);
CREATE INDEX idx_fda_product_codes_updated ON fda_product_codes(updated_at);

-- Create trigger to update timestamp
CREATE TRIGGER update_fda_product_codes_updated_at
  BEFORE UPDATE ON fda_product_codes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();