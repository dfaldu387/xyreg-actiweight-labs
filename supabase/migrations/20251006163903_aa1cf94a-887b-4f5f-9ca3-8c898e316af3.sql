-- Create data_rooms table
CREATE TABLE public.data_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  access_start_date DATE,
  access_end_date DATE,
  branding_logo_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_data_rooms_company_id ON public.data_rooms(company_id);
CREATE INDEX idx_data_rooms_status ON public.data_rooms(status);

-- Create data_room_access table
CREATE TABLE public.data_room_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_room_id UUID NOT NULL REFERENCES public.data_rooms(id) ON DELETE CASCADE,
  investor_email TEXT NOT NULL,
  investor_name TEXT,
  investor_organization TEXT,
  access_level TEXT NOT NULL DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'limited_viewer')),
  can_download BOOLEAN NOT NULL DEFAULT false,
  access_granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  access_expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  access_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_data_room_access_data_room_id ON public.data_room_access(data_room_id);
CREATE INDEX idx_data_room_access_token ON public.data_room_access(access_token);
CREATE INDEX idx_data_room_access_status ON public.data_room_access(status);
CREATE INDEX idx_data_room_access_email ON public.data_room_access(investor_email);

-- Create data_room_content table
CREATE TABLE public.data_room_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_room_id UUID NOT NULL REFERENCES public.data_rooms(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('product_overview', 'financials', 'strategic_plans', 'custom_document')),
  content_source TEXT NOT NULL DEFAULT 'manual_upload',
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  document_title TEXT NOT NULL,
  document_description TEXT,
  file_path TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_data_room_content_data_room_id ON public.data_room_content(data_room_id);
CREATE INDEX idx_data_room_content_display_order ON public.data_room_content(data_room_id, display_order);

-- Create data_room_activity_log table
CREATE TABLE public.data_room_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_room_id UUID NOT NULL REFERENCES public.data_rooms(id) ON DELETE CASCADE,
  investor_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'view_content', 'download', 'logout')),
  content_id UUID REFERENCES public.data_room_content(id) ON DELETE SET NULL,
  content_title TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_data_room_activity_log_data_room_id ON public.data_room_activity_log(data_room_id);
CREATE INDEX idx_data_room_activity_log_timestamp ON public.data_room_activity_log(timestamp DESC);
CREATE INDEX idx_data_room_activity_log_investor ON public.data_room_activity_log(investor_email);

-- Enable RLS
ALTER TABLE public.data_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_room_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_room_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_room_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_rooms
CREATE POLICY "Admin and business users can manage data rooms"
ON public.data_rooms FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM public.user_company_access
    WHERE user_id = auth.uid()
    AND access_level IN ('admin', 'business')
  )
);

CREATE POLICY "All company users can view data rooms"
ON public.data_rooms FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.user_company_access
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for data_room_access
CREATE POLICY "Admin and business users manage investor access"
ON public.data_room_access FOR ALL
USING (
  data_room_id IN (
    SELECT dr.id FROM public.data_rooms dr
    WHERE dr.company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'business')
    )
  )
);

-- RLS Policies for data_room_content
CREATE POLICY "Admin and business users manage content"
ON public.data_room_content FOR ALL
USING (
  data_room_id IN (
    SELECT dr.id FROM public.data_rooms dr
    WHERE dr.company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'business')
    )
  )
);

-- RLS Policies for data_room_activity_log
CREATE POLICY "Admin and business users view activity logs"
ON public.data_room_activity_log FOR SELECT
USING (
  data_room_id IN (
    SELECT dr.id FROM public.data_rooms dr
    WHERE dr.company_id IN (
      SELECT company_id FROM public.user_company_access
      WHERE user_id = auth.uid()
      AND access_level IN ('admin', 'business')
    )
  )
);

CREATE POLICY "System can insert activity logs"
ON public.data_room_activity_log FOR INSERT
WITH CHECK (true);

-- Create storage bucket for data room documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'data-room-documents',
  'data-room-documents',
  false,
  52428800,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'image/jpeg', 'image/png']
);

-- RLS policy for storage uploads (admin/business only)
CREATE POLICY "Admin and business users can upload data room documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'data-room-documents'
  AND auth.uid() IN (
    SELECT uca.user_id FROM public.user_company_access uca
    WHERE uca.access_level IN ('admin', 'business')
  )
);

-- RLS policy for storage access
CREATE POLICY "Admin and business users can view all data room documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'data-room-documents'
  AND auth.uid() IN (
    SELECT uca.user_id FROM public.user_company_access uca
    WHERE uca.access_level IN ('admin', 'business')
  )
);

-- RLS policy for storage deletion
CREATE POLICY "Admin and business users can delete data room documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'data-room-documents'
  AND auth.uid() IN (
    SELECT uca.user_id FROM public.user_company_access uca
    WHERE uca.access_level IN ('admin', 'business')
  )
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_data_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_data_rooms_updated_at
BEFORE UPDATE ON public.data_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_data_rooms_updated_at();