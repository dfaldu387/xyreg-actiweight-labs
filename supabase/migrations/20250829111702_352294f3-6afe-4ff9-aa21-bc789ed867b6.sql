-- Enable RLS on key tables that have policies but RLS disabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifecycle_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_assigned_document_template ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for documents table
CREATE POLICY "Users can view documents for accessible companies" 
ON public.documents 
FOR SELECT 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create documents for accessible companies" 
ON public.documents 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update documents for accessible companies" 
ON public.documents 
FOR UPDATE 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete documents for accessible companies" 
ON public.documents 
FOR DELETE 
USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level IN ('admin', 'editor')
  )
);

-- Add RLS policies for lifecycle_phases table  
CREATE POLICY "Users can view lifecycle phases for accessible products"
ON public.lifecycle_phases
FOR SELECT
USING (
  product_id IN (
    SELECT p.id 
    FROM products p
    WHERE p.company_id IN (
      SELECT user_company_access.company_id
      FROM user_company_access
      WHERE user_company_access.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can manage lifecycle phases for accessible products"
ON public.lifecycle_phases
FOR ALL
USING (
  product_id IN (
    SELECT p.id 
    FROM products p
    WHERE p.company_id IN (
      SELECT user_company_access.company_id
      FROM user_company_access
      WHERE user_company_access.user_id = auth.uid() 
      AND user_company_access.access_level IN ('admin', 'editor')
    )
  )
)
WITH CHECK (
  product_id IN (
    SELECT p.id 
    FROM products p
    WHERE p.company_id IN (
      SELECT user_company_access.company_id
      FROM user_company_access
      WHERE user_company_access.user_id = auth.uid() 
      AND user_company_access.access_level IN ('admin', 'editor')
    )
  )
);

-- Add RLS policies for phase_assigned_document_template table
CREATE POLICY "Users can view phase templates for accessible companies"
ON public.phase_assigned_document_template
FOR SELECT
USING (
  phase_id IN (
    SELECT cp.id 
    FROM company_phases cp
    WHERE cp.company_id IN (
      SELECT user_company_access.company_id
      FROM user_company_access
      WHERE user_company_access.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can manage phase templates for accessible companies"
ON public.phase_assigned_document_template
FOR ALL
USING (
  phase_id IN (
    SELECT cp.id 
    FROM company_phases cp
    WHERE cp.company_id IN (
      SELECT user_company_access.company_id
      FROM user_company_access
      WHERE user_company_access.user_id = auth.uid() 
      AND user_company_access.access_level IN ('admin', 'editor')
    )
  )
)
WITH CHECK (
  phase_id IN (
    SELECT cp.id 
    FROM company_phases cp
    WHERE cp.company_id IN (
      SELECT user_company_access.company_id
      FROM user_company_access
      WHERE user_company_access.user_id = auth.uid() 
      AND user_company_access.access_level IN ('admin', 'editor')
    )
  )
);