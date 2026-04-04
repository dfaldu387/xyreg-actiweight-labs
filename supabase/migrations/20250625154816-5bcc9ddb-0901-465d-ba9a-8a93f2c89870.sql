
-- Fix RLS policies for notified_bodies table to allow data import
-- The issue is that RLS is blocking the insert operations

-- First, let's check what RLS policies exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notified_bodies';

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can view notified bodies" ON notified_bodies;
DROP POLICY IF EXISTS "Users can insert notified bodies" ON notified_bodies;
DROP POLICY IF EXISTS "Users can update notified bodies" ON notified_bodies;
DROP POLICY IF EXISTS "Users can delete notified bodies" ON notified_bodies;

-- Create permissive RLS policies for notified_bodies
-- These are reference data that should be readable by all authenticated users

-- Allow all authenticated users to view notified bodies
CREATE POLICY "Allow authenticated users to view notified bodies" ON notified_bodies
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert notified bodies (needed for import)
CREATE POLICY "Allow authenticated users to insert notified bodies" ON notified_bodies
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update notified bodies (needed for import/maintenance)
CREATE POLICY "Allow authenticated users to update notified bodies" ON notified_bodies
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete notified bodies (needed for data cleanup)
CREATE POLICY "Allow authenticated users to delete notified bodies" ON notified_bodies
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Ensure RLS is enabled on the table
ALTER TABLE notified_bodies ENABLE ROW LEVEL SECURITY;

-- Add helpful comment
COMMENT ON TABLE notified_bodies IS 'Reference data for EU Notified Bodies - accessible to all authenticated users';
