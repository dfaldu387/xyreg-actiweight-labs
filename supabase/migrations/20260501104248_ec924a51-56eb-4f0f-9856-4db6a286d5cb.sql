DELETE FROM public.phase_assigned_document_template
WHERE id IN (
  'db07c1ff-25cd-427b-8906-ca8ce24d540c', -- duplicate SOP-004 "Personnel and Training"
  '52fcc983-1a63-4250-8ac1-9362ead22ed1', -- duplicate SOP-005 "Design and Development Planning"
  '06e39a9f-6b1c-47d0-8c14-3024add20233', -- duplicate SOP-012 "Design History File / Technical Documentation"
  '58abd823-a2dd-4eec-b628-d90d148b183b'  -- duplicate SOP-016 "Supplier Evaluation and Control"
)
AND company_id = '6e4ca2bb-5895-4b49-9c2d-ae1c52250c2f';