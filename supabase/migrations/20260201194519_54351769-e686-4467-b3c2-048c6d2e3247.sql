-- Table 1: Link SOPs to QMS Nodes (many-to-many)
CREATE TABLE qms_node_sop_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL, -- e.g., 'mgmt-resp', 'capa-loop'
  document_id UUID NOT NULL REFERENCES phase_assigned_document_template(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(company_id, node_id, document_id)
);

-- Table 2: Company-specific internal process content
CREATE TABLE qms_node_internal_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  process_description TEXT,
  process_steps JSONB, -- Array of step objects: [{step: number, description: string}]
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE(company_id, node_id)
);

-- Enable RLS on both tables
ALTER TABLE qms_node_sop_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE qms_node_internal_processes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qms_node_sop_links
CREATE POLICY "Users can view SOP links for their companies"
ON qms_node_sop_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_company_access
    WHERE user_company_access.company_id = qms_node_sop_links.company_id
    AND user_company_access.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage SOP links for their companies"
ON qms_node_sop_links FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_company_access
    WHERE user_company_access.company_id = qms_node_sop_links.company_id
    AND user_company_access.user_id = auth.uid()
  )
);

-- RLS Policies for qms_node_internal_processes
CREATE POLICY "Users can view internal processes for their companies"
ON qms_node_internal_processes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_company_access
    WHERE user_company_access.company_id = qms_node_internal_processes.company_id
    AND user_company_access.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage internal processes for their companies"
ON qms_node_internal_processes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_company_access
    WHERE user_company_access.company_id = qms_node_internal_processes.company_id
    AND user_company_access.user_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_qms_node_sop_links_company ON qms_node_sop_links(company_id);
CREATE INDEX idx_qms_node_sop_links_node ON qms_node_sop_links(company_id, node_id);
CREATE INDEX idx_qms_node_internal_processes_company ON qms_node_internal_processes(company_id);
CREATE INDEX idx_qms_node_internal_processes_node ON qms_node_internal_processes(company_id, node_id);