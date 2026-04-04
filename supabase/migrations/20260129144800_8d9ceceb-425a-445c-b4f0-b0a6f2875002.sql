
-- Insert 5 sample CAPA records with realistic medical device data
INSERT INTO capa_records (
  company_id, product_id, capa_id, source_type, capa_type,
  problem_description, immediate_correction,
  severity, probability, status, rca_methodology,
  root_cause_category, root_cause_summary, rca_data,
  technical_approved, quality_approved,
  target_investigation_date, target_implementation_date, target_verification_date, target_closure_date,
  created_by, created_at
) VALUES 
-- CAPA-1: Electrode Coating Audit Finding (Investigation)
(
  '3f8646fd-cbf6-444c-af72-e2d05b11e4a1',
  '37510f9b-91db-4451-969d-7ab9de52cc06',
  'CAPA-2026-0001', 'audit', 'corrective',
  'During ISO 13485:2016 surveillance audit, auditor identified that gold plating thickness measurements on electrodes showed +/- 15% variance, exceeding the 10% specification limit. Affected lots: LOT-2026-0047, LOT-2026-0048. Finding reference: NC-2026-004.',
  'Quarantined affected lots (LOT-2026-0047, LOT-2026-0048). Implemented 100% inspection of plating thickness until root cause identified.',
  3, 3, 'investigation', 'fishbone',
  'equipment', 'Plating bath temperature sensor drift causing inconsistent deposition rates',
  '{"methodology": "fishbone", "categories": {"man": ["Operator training on plating parameters inconsistent", "Night shift operators less experienced"], "machine": ["Temperature sensor showing 2°C drift", "Plating bath agitator speed variation"], "method": ["No statistical process control on thickness", "Sampling frequency insufficient"], "material": ["Gold solution concentration variability between batches"], "measurement": ["Thickness gauge last calibrated 6 months ago"], "environment": ["Ambient temperature fluctuation in plating room"]}, "rootCause": "Temperature sensor drift causing inconsistent plating bath temperature, leading to variable gold deposition rates", "createdAt": "2026-01-15T10:00:00Z", "updatedAt": "2026-01-20T14:30:00Z"}',
  true, false,
  '2026-02-01', '2026-02-28', '2026-03-15', '2026-03-31',
  '809b22af-bdc7-4315-be29-b6dac5126558', '2026-01-10T09:00:00Z'
),
-- CAPA-2: Signal Loss in High Humidity (Planning)
(
  '3f8646fd-cbf6-444c-af72-e2d05b11e4a1',
  '37510f9b-91db-4451-969d-7ab9de52cc06',
  'CAPA-2026-0002', 'complaint', 'both',
  'Three customer complaints (CMPL-2026-012, CMPL-2026-015, CMPL-2026-018) received regarding intermittent EEG signal dropouts when device used in humid OR environments (>60% RH). Affects patient monitoring during surgery. No patient harm reported.',
  'Issued field safety notice to affected customers recommending environmental controls. Provided replacement units with silicone-sealed connectors.',
  4, 2, 'planning', '5_whys',
  'design', 'Connector seal material degrades in high humidity, allowing moisture ingress',
  '{"methodology": "5_whys", "problemStatement": "EEG signal dropouts occur intermittently in humid OR environments", "whyChain": [{"level": 1, "question": "Why are signal dropouts occurring?", "answer": "Moisture is entering the connector interface"}, {"level": 2, "question": "Why is moisture entering the connector?", "answer": "The connector seal is not providing adequate protection"}, {"level": 3, "question": "Why is the seal inadequate?", "answer": "The rubber seal material has degraded over time"}, {"level": 4, "question": "Why has the seal material degraded?", "answer": "The current seal material (EPDM) absorbs moisture and swells in humid environments"}, {"level": 5, "question": "Why was EPDM selected?", "answer": "Design selection was based on cost without humidity stress testing"}], "rootCause": "Connector seal material (EPDM) absorbs moisture in high-humidity environments, causing swelling and degraded seal performance", "createdAt": "2026-01-18T11:00:00Z", "updatedAt": "2026-01-25T16:00:00Z"}',
  true, true,
  '2026-01-25', '2026-03-01', '2026-03-15', '2026-04-01',
  '809b22af-bdc7-4315-be29-b6dac5126558', '2026-01-12T14:00:00Z'
),
-- CAPA-3: Supplier Qualification (Draft)
(
  '3f8646fd-cbf6-444c-af72-e2d05b11e4a1',
  NULL,
  'CAPA-2026-0003', 'internal', 'preventive',
  'Internal QA review identified that supplier qualification process SOP-005 lacks specific acceptance criteria for critical component suppliers. No scoring rubric exists for evaluating supplier quality systems. This could lead to inconsistent supplier approval decisions.',
  NULL,
  2, 3, 'draft', NULL,
  NULL, NULL, NULL,
  false, false,
  '2026-02-15', '2026-03-15', '2026-04-01', '2026-04-15',
  '809b22af-bdc7-4315-be29-b6dac5126558', '2026-01-20T10:00:00Z'
),
-- CAPA-4: Labeling NCR (Verification)
(
  '3f8646fd-cbf6-444c-af72-e2d05b11e4a1',
  '37510f9b-91db-4451-969d-7ab9de52cc06',
  'CAPA-2026-0004', 'ncr', 'corrective',
  'Production QC identified labels on lots LOT-2026-0052 and LOT-2026-0053 missing IFU document reference number as required by EU MDR Article 10(11). NCR reference: NCR-2026-018. 500 units affected, none shipped.',
  'Quarantined affected lots. Initiated re-labeling process with corrected labels.',
  3, 4, 'verification', 'fishbone',
  'process', 'Label template update process did not include regulatory review step',
  '{"methodology": "fishbone", "categories": {"man": ["Label designer unfamiliar with MDR requirements"], "machine": [], "method": ["No regulatory review checkpoint in label change process", "Document control procedure gap"], "material": [], "measurement": ["Label verification checklist incomplete"], "environment": []}, "rootCause": "Label template change process lacks mandatory regulatory compliance review step", "createdAt": "2026-01-08T09:00:00Z", "updatedAt": "2026-01-22T11:00:00Z"}',
  true, true,
  '2026-01-15', '2026-01-22', '2026-02-05', '2026-02-15',
  '809b22af-bdc7-4315-be29-b6dac5126558', '2026-01-05T08:00:00Z'
),
-- CAPA-5: Packaging Damage (Closed)
(
  '3f8646fd-cbf6-444c-af72-e2d05b11e4a1',
  NULL,
  'CAPA-2026-0005', 'pms_event', 'both',
  'PMS trending analysis showed 8% increase in product returns citing "damaged on arrival" in Q4 2025 compared to Q3 baseline. Root cause investigation revealed shipping box inner cushion specification was changed by supplier without notification (supplier change control failure).',
  'Temporarily switched to alternate qualified supplier for cushioning material. Initiated supplier audit.',
  2, 3, 'closed', '5_whys',
  'material', 'Supplier changed cushion material specification without customer notification',
  '{"methodology": "5_whys", "problemStatement": "Product damage on arrival increased by 8% in Q4 2025", "whyChain": [{"level": 1, "question": "Why are products arriving damaged?", "answer": "Inner cushioning is not providing adequate protection"}, {"level": 2, "question": "Why is cushioning inadequate?", "answer": "Cushion material density is lower than specification"}, {"level": 3, "question": "Why is density lower?", "answer": "Supplier changed foam formulation"}, {"level": 4, "question": "Why did supplier change formulation?", "answer": "Cost reduction initiative without customer notification"}, {"level": 5, "question": "Why was there no notification?", "answer": "Supplier agreement did not require change notification for packaging materials"}], "rootCause": "Supplier changed cushion material specification as cost reduction measure without customer notification due to gap in supplier agreement", "createdAt": "2025-11-15T10:00:00Z", "updatedAt": "2026-01-10T14:00:00Z"}',
  true, true,
  '2025-11-30', '2025-12-15', '2026-01-05', '2026-01-15',
  '809b22af-bdc7-4315-be29-b6dac5126558', '2025-11-10T09:00:00Z'
);

-- Insert sample CAPA actions
INSERT INTO capa_actions (capa_id, action_type, description, assigned_to, due_date, status)
SELECT cr.id, 'corrective', 'Replace temperature sensor on plating bath #2 with calibrated unit', '809b22af-bdc7-4315-be29-b6dac5126558', '2026-02-15', 'pending'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0001';

INSERT INTO capa_actions (capa_id, action_type, description, assigned_to, due_date, status)
SELECT cr.id, 'corrective', 'Implement SPC monitoring for plating thickness with control limits', '809b22af-bdc7-4315-be29-b6dac5126558', '2026-02-28', 'pending'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0001';

INSERT INTO capa_actions (capa_id, action_type, description, assigned_to, due_date, status)
SELECT cr.id, 'corrective', 'Update connector design to use silicone seal material (IP67 rated)', '809b22af-bdc7-4315-be29-b6dac5126558', '2026-02-15', 'pending'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0002';

INSERT INTO capa_actions (capa_id, action_type, description, assigned_to, due_date, status)
SELECT cr.id, 'preventive', 'Add humidity stress testing to design verification protocol', '809b22af-bdc7-4315-be29-b6dac5126558', '2026-03-01', 'pending'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0002';

INSERT INTO capa_actions (capa_id, action_type, description, assigned_to, due_date, status, completed_date)
SELECT cr.id, 'corrective', 'Update SOP-DOC-003 to include regulatory review checkpoint for label changes', '809b22af-bdc7-4315-be29-b6dac5126558', '2026-01-20', 'completed', '2026-01-19'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0004';

INSERT INTO capa_actions (capa_id, action_type, description, assigned_to, due_date, status, completed_date)
SELECT cr.id, 'corrective', 'Re-label affected lots with corrected IFU reference', '809b22af-bdc7-4315-be29-b6dac5126558', '2026-01-22', 'completed', '2026-01-21'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0004';

-- Insert state transitions for audit trail
INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, NULL, 'draft', '809b22af-bdc7-4315-be29-b6dac5126558', 'CAPA initiated from audit finding NC-2026-004', '2026-01-10T09:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0001';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'draft', 'triage', '809b22af-bdc7-4315-be29-b6dac5126558', 'Submitted for triage review', '2026-01-11T10:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0001';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'triage', 'investigation', '809b22af-bdc7-4315-be29-b6dac5126558', 'Approved for investigation', '2026-01-12T14:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0001';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, NULL, 'draft', '809b22af-bdc7-4315-be29-b6dac5126558', 'CAPA initiated from customer complaints', '2026-01-12T14:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0002';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'draft', 'triage', '809b22af-bdc7-4315-be29-b6dac5126558', 'Submitted for review', '2026-01-13T09:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0002';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'triage', 'investigation', '809b22af-bdc7-4315-be29-b6dac5126558', 'Approved - patient safety concern', '2026-01-14T10:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0002';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'investigation', 'planning', '809b22af-bdc7-4315-be29-b6dac5126558', 'Root cause identified', '2026-01-25T16:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0002';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, NULL, 'draft', '809b22af-bdc7-4315-be29-b6dac5126558', 'Preventive action initiated', '2026-01-20T10:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0003';

-- CAPA-4 full lifecycle
INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, NULL, 'draft', '809b22af-bdc7-4315-be29-b6dac5126558', 'CAPA initiated from NCR-2026-018', '2026-01-05T08:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0004';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'draft', 'triage', '809b22af-bdc7-4315-be29-b6dac5126558', 'Submitted for review', '2026-01-06T09:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0004';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'triage', 'investigation', '809b22af-bdc7-4315-be29-b6dac5126558', 'Approved - regulatory compliance issue', '2026-01-07T10:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0004';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'investigation', 'planning', '809b22af-bdc7-4315-be29-b6dac5126558', 'Root cause identified', '2026-01-10T11:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0004';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'planning', 'implementation', '809b22af-bdc7-4315-be29-b6dac5126558', 'Actions approved', '2026-01-15T14:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0004';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'implementation', 'verification', '809b22af-bdc7-4315-be29-b6dac5126558', 'All actions completed', '2026-01-22T16:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0004';

-- CAPA-5 full lifecycle (closed)
INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, NULL, 'draft', '809b22af-bdc7-4315-be29-b6dac5126558', 'CAPA initiated from PMS trend analysis', '2025-11-10T09:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0005';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'draft', 'triage', '809b22af-bdc7-4315-be29-b6dac5126558', 'Submitted for review', '2025-11-11T10:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0005';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'triage', 'investigation', '809b22af-bdc7-4315-be29-b6dac5126558', 'Approved for investigation', '2025-11-12T14:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0005';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'investigation', 'planning', '809b22af-bdc7-4315-be29-b6dac5126558', 'Root cause confirmed', '2025-11-25T11:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0005';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'planning', 'implementation', '809b22af-bdc7-4315-be29-b6dac5126558', 'Actions approved', '2025-12-01T10:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0005';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'implementation', 'verification', '809b22af-bdc7-4315-be29-b6dac5126558', 'All actions completed', '2025-12-20T14:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0005';

INSERT INTO capa_state_transitions (capa_id, from_status, to_status, transitioned_by, transition_reason, created_at)
SELECT cr.id, 'verification', 'closed', '809b22af-bdc7-4315-be29-b6dac5126558', 'Effectiveness verified', '2026-01-15T10:00:00Z'
FROM capa_records cr WHERE cr.capa_id = 'CAPA-2026-0005';

-- Update CAPA-5 with closure details
UPDATE capa_records 
SET 
  closure_date = '2026-01-15',
  closed_by = '809b22af-bdc7-4315-be29-b6dac5126558',
  closure_comments = 'Effectiveness verified. Q1 2026 return rate returned to Q3 2025 baseline levels. Supplier agreement updated to require notification for any material specification changes.',
  voe_result = 'pass',
  voe_completion_date = '2026-01-10',
  voe_verified_by = '809b22af-bdc7-4315-be29-b6dac5126558',
  voe_success_criteria = 'Product return rate for "damaged on arrival" returns to Q3 2025 baseline (less than 2%)',
  voe_plan = 'Monitor return rate for 60 days post-implementation. Review monthly PMS reports.'
WHERE capa_id = 'CAPA-2026-0005';
