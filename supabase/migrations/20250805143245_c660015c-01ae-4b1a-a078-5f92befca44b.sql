-- Fix EUDAMED table primary key: UDI_DI should be primary key, not ID_SRN
-- This resolves the "Unknown database error" in EUDAMED imports

-- Step 1: Drop the existing primary key constraint on id_srn
ALTER TABLE eudamed.eudamed_device_registry 
DROP CONSTRAINT IF EXISTS eudamed_device_registry_pkey;

-- Step 2: Set udi_di as the new primary key (UDI-DI is the unique device identifier)
ALTER TABLE eudamed.eudamed_device_registry 
ADD CONSTRAINT eudamed_device_registry_pkey PRIMARY KEY (udi_di);

-- Step 3: Create an index on id_srn for organization lookups (still important for queries)
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_id_srn 
ON eudamed.eudamed_device_registry (id_srn);

-- Step 4: Create an index on organization for better search performance
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_organization 
ON eudamed.eudamed_device_registry (organization);

-- Step 5: Update any existing RLS policies to reference udi_di correctly
DROP POLICY IF EXISTS "Authenticated users can update eudamed devices" ON eudamed.eudamed_device_registry;

-- Create new policy that makes more sense for read-only reference data
CREATE POLICY "Allow read access to eudamed devices" 
ON eudamed.eudamed_device_registry 
FOR SELECT 
TO authenticated
USING (true);

-- Note: EUDAMED registry should primarily be read-only for application users
-- Write access should be restricted to data import processes only