
-- Add auto_enable_condition column
ALTER TABLE gap_analysis_templates ADD COLUMN IF NOT EXISTS auto_enable_condition text DEFAULT NULL;

-- Set 'always' for core templates (ISO 13485, ISO 14971)
UPDATE gap_analysis_templates SET auto_enable_condition = 'always', is_core = true
WHERE framework IN ('ISO_13485', 'ISO_14971');

-- Set MDR templates to conditional EU (no longer locked core)
UPDATE gap_analysis_templates SET auto_enable_condition = 'market_eu', is_core = false
WHERE framework IN ('MDR_ANNEX_I', 'MDR_ANNEX_II', 'MDR_ANNEX_III');

-- Set FDA templates to conditional US
UPDATE gap_analysis_templates SET auto_enable_condition = 'market_us'
WHERE framework IN ('FDA_21_CFR_820', 'FDA_QMSR');

-- Set IEC 62304 to conditional software
UPDATE gap_analysis_templates SET auto_enable_condition = 'device_samd'
WHERE framework = 'IEC_62304';

-- Set IEC 60601 series to conditional active device
UPDATE gap_analysis_templates SET auto_enable_condition = 'device_active'
WHERE framework IN ('IEC_60601_1', 'IEC_60601_1_2', 'IEC_60601_1_6');

-- Insert new always-on templates (only if they don't exist)
INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'IEC 62366-1 — Usability Engineering', 'IEC_62366_1', 'Application of usability engineering to medical devices per IEC 62366-1:2015+A1:2020', 'high', 'product', true, false, true, 'always', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'IEC_62366_1');

INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'ISO 20417 — Information Supplied by Manufacturer', 'ISO_20417', 'Requirements for information supplied by the manufacturer with medical devices per ISO 20417:2021', 'high', 'product', true, false, true, 'always', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'ISO_20417');

INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'ISO 15223-1 — Symbols for Medical Devices', 'ISO_15223_1', 'Symbols to be used with information to be supplied by the manufacturer of medical devices per ISO 15223-1:2021', 'high', 'product', true, false, true, 'always', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'ISO_15223_1');

INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'ISO 10993 — Biological Evaluation', 'ISO_10993', 'Biological evaluation of medical devices — evaluation and testing within a risk management process per ISO 10993-1:2018', 'high', 'product', true, false, false, 'device_patient_contact', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'ISO_10993');
