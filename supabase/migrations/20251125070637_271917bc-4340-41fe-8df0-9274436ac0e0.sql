-- Add PMCF (Post-Market Clinical Follow-up) activity templates for EU markets
-- Required per EU MDR Article 61 for Class IIa, IIb, and III devices

-- PMCF Study Planning (Class IIa)
INSERT INTO pms_activity_templates (
  market_code, device_class, activity_name, activity_type, frequency,
  days_before_report, description, regulatory_reference, is_mandatory, 
  checklist_items, document_templates, is_system_template
) VALUES 
(
  'EU', 'IIa', 'PMCF Study Planning', 'periodic', 'annually', 30,
  'Plan and update Post-Market Clinical Follow-up studies to continuously evaluate clinical safety and performance',
  'EU MDR Article 61, Annex XIV Part B',
  true,
  '[
    {"item": "Review and update PMCF plan based on current risk assessment", "completed": false},
    {"item": "Define PMCF objectives and acceptance criteria", "completed": false},
    {"item": "Identify appropriate PMCF methods (surveys, registries, literature)", "completed": false},
    {"item": "Establish PMCF timeline and data collection milestones", "completed": false},
    {"item": "Obtain ethics committee approval if conducting active studies", "completed": false},
    {"item": "Document PMCF plan updates in technical file", "completed": false}
  ]'::jsonb,
  '["PMCF Plan", "Ethics Committee Submission"]'::jsonb,
  true
),
(
  'EU', 'IIa', 'PMCF Data Collection', 'periodic', 'quarterly', NULL,
  'Collect ongoing clinical data to evaluate device performance and identify safety signals',
  'EU MDR Article 61',
  true,
  '[
    {"item": "Collect quarterly sales data (units distributed)", "completed": false},
    {"item": "Gather clinical performance data from healthcare facilities", "completed": false},
    {"item": "Monitor device registry enrollments and outcomes", "completed": false},
    {"item": "Conduct patient/user surveys or questionnaires", "completed": false},
    {"item": "Review feedback from healthcare professionals", "completed": false},
    {"item": "Document all PMCF data sources and findings", "completed": false}
  ]'::jsonb,
  '["PMCF Data Collection Log", "Patient Survey Results"]'::jsonb,
  true
),
(
  'EU', 'IIa', 'PMCF Report & Evaluation', 'periodic', 'annually', 60,
  'Analyze PMCF data and generate clinical evaluation report for inclusion in PSUR',
  'EU MDR Article 61, Annex XIV',
  true,
  '[
    {"item": "Compile all PMCF data collected over reporting period", "completed": false},
    {"item": "Analyze clinical safety outcomes and adverse events", "completed": false},
    {"item": "Evaluate device performance against intended use", "completed": false},
    {"item": "Identify any emerging risks or benefit-risk changes", "completed": false},
    {"item": "Draft PMCF evaluation report", "completed": false},
    {"item": "Conduct clinical review with medical team", "completed": false},
    {"item": "Update clinical evaluation report in technical file", "completed": false},
    {"item": "Provide PMCF findings to PSUR authors", "completed": false}
  ]'::jsonb,
  '["PMCF Evaluation Report", "Clinical Evaluation Report Update"]'::jsonb,
  true
),

-- PMCF Study Planning (Class IIb)
(
  'EU', 'IIb', 'PMCF Study Planning', 'periodic', 'annually', 30,
  'Plan and update Post-Market Clinical Follow-up studies to continuously evaluate clinical safety and performance',
  'EU MDR Article 61, Annex XIV Part B',
  true,
  '[
    {"item": "Review and update PMCF plan based on current risk assessment", "completed": false},
    {"item": "Define PMCF objectives and acceptance criteria", "completed": false},
    {"item": "Identify appropriate PMCF methods (surveys, registries, literature)", "completed": false},
    {"item": "Establish PMCF timeline and data collection milestones", "completed": false},
    {"item": "Obtain ethics committee approval if conducting active studies", "completed": false},
    {"item": "Document PMCF plan updates in technical file", "completed": false}
  ]'::jsonb,
  '["PMCF Plan", "Ethics Committee Submission"]'::jsonb,
  true
),
(
  'EU', 'IIb', 'PMCF Data Collection', 'periodic', 'quarterly', NULL,
  'Collect ongoing clinical data to evaluate device performance and identify safety signals',
  'EU MDR Article 61',
  true,
  '[
    {"item": "Collect quarterly sales data (units distributed)", "completed": false},
    {"item": "Gather clinical performance data from healthcare facilities", "completed": false},
    {"item": "Monitor device registry enrollments and outcomes", "completed": false},
    {"item": "Conduct patient/user surveys or questionnaires", "completed": false},
    {"item": "Review feedback from healthcare professionals", "completed": false},
    {"item": "Document all PMCF data sources and findings", "completed": false}
  ]'::jsonb,
  '["PMCF Data Collection Log", "Patient Survey Results"]'::jsonb,
  true
),
(
  'EU', 'IIb', 'PMCF Report & Evaluation', 'periodic', 'annually', 60,
  'Analyze PMCF data and generate clinical evaluation report for inclusion in PSUR',
  'EU MDR Article 61, Annex XIV',
  true,
  '[
    {"item": "Compile all PMCF data collected over reporting period", "completed": false},
    {"item": "Analyze clinical safety outcomes and adverse events", "completed": false},
    {"item": "Evaluate device performance against intended use", "completed": false},
    {"item": "Identify any emerging risks or benefit-risk changes", "completed": false},
    {"item": "Draft PMCF evaluation report", "completed": false},
    {"item": "Conduct clinical review with medical team", "completed": false},
    {"item": "Update clinical evaluation report in technical file", "completed": false},
    {"item": "Provide PMCF findings to PSUR authors", "completed": false}
  ]'::jsonb,
  '["PMCF Evaluation Report", "Clinical Evaluation Report Update"]'::jsonb,
  true
),

-- PMCF Study Planning (Class III)
(
  'EU', 'III', 'PMCF Study Planning', 'periodic', 'annually', 30,
  'Plan and update Post-Market Clinical Follow-up studies to continuously evaluate clinical safety and performance',
  'EU MDR Article 61, Annex XIV Part B',
  true,
  '[
    {"item": "Review and update PMCF plan based on current risk assessment", "completed": false},
    {"item": "Define PMCF objectives and acceptance criteria", "completed": false},
    {"item": "Identify appropriate PMCF methods (surveys, registries, literature)", "completed": false},
    {"item": "Establish PMCF timeline and data collection milestones", "completed": false},
    {"item": "Obtain ethics committee approval if conducting active studies", "completed": false},
    {"item": "Document PMCF plan updates in technical file", "completed": false}
  ]'::jsonb,
  '["PMCF Plan", "Ethics Committee Submission"]'::jsonb,
  true
),
(
  'EU', 'III', 'PMCF Data Collection', 'periodic', 'quarterly', NULL,
  'Collect ongoing clinical data to evaluate device performance and identify safety signals',
  'EU MDR Article 61',
  true,
  '[
    {"item": "Collect quarterly sales data (units distributed)", "completed": false},
    {"item": "Gather clinical performance data from healthcare facilities", "completed": false},
    {"item": "Monitor device registry enrollments and outcomes", "completed": false},
    {"item": "Conduct patient/user surveys or questionnaires", "completed": false},
    {"item": "Review feedback from healthcare professionals", "completed": false},
    {"item": "Document all PMCF data sources and findings", "completed": false}
  ]'::jsonb,
  '["PMCF Data Collection Log", "Patient Survey Results"]'::jsonb,
  true
),
(
  'EU', 'III', 'PMCF Report & Evaluation', 'periodic', 'annually', 60,
  'Analyze PMCF data and generate clinical evaluation report for inclusion in PSUR',
  'EU MDR Article 61, Annex XIV',
  true,
  '[
    {"item": "Compile all PMCF data collected over reporting period", "completed": false},
    {"item": "Analyze clinical safety outcomes and adverse events", "completed": false},
    {"item": "Evaluate device performance against intended use", "completed": false},
    {"item": "Identify any emerging risks or benefit-risk changes", "completed": false},
    {"item": "Draft PMCF evaluation report", "completed": false},
    {"item": "Conduct clinical review with medical team", "completed": false},
    {"item": "Update clinical evaluation report in technical file", "completed": false},
    {"item": "Provide PMCF findings to PSUR authors", "completed": false}
  ]'::jsonb,
  '["PMCF Evaluation Report", "Clinical Evaluation Report Update"]'::jsonb,
  true
);