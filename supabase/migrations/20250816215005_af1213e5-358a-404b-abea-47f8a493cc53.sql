-- Add RLS policies for products table to ensure user access
-- First check if policies exist, if not create them

-- Policy for viewing products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND policyname = 'Users can view products for their companies'
  ) THEN
    CREATE POLICY "Users can view products for their companies"
    ON public.products
    FOR SELECT
    USING (
      company_id IN (
        SELECT user_company_access.company_id
        FROM user_company_access
        WHERE user_company_access.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Policy for creating products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND policyname = 'Users can create products for their companies'
  ) THEN
    CREATE POLICY "Users can create products for their companies"
    ON public.products
    FOR INSERT
    WITH CHECK (
      company_id IN (
        SELECT user_company_access.company_id
        FROM user_company_access
        WHERE user_company_access.user_id = auth.uid() 
        AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
      )
    );
  END IF;
END $$;

-- Policy for updating products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND policyname = 'Users can update products for their companies'
  ) THEN
    CREATE POLICY "Users can update products for their companies"
    ON public.products
    FOR UPDATE
    USING (
      company_id IN (
        SELECT user_company_access.company_id
        FROM user_company_access
        WHERE user_company_access.user_id = auth.uid() 
        AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
      )
    );
  END IF;
END $$;

-- Policy for deleting products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND policyname = 'Users can delete products for their companies'
  ) THEN
    CREATE POLICY "Users can delete products for their companies"
    ON public.products
    FOR DELETE
    USING (
      company_id IN (
        SELECT user_company_access.company_id
        FROM user_company_access
        WHERE user_company_access.user_id = auth.uid() 
        AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
      )
    );
  END IF;
END $$;

-- Enable RLS on products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;