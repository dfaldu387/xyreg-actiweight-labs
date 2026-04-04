-- Migration: Restructure product_user_access to use arrays for matrix-style management
-- This creates a new table optimized for user-product matrix operations

-- Create new user_product_matrix table with array structure
CREATE TABLE IF NOT EXISTS public.user_product_matrix (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_ids UUID[] NOT NULL DEFAULT '{}',
  department VARCHAR(255) NULL,
  user_type VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (
    user_type IN ('owner', 'admin', 'manager', 'editor', 'viewer', 'reviewer', 'guest')
  ),
  role_id UUID NULL REFERENCES role_permissions(id) ON DELETE SET NULL,
  role_name VARCHAR(100) NULL,
  permissions JSONB NULL DEFAULT '{}',
  access_level VARCHAR(20) NULL DEFAULT 'read' CHECK (
    access_level IN ('none', 'read', 'write', 'full')
  ),
  is_active BOOLEAN NULL DEFAULT true,
  assigned_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT user_product_matrix_pkey PRIMARY KEY (id),
  CONSTRAINT user_product_matrix_user_company_unique UNIQUE (user_id, company_id) WHERE (is_active = true)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_product_matrix_user_id 
  ON public.user_product_matrix USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_product_matrix_company_id 
  ON public.user_product_matrix USING btree (company_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_product_matrix_department 
  ON public.user_product_matrix USING btree (department) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_product_matrix_is_active 
  ON public.user_product_matrix USING btree (is_active) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_product_matrix_product_ids 
  ON public.user_product_matrix USING gin (product_ids) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_product_matrix_user_company 
  ON public.user_product_matrix USING btree (user_id, company_id) TABLESPACE pg_default;

-- GIN index for array searches (for finding which users have access to a product)
CREATE INDEX IF NOT EXISTS idx_user_product_matrix_product_ids_gin 
  ON public.user_product_matrix USING gin (product_ids) TABLESPACE pg_default;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_product_matrix_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_product_matrix_updated_at
  BEFORE UPDATE ON public.user_product_matrix
  FOR EACH ROW
  EXECUTE FUNCTION update_user_product_matrix_updated_at();

-- Enable RLS
ALTER TABLE public.user_product_matrix ENABLE ROW LEVEL SECURITY;

-- RLS Policies (you may need to adjust based on your security requirements)
CREATE POLICY "Users can view their own matrix records"
  ON public.user_product_matrix
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Company admins can view matrix records"
  ON public.user_product_matrix
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.company_id = user_product_matrix.company_id
      AND uca.user_id = auth.uid()
      AND uca.access_level IN ('admin', 'company_admin', 'consultant')
    )
  );

CREATE POLICY "Company admins can manage matrix records"
  ON public.user_product_matrix
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.company_id = user_product_matrix.company_id
      AND uca.user_id = auth.uid()
      AND uca.access_level IN ('admin', 'company_admin', 'consultant')
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.user_product_matrix IS 'Matrix-style table for managing user-product access assignments with arrays';
COMMENT ON COLUMN public.user_product_matrix.user_id IS 'Reference to the user';
COMMENT ON COLUMN public.user_product_matrix.company_id IS 'Reference to the company';
COMMENT ON COLUMN public.user_product_matrix.product_ids IS 'Array of product IDs the user has access to';
COMMENT ON COLUMN public.user_product_matrix.department IS 'Department of the user';
COMMENT ON COLUMN public.user_product_matrix.user_type IS 'Type of user access';
COMMENT ON COLUMN public.user_product_matrix.access_level IS 'Overall access level';
COMMENT ON COLUMN public.user_product_matrix.product_ids IS 'Array of product UUIDs';

