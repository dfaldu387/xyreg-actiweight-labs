-- Add WITH CHECK clause to the UPDATE policy for eudamed_device_registry
DROP POLICY IF EXISTS "Authenticated users can update eudamed devices" ON eudamed.eudamed_device_registry;

CREATE POLICY "Authenticated users can update eudamed devices" 
ON eudamed.eudamed_device_registry 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);