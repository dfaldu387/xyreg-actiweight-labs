-- Add UPDATE policy for authenticated users on eudamed_device_registry
CREATE POLICY "Authenticated users can update eudamed devices" 
ON eudamed.eudamed_device_registry 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);