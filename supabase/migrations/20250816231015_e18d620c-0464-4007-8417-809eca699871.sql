-- Fix RLS issues for hierarchy data tables

-- Enable RLS on tables that have policies but RLS disabled
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_pms_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_completion_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW_LEVEL SECURITY;
ALTER TABLE company_phases ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policies for key hierarchy tables
-- Products table policies
CREATE POLICY "Users can view products for their companies" 
ON products 
FOR SELECT 
USING (company_id IN ( 
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE (user_company_access.user_id = auth.uid())
));

CREATE POLICY "Users can create products for their companies" 
ON products 
FOR INSERT 
WITH CHECK (company_id IN ( 
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE ((user_company_access.user_id = auth.uid()) AND 
         (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
));

CREATE POLICY "Users can update products for their companies" 
ON products 
FOR UPDATE 
USING (company_id IN ( 
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE ((user_company_access.user_id = auth.uid()) AND 
         (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
));

CREATE POLICY "Users can delete products for their companies" 
ON products 
FOR DELETE 
USING (company_id IN ( 
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE ((user_company_access.user_id = auth.uid()) AND 
         (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
));

-- Product variants policies
CREATE POLICY "Users can view product variants for their companies" 
ON product_variants 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM products 
  WHERE products.id = product_variants.product_id 
  AND products.company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  )
));

CREATE POLICY "Users can create product variants for their companies" 
ON product_variants 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM products 
  WHERE products.id = product_variants.product_id 
  AND products.company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE ((user_company_access.user_id = auth.uid()) AND 
           (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
  )
));

CREATE POLICY "Users can update product variants for their companies" 
ON product_variants 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM products 
  WHERE products.id = product_variants.product_id 
  AND products.company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE ((user_company_access.user_id = auth.uid()) AND 
           (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
  )
));

CREATE POLICY "Users can delete product variants for their companies" 
ON product_variants 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM products 
  WHERE products.id = product_variants.product_id 
  AND products.company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE ((user_company_access.user_id = auth.uid()) AND 
           (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
  )
));

-- Product variant values policies
CREATE POLICY "Users can view product variant values for their companies" 
ON product_variant_values 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  WHERE pv.id = product_variant_values.product_variant_id 
  AND p.company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  )
));

CREATE POLICY "Users can create product variant values for their companies" 
ON product_variant_values 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  WHERE pv.id = product_variant_values.product_variant_id 
  AND p.company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE ((user_company_access.user_id = auth.uid()) AND 
           (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
  )
));

CREATE POLICY "Users can update product variant values for their companies" 
ON product_variant_values 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  WHERE pv.id = product_variant_values.product_variant_id 
  AND p.company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE ((user_company_access.user_id = auth.uid()) AND 
           (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
  )
));

CREATE POLICY "Users can delete product variant values for their companies" 
ON product_variant_values 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  WHERE pv.id = product_variant_values.product_variant_id 
  AND p.company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE ((user_company_access.user_id = auth.uid()) AND 
           (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
  )
));

-- Product variation dimensions policies
CREATE POLICY "Users can view variation dimensions for their companies" 
ON product_variation_dimensions 
FOR SELECT 
USING (company_id IN ( 
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE (user_company_access.user_id = auth.uid())
));

CREATE POLICY "Users can create variation dimensions for their companies" 
ON product_variation_dimensions 
FOR INSERT 
WITH CHECK (company_id IN ( 
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE ((user_company_access.user_id = auth.uid()) AND 
         (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
));

CREATE POLICY "Users can update variation dimensions for their companies" 
ON product_variation_dimensions 
FOR UPDATE 
USING (company_id IN ( 
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE ((user_company_access.user_id = auth.uid()) AND 
         (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
));

CREATE POLICY "Users can delete variation dimensions for their companies" 
ON product_variation_dimensions 
FOR DELETE 
USING (company_id IN ( 
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE ((user_company_access.user_id = auth.uid()) AND 
         (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
));

-- Product variation options policies
CREATE POLICY "Users can view variation options for their companies" 
ON product_variation_options 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM product_variation_dimensions pvd
  WHERE pvd.id = product_variation_options.dimension_id
  AND pvd.company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  )
));

CREATE POLICY "Users can create variation options for their companies" 
ON product_variation_options 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM product_variation_dimensions pvd
  WHERE pvd.id = product_variation_options.dimension_id
  AND pvd.company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE ((user_company_access.user_id = auth.uid()) AND 
           (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
  )
));

CREATE POLICY "Users can update variation options for their companies" 
ON product_variation_options 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM product_variation_dimensions pvd
  WHERE pvd.id = product_variation_options.dimension_id
  AND pvd.company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE ((user_company_access.user_id = auth.uid()) AND 
           (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
  )
));

CREATE POLICY "Users can delete variation options for their companies" 
ON product_variation_options 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM product_variation_dimensions pvd
  WHERE pvd.id = product_variation_options.dimension_id
  AND pvd.company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE ((user_company_access.user_id = auth.uid()) AND 
           (user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])))
  )
));