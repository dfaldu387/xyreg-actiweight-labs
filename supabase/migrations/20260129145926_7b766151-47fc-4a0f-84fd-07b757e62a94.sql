-- Fix the foreign key to reference auth.users instead of profiles
ALTER TABLE capa_records DROP CONSTRAINT IF EXISTS capa_records_created_by_fkey;
ALTER TABLE capa_records 
  ADD CONSTRAINT capa_records_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;