-- Add RLS policies for emdn_codes table to allow EMDN data import

-- Allow authenticated users to insert EMDN codes (for data import)
CREATE POLICY "Allow authenticated users to insert EMDN codes" 
ON public.emdn_codes 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update EMDN codes (for data maintenance)
CREATE POLICY "Allow authenticated users to update EMDN codes" 
ON public.emdn_codes 
FOR UPDATE 
TO authenticated
USING (true);

-- Allow authenticated users to delete EMDN codes (for data cleanup)
CREATE POLICY "Allow authenticated users to delete EMDN codes" 
ON public.emdn_codes 
FOR DELETE 
TO authenticated
USING (true);