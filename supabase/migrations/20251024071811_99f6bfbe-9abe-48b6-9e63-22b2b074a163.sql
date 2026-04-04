-- Add RLS policies for user_product_permissions table

-- Allow authenticated users to insert permissions
CREATE POLICY "Authenticated users can insert permissions"
ON public.user_product_permissions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to select permissions
CREATE POLICY "Authenticated users can select permissions"
ON public.user_product_permissions
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update permissions
CREATE POLICY "Authenticated users can update permissions"
ON public.user_product_permissions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete permissions
CREATE POLICY "Authenticated users can delete permissions"
ON public.user_product_permissions
FOR DELETE
TO authenticated
USING (true);