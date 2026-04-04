-- Grant the authenticated user access to Widex A/S company
INSERT INTO public.user_company_access (user_id, company_id, access_level, created_at, updated_at)
SELECT 
    'ae396acb-2acd-4db1-87b5-b5875451d949'::uuid as user_id,
    c.id as company_id,
    'admin'::user_role_type as access_level,
    now() as created_at,
    now() as updated_at
FROM companies c 
WHERE c.name = 'Widex A/S'
ON CONFLICT (user_id, company_id) DO NOTHING;