UPDATE phase_assigned_document_template t
SET change_control_ref = c.ccr_id
FROM change_control_requests c
WHERE c.id = '14223509-2658-48cd-a496-94f06eba89cb'
  AND t.id::text IN (SELECT jsonb_array_elements_text(c.affected_documents))
  AND (t.change_control_ref IS NULL OR t.change_control_ref <> c.ccr_id);