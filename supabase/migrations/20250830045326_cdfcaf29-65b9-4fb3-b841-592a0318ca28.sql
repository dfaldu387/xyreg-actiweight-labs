-- Enable RLS on mdr_annex_1 table
ALTER TABLE mdr_annex_1 ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all data (for super admin functionality)
CREATE POLICY "Service role can manage all mdr_annex_1 entries" ON mdr_annex_1
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow authenticated users to view all mdr_annex_1 entries (super admin access)
CREATE POLICY "Authenticated users can view mdr_annex_1 entries" ON mdr_annex_1
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to manage mdr_annex_1 entries (super admin access)
CREATE POLICY "Authenticated users can manage mdr_annex_1 entries" ON mdr_annex_1
FOR ALL USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);