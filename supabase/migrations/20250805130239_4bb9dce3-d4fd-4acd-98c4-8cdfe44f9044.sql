-- Update RLS policy for eudamed_device_registry to allow authenticated users to insert
-- This is a public registry that should be accessible for import by any authenticated user

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Only admins can insert eudamed devices" ON eudamed.eudamed_device_registry;

-- Create new policy allowing authenticated users to insert
CREATE POLICY "Authenticated users can insert eudamed devices" 
ON eudamed.eudamed_device_registry 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure authenticated users can also read the data
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON eudamed.eudamed_device_registry;
CREATE POLICY "Enable read access for authenticated users" 
ON eudamed.eudamed_device_registry 
FOR SELECT 
TO authenticated 
USING (true);