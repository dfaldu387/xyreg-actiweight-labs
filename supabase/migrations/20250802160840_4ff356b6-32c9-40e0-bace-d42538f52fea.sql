-- Remove the restrictive level check constraint and replace with a more flexible one
ALTER TABLE emdn_codes DROP CONSTRAINT IF EXISTS emdn_codes_level_check;

-- Add a new constraint that allows levels 0-10 to accommodate deeper hierarchies
ALTER TABLE emdn_codes ADD CONSTRAINT emdn_codes_level_check CHECK (level >= 0 AND level <= 10);