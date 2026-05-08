DO $$
DECLARE
  v_company uuid := 'f3b39a35-4848-4738-ae29-91cfb8d72896';
  v_map jsonb := '{
    "001":"QA","002":"QA","003":"QA","004":"QA","021":"QA","022":"QA","023":"QA",
    "024":"QA","025":"QA","028":"QA","031":"QA","032":"QA","033":"QA","042":"QA","050":"QA",
    "005":"DE","006":"DE","007":"DE","008":"DE","009":"DE","011":"DE","012":"DE",
    "019":"DE","026":"DE","027":"DE","029":"DE","045":"DE","049":"DE",
    "015":"RM",
    "014":"CL","047":"CL","048":"CL",
    "013":"RA","034":"RA","035":"RA","036":"RA","037":"RA","038":"RA","044":"RA","046":"RA",
    "010":"MF","017":"MF","018":"MF","020":"MF","039":"MF","040":"MF","041":"MF","051":"MF",
    "016":"SC","030":"SC","043":"SC"
  }'::jsonb;
  r record;
  v_num text;
  v_sub text;
  v_rest text;
BEGIN
  -- 1. Delete title-mismatched rows
  DELETE FROM phase_assigned_document_template
  WHERE company_id = v_company
    AND name IN (
      'SOP-005 Internal Audits',
      'SOP-006 Training and Competence',
      'SOP-007 Risk Management',
      'SOP-011 Control of Nonconforming Product',
      'SOP-026 Biocompatibility Evaluation',
      'SOP-036 Technical Documentation Management'
    );

  -- 2. Convert SOP-NNN ... → SOP-XX-NNN ... in name and document_number
  FOR r IN
    SELECT id, name, document_number
    FROM phase_assigned_document_template
    WHERE company_id = v_company
      AND name ~ '^SOP-\d{3}(\s|$)'
  LOOP
    v_num := substring(r.name from '^SOP-(\d{3})');
    v_sub := v_map->>v_num;
    IF v_sub IS NULL THEN CONTINUE; END IF;
    v_rest := substring(r.name from '^SOP-\d{3}(.*)$');
    UPDATE phase_assigned_document_template
    SET name = 'SOP-' || v_sub || '-' || v_num || COALESCE(v_rest, ''),
        document_number = 'SOP-' || v_sub || '-' || v_num
    WHERE id = r.id;
  END LOOP;

  -- 3. Backfill document_number for already-3-part names
  UPDATE phase_assigned_document_template
  SET document_number = substring(name from '^(SOP-[A-Z]{2}-\d{3})')
  WHERE company_id = v_company
    AND name ~ '^SOP-[A-Z]{2}-\d{3}'
    AND (document_number IS NULL OR document_number !~ '^SOP-[A-Z]{2}-\d{3}');

  -- 4. De-dupe by name, keep newest
  DELETE FROM phase_assigned_document_template a
  USING phase_assigned_document_template b
  WHERE a.company_id = v_company
    AND b.company_id = v_company
    AND a.name = b.name
    AND a.id <> b.id
    AND (a.updated_at, a.id) < (b.updated_at, b.id);

  -- 5. Force document_type = SOP
  UPDATE phase_assigned_document_template
  SET document_type = 'SOP'
  WHERE company_id = v_company
    AND name ~* '^SOP-'
    AND document_type <> 'SOP';
END $$;