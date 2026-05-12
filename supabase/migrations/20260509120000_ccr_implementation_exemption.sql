-- CCR Implementation Exemption
-- ----------------------------------------------------------------------------
-- Authors can request to bypass the "all linked documents must be approved"
-- gate that locks the Mark Implemented button on an Approved CCR. The author
-- picks the specific un-approved document(s) the exemption should cover and
-- (optionally) leaves notes for the admin. A company admin reviews and
-- approves or rejects. An approved exemption only excuses the listed docs;
-- any other un-approved linked doc still locks the gate. The CCR status
-- itself does not change. All field changes are captured by the existing
-- audit trigger on change_control_requests.

ALTER TABLE public.change_control_requests
  ADD COLUMN IF NOT EXISTS exemption_status        TEXT,
  ADD COLUMN IF NOT EXISTS exemption_description   TEXT,
  ADD COLUMN IF NOT EXISTS exemption_document_ids  JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS exemption_requested_by  UUID,
  ADD COLUMN IF NOT EXISTS exemption_requested_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS exemption_reviewed_by   UUID,
  ADD COLUMN IF NOT EXISTS exemption_reviewed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS exemption_review_reason TEXT;

ALTER TABLE public.change_control_requests
  DROP CONSTRAINT IF EXISTS change_control_requests_exemption_status_check;

ALTER TABLE public.change_control_requests
  ADD CONSTRAINT change_control_requests_exemption_status_check
  CHECK (exemption_status IS NULL OR exemption_status IN ('requested','approved','rejected'));

CREATE INDEX IF NOT EXISTS idx_ccr_exemption_status
  ON public.change_control_requests(exemption_status)
  WHERE exemption_status IS NOT NULL;
