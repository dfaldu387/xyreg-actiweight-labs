ALTER TABLE public.user_document_permissions
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS override_product_permissions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_internal_reviewer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_external_reviewer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active_reviewer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS review_scope TEXT,
ADD COLUMN IF NOT EXISTS review_deadline TIMESTAMPTZ;