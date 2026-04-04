-- Fix the get_eudamed_emdn_codes function to return ALL codes, not just 1000
-- This will ensure all 22 EMDN categories (A-Z) are available in the frontend

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_eudamed_emdn_codes();

-- Create the improved function that returns ALL EMDN codes without limits
CREATE OR REPLACE FUNCTION get_eudamed_emdn_codes()
RETURNS TABLE (
  "ID" integer,
  "group" text,
  "code" text,
  "LEVEL" integer,
  "C_L" integer,
  "BOTTOM LEVEL YES/NO" text,
  "CATEGORY DESCRIPTION ITALIAN_29092021" text,
  "temp" text,
  "description" text,
  "Level 1" text,
  "Level 2" text,
  "Level 3" text,
  "Level 4" text,
  "Level 5" text,
  "Level 6" text,
  "Level 7" text,
  "parent_code" text,
  "is_leaf" boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return ALL EMDN codes from the eudamed schema without any limits
  -- This ensures all 22 categories are available
  RETURN QUERY
  SELECT 
    e."ID",
    e."group",
    e."code",
    e."LEVEL",
    e."C_L",
    e."BOTTOM LEVEL YES/NO",
    e."CATEGORY DESCRIPTION ITALIAN_29092021",
    e."temp",
    e."description",
    e."Level 1",
    e."Level 2", 
    e."Level 3",
    e."Level 4",
    e."Level 5",
    e."Level 6",
    e."Level 7",
    e."parent_code",
    e."is_leaf"
  FROM eudamed.emdn_codes e
  ORDER BY e."code"; -- Order by code for consistent results
END;
$$;