-- Create product_competitor_documents table
CREATE TABLE IF NOT EXISTS public.product_competitor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  document_structure JSONB, -- AI-generated table of contents
  processing_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'analyzing', 'toc_generated', 'processing_sections', 'completed', 'failed')),
  error_message TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_sections table
CREATE TABLE IF NOT EXISTS public.document_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.product_competitor_documents(id) ON DELETE CASCADE,
  section_title TEXT NOT NULL,
  section_type TEXT, -- e.g., 'competitive_landscape', 'market_overview', 'financial_analysis'
  page_start INTEGER NOT NULL,
  page_end INTEGER NOT NULL,
  extraction_status TEXT NOT NULL DEFAULT 'identified' CHECK (extraction_status IN ('identified', 'extracting', 'extracted', 'parsed', 'failed')),
  extracted_text TEXT,
  extracted_data JSONB, -- Structured data extracted from this section
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_manual_competitors table
CREATE TABLE IF NOT EXISTS public.product_manual_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_section_id UUID REFERENCES public.document_sections(id) ON DELETE SET NULL,
  competitor_company TEXT NOT NULL,
  product_name TEXT,
  material TEXT,
  area_of_focus TEXT,
  phase TEXT,
  regulatory_status TEXT,
  market TEXT,
  launch_date TEXT,
  notes TEXT,
  metadata JSONB, -- Additional flexible fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_competitor_docs_product ON public.product_competitor_documents(product_id);
CREATE INDEX IF NOT EXISTS idx_competitor_docs_company ON public.product_competitor_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_competitor_docs_status ON public.product_competitor_documents(processing_status);

CREATE INDEX IF NOT EXISTS idx_doc_sections_document ON public.document_sections(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_sections_status ON public.document_sections(extraction_status);

CREATE INDEX IF NOT EXISTS idx_manual_competitors_product ON public.product_manual_competitors(product_id);
CREATE INDEX IF NOT EXISTS idx_manual_competitors_company ON public.product_manual_competitors(company_id);
CREATE INDEX IF NOT EXISTS idx_manual_competitors_source ON public.product_manual_competitors(source_section_id);

-- Enable RLS
ALTER TABLE public.product_competitor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_manual_competitors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_competitor_documents
-- Users can view documents if they have access to the product's company
CREATE POLICY "Users can view documents for their company products"
  ON public.product_competitor_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id 
      AND p.company_id = product_competitor_documents.company_id
    )
  );

CREATE POLICY "Users can insert documents for their company products"
  ON public.product_competitor_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id 
      AND p.company_id = product_competitor_documents.company_id
    )
  );

CREATE POLICY "Users can update documents for their company products"
  ON public.product_competitor_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id 
      AND p.company_id = product_competitor_documents.company_id
    )
  );

CREATE POLICY "Users can delete documents for their company products"
  ON public.product_competitor_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id 
      AND p.company_id = product_competitor_documents.company_id
    )
  );

-- RLS Policies for document_sections
CREATE POLICY "Users can view sections for their company documents"
  ON public.document_sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_competitor_documents pcd
      JOIN public.products p ON p.id = pcd.product_id
      WHERE pcd.id = document_sections.document_id
      AND p.company_id = pcd.company_id
    )
  );

CREATE POLICY "Users can insert sections for their company documents"
  ON public.document_sections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_competitor_documents pcd
      JOIN public.products p ON p.id = pcd.product_id
      WHERE pcd.id = document_sections.document_id
      AND p.company_id = pcd.company_id
    )
  );

CREATE POLICY "Users can update sections for their company documents"
  ON public.document_sections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.product_competitor_documents pcd
      JOIN public.products p ON p.id = pcd.product_id
      WHERE pcd.id = document_sections.document_id
      AND p.company_id = pcd.company_id
    )
  );

CREATE POLICY "Users can delete sections for their company documents"
  ON public.document_sections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.product_competitor_documents pcd
      JOIN public.products p ON p.id = pcd.product_id
      WHERE pcd.id = document_sections.document_id
      AND p.company_id = pcd.company_id
    )
  );

-- RLS Policies for product_manual_competitors
CREATE POLICY "Users can view manual competitors for their company products"
  ON public.product_manual_competitors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id 
      AND p.company_id = product_manual_competitors.company_id
    )
  );

CREATE POLICY "Users can insert manual competitors for their company products"
  ON public.product_manual_competitors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id 
      AND p.company_id = product_manual_competitors.company_id
    )
  );

CREATE POLICY "Users can update manual competitors for their company products"
  ON public.product_manual_competitors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id 
      AND p.company_id = product_manual_competitors.company_id
    )
  );

CREATE POLICY "Users can delete manual competitors for their company products"
  ON public.product_manual_competitors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id 
      AND p.company_id = product_manual_competitors.company_id
    )
  );

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_product_competitor_documents_updated_at
  BEFORE UPDATE ON public.product_competitor_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_document_sections_updated_at
  BEFORE UPDATE ON public.document_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_product_manual_competitors_updated_at
  BEFORE UPDATE ON public.product_manual_competitors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();