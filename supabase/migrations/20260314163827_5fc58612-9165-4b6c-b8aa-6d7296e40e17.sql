
-- Create ISO_14971_DEVICE template (product scope) so it appears in the product gap analysis page
INSERT INTO gap_analysis_templates (id, framework, name, description, scope, importance, is_active, is_core, auto_enable_condition)
VALUES (
  'b1a2c3d4-6666-4aaa-bbbb-666666666666',
  'ISO_14971_DEVICE',
  'ISO 14971:2019 — Risk Management (Device)',
  'Device-specific risk management requirements: risk management plan, hazard identification, risk analysis, evaluation, control measures, residual risk assessment, review, and post-production monitoring.',
  'product',
  'high',
  true,
  true,
  'always'
);

-- Insert device-level items (3.4-10) for the device template
INSERT INTO gap_template_items (template_id, item_number, requirement_text, category, priority, sort_order) VALUES
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '3.4', 'Create a device-specific risk management plan', 'documentation', 'high', 1),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '3.5', 'Maintain a risk management file for the device', 'documentation', 'high', 2),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '4.1', 'Perform risk analysis for the device', 'verification', 'high', 3),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '4.2', 'Document intended use and reasonably foreseeable misuse', 'documentation', 'high', 4),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '4.3', 'Identify characteristics related to safety', 'verification', 'high', 5),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '4.4', 'Identify hazards and hazardous situations', 'verification', 'high', 6),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '4.5', 'Estimate risk for each identified hazardous situation', 'verification', 'high', 7),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '5', 'Evaluate each estimated risk against acceptability criteria', 'verification', 'high', 8),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '6.1', 'Analyse risk control options', 'verification', 'high', 9),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '6.2', 'Implement risk control measures and verify effectiveness', 'verification', 'high', 10),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '6.3', 'Evaluate residual risk after applying risk control measures', 'verification', 'high', 11),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '6.4', 'Perform benefit-risk analysis if residual risk is not acceptable', 'verification', 'high', 12),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '6.5', 'Evaluate risks arising from risk control measures', 'verification', 'high', 13),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '6.6', 'Verify completeness of risk control', 'verification', 'high', 14),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '7', 'Evaluate overall residual risk', 'verification', 'high', 15),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '8', 'Conduct risk management review', 'documentation', 'high', 16),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '9', 'Establish production and post-production information collection', 'documentation', 'medium', 17),
('b1a2c3d4-6666-4aaa-bbbb-666666666666', '10', 'Compile risk management report', 'documentation', 'high', 18);
