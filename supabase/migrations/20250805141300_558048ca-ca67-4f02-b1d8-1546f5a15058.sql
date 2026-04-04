-- Grant USAGE permission on eudamed schema to authenticator role
GRANT USAGE ON SCHEMA eudamed TO authenticator;

-- Grant table permissions on eudamed_device_registry to authenticator role
GRANT SELECT, INSERT, UPDATE, DELETE ON eudamed.eudamed_device_registry TO authenticator;

-- Grant table permissions on eudamed_device_registry to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON eudamed.eudamed_device_registry TO authenticated;