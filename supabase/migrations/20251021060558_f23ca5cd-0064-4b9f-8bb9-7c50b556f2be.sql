-- Create roles table for dynamic role management
CREATE TABLE IF NOT EXISTS public.company_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL,
  role_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'shield',
  color TEXT DEFAULT 'bg-blue-100 text-blue-800',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, role_key)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  permission_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon_name TEXT DEFAULT 'lock',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, permission_key)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.company_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Enable RLS
ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_roles
CREATE POLICY "Users can view roles for their companies"
  ON public.company_roles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage roles for their companies"
  ON public.company_roles FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid() AND access_level = 'admin'
    )
  );

-- RLS Policies for permissions
CREATE POLICY "Users can view permissions for their companies"
  ON public.permissions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage permissions for their companies"
  ON public.permissions FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid() AND access_level = 'admin'
    )
  );

-- RLS Policies for role_permissions
CREATE POLICY "Users can view role permissions for their companies"
  ON public.role_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_roles
      WHERE company_roles.id = role_permissions.role_id
      AND company_roles.company_id IN (
        SELECT company_id FROM public.user_company_access 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage role permissions for their companies"
  ON public.role_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.company_roles
      WHERE company_roles.id = role_permissions.role_id
      AND company_roles.company_id IN (
        SELECT company_id FROM public.user_company_access 
        WHERE user_id = auth.uid() AND access_level = 'admin'
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_roles_company_id ON public.company_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_permissions_company_id ON public.permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_role_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_company_roles_updated_at
  BEFORE UPDATE ON public.company_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_role_updated_at();

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_role_updated_at();