-- Create market_reports table for Market Intelligence module
CREATE TABLE market_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  report_date DATE,
  description TEXT,
  file_storage_path TEXT, -- Supabase storage URL
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by_user_id UUID NOT NULL,
  upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'Uploaded' CHECK (status IN ('Uploaded', 'Processing', 'Processed', 'Error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE market_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for market_reports
CREATE POLICY "Users can view market reports for their companies" 
ON market_reports 
FOR SELECT 
USING (company_id IN (
  SELECT company_id 
  FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create market reports for their companies" 
ON market_reports 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id 
  FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update market reports for their companies" 
ON market_reports 
FOR UPDATE 
USING (company_id IN (
  SELECT company_id 
  FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete market reports for their companies" 
ON market_reports 
FOR DELETE 
USING (company_id IN (
  SELECT company_id 
  FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

-- Create storage bucket for market intelligence reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'market-intelligence-reports',
  'market-intelligence-reports',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create storage policies for market intelligence reports bucket
CREATE POLICY "Users can view market intelligence files for their companies"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'market-intelligence-reports' 
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload market intelligence files for their companies"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'market-intelligence-reports' 
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete market intelligence files for their companies"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'market-intelligence-reports' 
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_market_reports_updated_at
  BEFORE UPDATE ON market_reports
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();