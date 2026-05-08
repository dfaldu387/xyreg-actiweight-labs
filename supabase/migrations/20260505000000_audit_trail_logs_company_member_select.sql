-- Widen the audit_trail_logs SELECT policy so every member of a company
-- (not only admins) can read audit entries for that company.
-- Previously, only admins or the originating user could see entries, which
-- meant a non-admin reviewer (e.g. the regulatory reviewer on a CCR) could
-- not see audit rows produced by other reviewers' approval signatures.
-- Audit-log rows are append-only and reviewers need each other's actions
-- visible to do their job, so we open up SELECT to all company members.

DROP POLICY IF EXISTS "Company admins can read audit trail" ON public.audit_trail_logs;
DROP POLICY IF EXISTS "Company members can read audit trail" ON public.audit_trail_logs;

CREATE POLICY "Company members can read audit trail"
  ON public.audit_trail_logs FOR SELECT
  USING (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca
      WHERE uca.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );
