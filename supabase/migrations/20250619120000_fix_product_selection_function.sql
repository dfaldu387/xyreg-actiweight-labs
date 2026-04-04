
-- Fix get_company_products_for_selection to return proper JSON structure
CREATE OR REPLACE FUNCTION public.get_company_products_for_selection(target_company_id uuid)
 RETURNS TABLE(
   id uuid, 
   name text, 
   description text, 
   status text, 
   created_at timestamp with time zone,
   version text,
   parent_product_id uuid
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    COALESCE(p.status, 'On Track') as status,
    p.inserted_at as created_at,
    COALESCE(p.version, '1.0') as version,
    p.parent_product_id
  FROM products p
  WHERE p.company_id = target_company_id
    AND p.is_archived = false
  ORDER BY p.name ASC;
END;
$function$;
