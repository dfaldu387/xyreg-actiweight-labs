-- Create product_user_access table for managing user permissions on products
CREATE TABLE IF NOT EXISTS public.product_user_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL DEFAULT 'viewer',
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of product and user
    UNIQUE(product_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_user_access_product_id ON public.product_user_access(product_id);
CREATE INDEX IF NOT EXISTS idx_product_user_access_user_id ON public.product_user_access(user_id);
CREATE INDEX IF NOT EXISTS idx_product_user_access_role_id ON public.product_user_access(role_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.product_user_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own access records
CREATE POLICY "Users can view their own product access" ON public.product_user_access
    FOR SELECT USING (auth.uid() = user_id);

-- Company admins can view all access records for their products
CREATE POLICY "Company admins can view product user access" ON public.product_user_access
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.user_company_access uca ON p.company_id = uca.company_id
            WHERE p.id = product_user_access.product_id
            AND uca.user_id = auth.uid()
            AND uca.access_level IN ('admin', 'owner')
        )
    );

-- Company admins can insert access records for their products
CREATE POLICY "Company admins can insert product user access" ON public.product_user_access
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.user_company_access uca ON p.company_id = uca.company_id
            WHERE p.id = product_user_access.product_id
            AND uca.user_id = auth.uid()
            AND uca.access_level IN ('admin', 'owner')
        )
    );

-- Company admins can update access records for their products
CREATE POLICY "Company admins can update product user access" ON public.product_user_access
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.user_company_access uca ON p.company_id = uca.company_id
            WHERE p.id = product_user_access.product_id
            AND uca.user_id = auth.uid()
            AND uca.access_level IN ('admin', 'owner')
        )
    );

-- Company admins can delete access records for their products
CREATE POLICY "Company admins can delete product user access" ON public.product_user_access
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.user_company_access uca ON p.company_id = uca.company_id
            WHERE p.id = product_user_access.product_id
            AND uca.user_id = auth.uid()
            AND uca.access_level IN ('admin', 'owner')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_user_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_product_user_access_updated_at
    BEFORE UPDATE ON public.product_user_access
    FOR EACH ROW
    EXECUTE FUNCTION update_product_user_access_updated_at();

-- Insert some default roles data (optional - can be managed through the UI)
INSERT INTO public.product_user_access (product_id, user_id, role_id, permissions)
SELECT 
    p.id as product_id,
    uca.user_id,
    CASE 
        WHEN uca.access_level = 'admin' THEN 'super-admin'
        WHEN uca.access_level = 'editor' THEN 'editor'
        ELSE 'viewer'
    END as role_id,
    CASE 
        WHEN uca.access_level = 'admin' THEN ARRAY['full']
        WHEN uca.access_level = 'editor' THEN ARRAY['read', 'write']
        ELSE ARRAY['read']
    END as permissions
FROM public.products p
JOIN public.user_company_access uca ON p.company_id = uca.company_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.product_user_access pua 
    WHERE pua.product_id = p.id AND pua.user_id = uca.user_id
)
ON CONFLICT (product_id, user_id) DO NOTHING;
