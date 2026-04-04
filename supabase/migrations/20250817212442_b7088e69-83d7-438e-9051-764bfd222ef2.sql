-- CRITICAL SECURITY FIX: Enable RLS on variant tables to prevent data leaks between companies

-- Enable RLS on product variation dimensions table
ALTER TABLE product_variation_dimensions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product variation options table  
ALTER TABLE product_variation_options ENABLE ROW LEVEL SECURITY;

-- Verify and create RLS policies if they don't exist
DO $$ 
BEGIN
  -- Check if dimension policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_variation_dimensions' 
    AND policyname = 'Company members can manage their variation dimensions'
  ) THEN
    CREATE POLICY "Company members can manage their variation dimensions" ON product_variation_dimensions
      USING (company_id IN (
        SELECT company_id FROM user_company_roles 
        WHERE user_id = auth.uid()
      ));
  END IF;

  -- Check if options policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'product_variation_options' 
    AND policyname = 'Company members can manage their variation options'
  ) THEN
    CREATE POLICY "Company members can manage their variation options" ON product_variation_options
      USING (company_id IN (
        SELECT company_id FROM user_company_roles 
        WHERE user_id = auth.uid()
      ));
  END IF;
END $$;