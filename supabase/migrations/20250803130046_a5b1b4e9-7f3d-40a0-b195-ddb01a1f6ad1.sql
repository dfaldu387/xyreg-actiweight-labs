-- Grant permissions for the service role to access the eudamed schema
GRANT USAGE ON SCHEMA eudamed TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA eudamed TO service_role;
GRANT SELECT ON eudamed.emdn_codes TO service_role;

-- Also grant to authenticated users (for the frontend)
GRANT USAGE ON SCHEMA eudamed TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA eudamed TO authenticated;
GRANT SELECT ON eudamed.emdn_codes TO authenticated;