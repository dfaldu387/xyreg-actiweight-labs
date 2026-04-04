-- Insert dummy data for Mission Control tables (corrected)
-- First, let's insert some example companies if they don't exist

INSERT INTO companies (id, name, description, country, city, email, phone, website) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'MedTech Innovations Inc.', 'Leading provider of cardiovascular medical devices', 'United States', 'San Francisco', 'info@medtechinnovations.com', '+1-415-555-0100', 'www.medtechinnovations.com'),
  ('550e8400-e29b-41d4-a716-446655440002', 'EuroMed Solutions GmbH', 'European manufacturer of diagnostic equipment', 'Germany', 'Munich', 'contact@euromed-solutions.de', '+49-89-555-0200', 'www.euromed-solutions.com'),
  ('550e8400-e29b-41d4-a716-446655440003', 'BioHealth Technologies Ltd.', 'Biomedical device company specializing in orthopedic implants', 'United Kingdom', 'London', 'info@biohealth-tech.co.uk', '+44-20-555-0300', 'www.biohealth-tech.com')
ON CONFLICT (id) DO NOTHING;

-- Insert Portfolio Health data (using correct column names)
INSERT INTO mission_portfolio_health (company_id, name, status, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Cardiac Device Portfolio', 'on_track', 'All cardiac devices are progressing well through regulatory approval'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Vascular Stent Line', 'needs_attention', 'FDA feedback requires additional clinical data'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Imaging Systems Portfolio', 'on_track', 'MRI and CT enhancement projects on schedule'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Ultrasound Platform', 'at_risk', 'Supply chain delays affecting component delivery'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Hip Implant Series', 'on_track', 'Phase III clinical trials completed successfully'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Knee Replacement Platform', 'needs_attention', 'Material testing results require review');

-- Insert Requires Attention items
INSERT INTO mission_requires_attention (company_id, item_type, title, description, priority, status, due_date) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'compliance', 'MDR Technical Documentation Update', 'Technical files need updates for new MDR requirements', 'high', 'needs_attention', '2024-09-15'),
  ('550e8400-e29b-41d4-a716-446655440001', 'document', 'Risk Management Report Review', 'ISO 14971 compliance review pending', 'medium', 'needs_attention', '2024-08-30'),
  ('550e8400-e29b-41d4-a716-446655440002', 'product', 'CE Mark Renewal - X-Ray System', 'Notified body assessment scheduled', 'critical', 'at_risk', '2024-08-25'),
  ('550e8400-e29b-41d4-a716-446655440002', 'milestone', 'Clinical Evaluation Report', 'CER update required for market surveillance data', 'high', 'needs_attention', '2024-09-10'),
  ('550e8400-e29b-41d4-a716-446655440003', 'compliance', 'UKCA Marking Preparation', 'UKCA transition documentation in progress', 'medium', 'needs_attention', '2024-10-01'),
  ('550e8400-e29b-41d4-a716-446655440003', 'document', 'Post-Market Surveillance Plan', 'Annual PMS plan review and update', 'low', 'needs_attention', '2024-09-20');

-- Insert Action Items
INSERT INTO mission_action_items (company_id, title, description, status, priority, due_date, requires_approval, item_type) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Approve Design History File v2.1', 'Final review and approval of DHF updates', 'pending', 'high', '2024-08-20', true, 'document_review'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Review Clinical Protocol Amendment', 'Protocol modification for expanded patient cohort', 'pending', 'critical', '2024-08-18', true, 'document_review'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Update Labeling Specifications', 'Incorporate new safety warnings per FDA guidance', 'in_progress', 'medium', '2024-08-25', false, 'compliance'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Finalize Supplier Audit Report', 'Complete corrective action verification', 'pending', 'low', '2024-08-28', false, 'general'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Sign off on Verification & Validation', 'V&V protocol completion requires approval', 'pending', 'critical', '2024-08-19', true, 'milestone'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Review Biocompatibility Test Results', 'ISO 10993 testing analysis and approval', 'pending', 'high', '2024-08-22', true, 'document_review'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Complete EMC Testing Documentation', 'Electromagnetic compatibility test reports', 'in_progress', 'medium', '2024-09-05', false, 'compliance'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Approve Clinical Investigation Plan', 'CIP for new orthopedic device study', 'pending', 'high', '2024-08-21', true, 'document_review'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Finalize PMCF Protocol', 'Post-market clinical follow-up study design', 'pending', 'medium', '2024-08-26', true, 'document_review'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Update Quality Management System', 'ISO 13485 internal audit findings resolution', 'completed', 'low', '2024-08-10', false, 'compliance');

-- Insert Activity Stream entries
INSERT INTO mission_activity_stream (company_id, activity_type, title, description, user_name, related_item_type, related_item_name, metadata) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'document_updated', 'Design Control Procedure Updated', 'Version 3.2 released with new change control workflow', 'Sarah Johnson', 'document', 'SOP-DC-001 Design Control Procedure', '{"version": "3.2", "changes": "workflow updates"}'),
  ('550e8400-e29b-41d4-a716-446655440001', 'milestone_completed', 'Phase II Clinical Trial Completed', 'Primary endpoint successfully met', 'Dr. Michael Chen', 'project', 'CardioStent Pro Clinical Study', '{"enrollment": 120, "completion_rate": "98%"}'),
  ('550e8400-e29b-41d4-a716-446655440001', 'approval_requested', 'DHF Approval Requested', 'Design History File ready for final review', 'Jennifer Davis', 'document', 'DHF-CS-001 CardioStent Design History', '{"version": "2.1", "reviewer": "John Smith"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'review_completed', 'Technical File Review Completed', 'Notified body review completed with minor observations', 'Klaus Mueller', 'document', 'Technical File - UltraSound Pro', '{"observations": 3, "status": "approved"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'system_alert', 'Supplier Audit Due', 'Annual audit of critical component supplier due next month', 'System', 'supplier', 'Advanced Components GmbH', '{"audit_type": "annual", "criticality": "high"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'task_assigned', 'EMC Testing Scheduled', 'Electromagnetic compatibility testing assigned to lab', 'Anna Weber', 'product', 'MRI Enhancement System', '{"lab": "EMC Testing Services", "scheduled_date": "2024-08-30"}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'document_updated', 'Risk Management File Updated', 'New hazard analysis added for surgical approach', 'Dr. Emma Thompson', 'document', 'RMF-HIP-001 Hip Implant Risk Management', '{"hazards_added": 2, "residual_risk": "acceptable"}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'approval_requested', 'Clinical Protocol Approval Needed', 'New PMCF protocol submitted for review', 'Robert Wilson', 'document', 'PMCF-001 Hip Implant Follow-up Study', '{"study_duration": "5 years", "target_enrollment": 200}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'milestone_completed', 'Manufacturing Site Inspection Passed', 'FDA inspection completed with no observations', 'Lisa Anderson', 'facility', 'London Manufacturing Facility', '{"inspector": "FDA", "duration": "3 days", "observations": 0}');

-- Insert Executive Communications
INSERT INTO mission_executive_communications (company_id, title, content, message_type, priority, author_name, is_published, published_at, tags) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Q3 Regulatory Strategy Update', 'Team, our Q3 regulatory milestones are tracking well. The FDA pre-submission meeting provided positive feedback on our CardioStent Pro clinical approach. We are on track for 510(k) submission in Q4. Key focus areas: complete V&V activities by month-end and finalize labeling updates.', 'executive', 'high', 'John Smith, CEO', true, now() - interval '2 days', '["regulatory", "quarterly-update", "FDA"]'),
  ('550e8400-e29b-41d4-a716-446655440001', 'New Quality Manager Introduction', 'Please join me in welcoming Sarah Martinez as our new Quality Manager. Sarah brings 15 years of experience in medical device quality systems and will be leading our ISO 13485 certification upgrade. Her first priority will be the upcoming internal audit preparation.', 'announcement', 'medium', 'John Smith, CEO', true, now() - interval '5 days', '["team", "quality", "ISO-13485"]'),
  ('550e8400-e29b-41d4-a716-446655440002', 'MDR Compliance Status Report', 'Excellent progress on MDR transition. 85% of our technical documentation is complete. The notified body assessment for our imaging systems is scheduled for next month. Special recognition to the regulatory team for their dedication. Remaining items are on track for October completion.', 'executive', 'high', 'Dr. Hans Mueller, Managing Director', true, now() - interval '1 day', '["MDR", "compliance", "regulatory"]'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Innovation Award Recognition', 'Proud to announce that our UltraSound Pro system won the MedTech Innovation Award at the Berlin Medical Technology Conference. This recognition validates our R&D investment and market positioning. Congratulations to the entire development team!', 'announcement', 'medium', 'Dr. Hans Mueller, Managing Director', true, now() - interval '7 days', '["innovation", "award", "R&D"]'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Clinical Trial Enrollment Milestone', 'Fantastic news - we have reached 80% enrollment in our hip implant clinical study, ahead of schedule. The positive safety profile and excellent surgeon feedback position us well for regulatory submission. Thank you to the clinical team and our investigator sites for this achievement.', 'executive', 'high', 'Dr. Patricia Brown, Chief Medical Officer', true, now() - interval '3 days', '["clinical", "milestone", "enrollment"]'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Supplier Partnership Expansion', 'We are expanding our strategic partnership with BioMaterials Ltd for next-generation implant coatings. This collaboration will enhance our competitive position and support our 2025 product roadmap. The partnership includes joint R&D activities and preferential supply terms.', 'executive', 'medium', 'Michael Johnson, COO', true, now() - interval '4 days', '["partnership", "suppliers", "R&D"]');

-- Insert Recent Messages
INSERT INTO mission_recent_messages (company_id, thread_id, sender_name, recipient_ids, subject, content, message_type, is_read_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', gen_random_uuid(), 'Sarah Johnson', '[]', 'Design Review Meeting - Tomorrow 2 PM', 'Hi team, reminder about tomorrow''s design review for CardioStent Pro. Please review the DHF package sent earlier. Key items: verification results, labeling changes, and risk management updates.', 'team', '{}'),
  ('550e8400-e29b-41d4-a716-446655440001', gen_random_uuid(), 'Dr. Michael Chen', '[]', 'Clinical Data Summary Ready', 'The clinical data summary for our FDA submission is complete. All endpoints met with strong statistical significance. Data package uploaded to the shared drive. Ready for regulatory review.', 'team', '{}'),
  ('550e8400-e29b-41d4-a716-446655440001', gen_random_uuid(), 'Jennifer Davis', '[]', 'Urgent: Supplier Audit Finding', 'Critical finding from component supplier audit. Non-conformance in traceability records. Supplier has 48 hours to provide corrective action plan. May impact production schedule if not resolved quickly.', 'team', '{}'),
  ('550e8400-e29b-41d4-a716-446655440002', gen_random_uuid(), 'Klaus Mueller', '[]', 'Notified Body Assessment Update', 'Good news from today''s NB assessment. Only minor documentation gaps identified. No major non-conformances. Assessment report expected within 2 weeks. CE marking timeline remains on track.', 'team', '{}'),
  ('550e8400-e29b-41d4-a716-446655440002', gen_random_uuid(), 'Anna Weber', '[]', 'EMC Testing Results Available', 'EMC testing completed successfully. All emissions and immunity requirements met. Test report attached. This clears the final technical requirement for our CE marking dossier.', 'team', '{}'),
  ('550e8400-e29b-41d4-a716-446655440002', gen_random_uuid(), 'System', '[]', 'Automated Reminder: Document Expiry', 'The following documents expire within 30 days: Quality Manual v4.2, Calibration Certificate CAL-001, Training Record TR-EMC-2024. Please schedule reviews and updates.', 'system', '{}'),
  ('550e8400-e29b-41d4-a716-446655440003', gen_random_uuid(), 'Dr. Emma Thompson', '[]', 'Clinical Site Visit Summary', 'Completed site visits at Manchester and Birmingham. Excellent data quality and protocol compliance. Two minor protocol deviations documented - both non-significant. Overall study integrity is very strong.', 'team', '{}'),
  ('550e8400-e29b-41d4-a716-446655440003', gen_random_uuid(), 'Robert Wilson', '[]', 'PMCF Protocol Finalized', 'Post-market clinical follow-up protocol is finalized. 5-year study with 200 patients across 8 sites. Ethics submissions to begin next week. Targeting study start in October.', 'team', '{}'),
  ('550e8400-e29b-41d4-a716-446655440003', gen_random_uuid(), 'Lisa Anderson', '[]', 'Manufacturing Audit - Zero Observations!', 'Incredible result from today''s FDA inspection - zero observations! The inspector was impressed with our quality system maturity and documentation. This positions us excellently for upcoming product approvals.', 'team', '{}');