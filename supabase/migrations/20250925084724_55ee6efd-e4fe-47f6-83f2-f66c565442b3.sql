-- Create eudamed_sync_status table for tracking sync operations
CREATE TABLE IF NOT EXISTS public.eudamed_sync_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  total_eudamed_devices INTEGER DEFAULT 0,
  total_company_products INTEGER DEFAULT 0,
  duplicates_found INTEGER DEFAULT 0,
  duplicates_merged INTEGER DEFAULT 0,
  new_products_created INTEGER DEFAULT 0,
  sync_status TEXT DEFAULT 'never_synced',
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.eudamed_sync_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view sync status for their companies" 
ON public.eudamed_sync_status 
FOR SELECT 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create sync status for their companies" 
ON public.eudamed_sync_status 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update sync status for their companies" 
ON public.eudamed_sync_status 
FOR UPDATE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_eudamed_sync_status_updated_at
BEFORE UPDATE ON public.eudamed_sync_status
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();