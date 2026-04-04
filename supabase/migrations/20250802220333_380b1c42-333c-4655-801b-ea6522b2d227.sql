-- Create RPC function to access EUDAMED schema from edge functions
CREATE OR REPLACE FUNCTION public.get_eudamed_emdn_codes()
RETURNS SETOF eudamed.emdn_codes
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM eudamed.emdn_codes ORDER BY code;
$$;