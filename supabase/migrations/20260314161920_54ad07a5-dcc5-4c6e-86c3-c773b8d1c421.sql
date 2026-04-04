
-- Insert 9 new market-conditional regulatory framework templates
INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'Canadian Medical Device Regulations (SOR/98-282)', 'CMDR_SOR', 'Health Canada Medical Device Regulations SOR/98-282 covering device classification, licensing, and quality system requirements for the Canadian market', 'high', 'company', true, false, false, 'market_ca', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'CMDR_SOR');

INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'Australian Therapeutic Goods Act 1989', 'TGA_ACT', 'TGA regulatory framework for medical devices including conformity assessment, essential principles, and post-market requirements for the Australian market', 'high', 'company', true, false, false, 'market_au', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'TGA_ACT');

INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'Japan PAL / PMD Act (PMDA)', 'PMDA_PAL', 'Japanese Pharmaceutical and Medical Device Act covering approval, QMS, and post-market surveillance requirements administered by PMDA', 'high', 'company', true, false, false, 'market_jp', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'PMDA_PAL');

INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'China NMPA Medical Device Regulations', 'NMPA_REGULATIONS', 'NMPA regulatory framework for medical devices including registration, classification, and quality management system requirements for the Chinese market', 'high', 'company', true, false, false, 'market_cn', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'NMPA_REGULATIONS');

INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'Brazil ANVISA RDC 751/2022', 'ANVISA_RDC', 'ANVISA Resolution RDC 751/2022 establishing requirements for registration, labeling, and good manufacturing practices for medical devices in Brazil', 'high', 'company', true, false, false, 'market_br', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'ANVISA_RDC');

INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'India CDSCO Medical Device Rules 2017', 'CDSCO_MDR', 'Central Drugs Standard Control Organisation Medical Device Rules 2017 covering registration, import licensing, and clinical investigation requirements for India', 'high', 'company', true, false, false, 'market_in', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'CDSCO_MDR');

INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'UK MDR 2002 (MHRA)', 'UKCA_MDR2002', 'UK Medical Devices Regulations 2002 (as amended) under MHRA covering UKCA marking, conformity assessment, and post-market surveillance for the UK market', 'high', 'company', true, false, false, 'market_uk', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'UKCA_MDR2002');

INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'Swiss MepV / Medizinprodukteverordnung', 'MEPSW', 'Swiss Medical Devices Ordinance (MepV) aligned with EU MDR, covering conformity assessment and market surveillance requirements for Switzerland', 'high', 'company', true, false, false, 'market_ch', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'MEPSW');

INSERT INTO gap_analysis_templates (name, framework, description, importance, scope, is_active, is_custom, is_core, auto_enable_condition, version, template_type)
SELECT 'South Korea MFDS Medical Device Industry Act', 'KFDA_MDIA', 'Korean Ministry of Food and Drug Safety Medical Device Act covering device classification, technical documentation, and GMP requirements for South Korea', 'high', 'company', true, false, false, 'market_kr', '1.0', 'standard'
WHERE NOT EXISTS (SELECT 1 FROM gap_analysis_templates WHERE framework = 'KFDA_MDIA');
