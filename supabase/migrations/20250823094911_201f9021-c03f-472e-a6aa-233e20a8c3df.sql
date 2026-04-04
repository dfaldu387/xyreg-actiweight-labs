-- Add consultant role to user_role_type enum
ALTER TYPE user_role_type ADD VALUE 'consultant';

-- Update any existing check constraints or policies that reference the role types
-- This ensures consistency across the system