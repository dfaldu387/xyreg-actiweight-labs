-- Create product_user_access table
CREATE TABLE IF NOT EXISTS public.product_user_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type VARCHAR(50) NOT NULL DEFAULT 'guest' CHECK (user_type IN ('owner', 'admin', 'manager', 'editor', 'viewer', 'reviewer', 'guest')),
    role_id UUID REFERENCES public.role_permissions(id) ON DELETE SET NULL,
    role_name VARCHAR(100),
    permissions JSONB DEFAULT '{}',
    access_level VARCHAR(20) DEFAULT 'read' CHECK (access_level IN ('none', 'read', 'write', 'full')),
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_user_access_product_id ON public.product_user_access(product_id);
CREATE INDEX IF NOT EXISTS idx_product_user_access_user_id ON public.product_user_access(user_id);
CREATE INDEX IF NOT EXISTS idx_product_user_access_user_type ON public.product_user_access(user_type);
CREATE INDEX IF NOT EXISTS idx_product_user_access_role_id ON public.product_user_access(role_id);
CREATE INDEX IF NOT EXISTS idx_product_user_access_is_active ON public.product_user_access(is_active);
CREATE INDEX IF NOT EXISTS idx_product_user_access_invited_by ON public.product_user_access(invited_by);

-- Create composite indexes
CREATE INDEX IF NOT EXISTS idx_product_user_access_product_user ON public.product_user_access(product_id, user_id);
CREATE INDEX IF NOT EXISTS idx_product_user_access_product_active ON public.product_user_access(product_id, is_active);

-- Create unique constraint to prevent duplicate access entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_user_access_unique ON public.product_user_access(product_id, user_id) 
WHERE is_active = true;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_user_access_updated_at 
    BEFORE UPDATE ON public.product_user_access 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.product_user_access ENABLE ROW LEVEL SECURITY;





-- Add comments for documentation
COMMENT ON TABLE public.product_user_access IS 'Manages user access permissions for products';
COMMENT ON COLUMN public.product_user_access.id IS 'Unique identifier for the access record';
COMMENT ON COLUMN public.product_user_access.product_id IS 'Reference to the product';
COMMENT ON COLUMN public.product_user_access.user_id IS 'Reference to the user';
COMMENT ON COLUMN public.product_user_access.user_type IS 'Type of user access (owner, admin, manager, editor, viewer, reviewer, guest)';
COMMENT ON COLUMN public.product_user_access.role_id IS 'Reference to the role template';
COMMENT ON COLUMN public.product_user_access.role_name IS 'Name of the role for quick reference';
COMMENT ON COLUMN public.product_user_access.permissions IS 'JSON object containing specific permissions';
COMMENT ON COLUMN public.product_user_access.access_level IS 'Overall access level (none, read, write, full)';
COMMENT ON COLUMN public.product_user_access.is_active IS 'Whether the access is currently active';
COMMENT ON COLUMN public.product_user_access.invited_by IS 'User who granted this access';
COMMENT ON COLUMN public.product_user_access.invited_at IS 'When the access was granted';
COMMENT ON COLUMN public.product_user_access.last_accessed_at IS 'Last time the user accessed the product';
COMMENT ON COLUMN public.product_user_access.expires_at IS 'When the access expires (optional)';
COMMENT ON COLUMN public.product_user_access.notes IS 'Additional notes about the access';
COMMENT ON COLUMN public.product_user_access.created_at IS 'When the record was created';
COMMENT ON COLUMN public.product_user_access.updated_at IS 'When the record was last updated';
