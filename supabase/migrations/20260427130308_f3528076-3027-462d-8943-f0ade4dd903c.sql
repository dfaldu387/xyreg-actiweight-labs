CREATE TABLE qms_sop_manual_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sop_number TEXT NOT NULL,
  document_id UUID NOT NULL REFERENCES phase_assigned_document_template(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(company_id, sop_number)
);

ALTER TABLE qms_sop_manual_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view manual SOP links for their companies"
ON qms_sop_manual_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_company_access
    WHERE user_company_access.company_id = qms_sop_manual_links.company_id
    AND user_company_access.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage manual SOP links for their companies"
ON qms_sop_manual_links FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_company_access
    WHERE user_company_access.company_id = qms_sop_manual_links.company_id
    AND user_company_access.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_access
    WHERE user_company_access.company_id = qms_sop_manual_links.company_id
    AND user_company_access.user_id = auth.uid()
  )
);

CREATE INDEX idx_qms_sop_manual_links_company ON qms_sop_manual_links(company_id);
CREATE INDEX idx_qms_sop_manual_links_lookup ON qms_sop_manual_links(company_id, sop_number);