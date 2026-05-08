
WITH ins AS (
  INSERT INTO public.gap_analysis_templates (
    name, framework, description, importance, scope, is_active, is_custom, auto_enable_condition
  ) VALUES (
    'DiGA Fast-Track (BfArM §139e SGB V)',
    'DIGA_FAST_TRACK',
    'Comprehensive readiness checklist for listing a Digital Health Application (DiGA) in the BfArM directory under §139e SGB V, structured directly from the BfArM Fast-Track Guide and DiGAV.',
    'high', 'product', true, false, 'germany_samd'
  )
  ON CONFLICT DO NOTHING
  RETURNING id
),
tpl AS (
  SELECT id FROM ins
  UNION ALL
  SELECT id FROM public.gap_analysis_templates WHERE framework = 'DIGA_FAST_TRACK'
  LIMIT 1
)
INSERT INTO public.gap_template_items (
  template_id, item_number, clause_reference, requirement_text, guidance_text, evidence_requirements, category, priority, sort_order
)
SELECT (SELECT id FROM tpl LIMIT 1), x.item_number, x.clause, x.requirement, x.guidance, to_jsonb(x.evidence), x.category, x.priority, x.sort_order
FROM (VALUES
  ('1.1','DiGAV §1','Confirm the product qualifies as a medical device and falls within Class I, IIa, or (under DigiG) IIb.','Class is decisive: only Class I, IIa, IIb DiGAs are eligible for the directory.', ARRAY['CE certificate','MDR/MDD declaration of conformity'], 'compliance','high', 101),
  ('1.2','DiGAV §1(1)','Document that the main function of the product is essentially based on digital technologies.','Hardware components may exist but must not be the main function.', ARRAY['Architecture description','Intended purpose statement'], 'documentation','high', 102),
  ('1.3','DiGAV §1(1)','Confirm the DiGA is used by the patient, or jointly by patient and HCP — not by HCP alone.','Pure HCP-only tools are excluded from the DiGA Directory.', ARRAY['User profile / persona analysis','IFU'], 'compliance','high', 103),
  ('1.4','SGB V §33a','Verify the indication is detection, monitoring, treatment or alleviation of disease (or compensation of injury / disability).','Primary prevention is in scope under DigiG; document the indication clearly.', ARRAY['Indication statement','ICD-10-GM code list'], 'documentation','high', 104),
  ('1.5','DiGAV §1(2)','If hardware is bundled, demonstrate the hardware-coupling requirements are met.','Hardware must support the digital main function.', ARRAY['Hardware integration description','Risk justification'], 'verification','medium', 105),
  ('1.6','DiGAV §1(3)','If services are bundled, demonstrate the service-coupling requirements are met.','Services beyond what is reimbursable through SGB V cannot be part of the DiGA.', ARRAY['Service catalogue','Reimbursement scope analysis'], 'verification','medium', 106),
  ('2.1','DiGAV §3, §20','Provide manufacturer master data and EU authorised representative.','Required fields per Annex 1 DiGAV.', ARRAY['Company registration extract','EC REP designation'], 'documentation','high', 201),
  ('2.2','DiGAV §20','Provide product identifiers: UDI-DI, version, supported platforms, supported languages.','German UI is mandatory.', ARRAY['UDI assignment','Platform support matrix'], 'documentation','high', 202),
  ('2.3','DiGAV §20','Specify intended purpose, target patient group and ICD-10-GM indication codes.','Used for prescription routing.', ARRAY['Intended purpose','Patient group definition','ICD-10 list'], 'documentation','high', 203),
  ('2.4','DiGAV §20','List contraindications, side effects and warnings.','Must reflect risk management output.', ARRAY['IFU contraindications section','RMF link'], 'documentation','high', 204),
  ('2.5','DiGAV §20','Describe healthcare provider involvement model (with / without HCP).','Determines billing pathway.', ARRAY['HCP-interaction description'], 'documentation','medium', 205),
  ('2.6','SGB V §139e(2)/(4)','Choose the application route: final listing or provisional listing with evaluation concept.','Provisional route requires plausibility justification + study plan.', ARRAY['Application form','Route justification'], 'compliance','high', 206),
  ('2.7','DiGAV Annex 1','Complete all manufacturer self-declarations in Annex 1 DiGAV.','All boxes must be ticked truthfully or non-conformities listed.', ARRAY['Signed Annex 1 declarations'], 'documentation','high', 207),
  ('3.1','DiGAV §3, MDR','Maintain a current and valid CE certificate (or DoC for Class I).','Notified Body certificate must be in date.', ARRAY['Valid CE certificate'], 'compliance','high', 301),
  ('3.2','ISO 14971','Risk management file covers cybersecurity, data, and digital-specific hazards.','Aligned with MDCG 2019-16.', ARRAY['RMF','Hazard log'], 'verification','high', 302),
  ('3.3','MDR Annex XIV','Clinical evaluation report is current and addresses the DiGA indication.','Required regardless of class.', ARRAY['CER'], 'verification','high', 303),
  ('3.4','IEC 62366-1','Usability engineering file demonstrates safe use in German with target users.','Formative + summative evaluations expected.', ARRAY['UEF','Summative usability report'], 'verification','high', 304),
  ('3.5','IEC 62304','Software lifecycle artefacts present, including SOUP/OTS list and SBOM.','Class A/B/C per IEC 62304.', ARRAY['SDP','Architecture','SBOM','Verification report'], 'verification','high', 305),
  ('3.6','MDR Art 83','PMS plan includes DiGA-specific signals: app store reviews, digital usage telemetry.','PMS must close the loop into RMF.', ARRAY['PMS plan','PSUR'], 'verification','high', 306),
  ('4.1','DiGAV §4(2), GDPR','Each personal data processing activity has a permitted purpose under §4 DiGAV.','Permitted purposes are exhaustively listed.', ARRAY['Processing purpose register'], 'compliance','high', 401),
  ('4.2','SGB V §139e(10)','No advertising and no insurer-pricing use of DiGA-collected data.','Hard prohibition.', ARRAY['Privacy policy','Processor contracts'], 'compliance','high', 402),
  ('4.3','DiGAV §4, GDPR Ch. V','All processing performed in EU/EEA, adequacy countries, or BfArM-listed third countries only.','Includes cloud, analytics, support and backups.', ARRAY['Sub-processor list','Data flow diagram'], 'compliance','high', 403),
  ('4.4','GDPR Art 35','DPIA performed and documented.','Required for high-risk health processing.', ARRAY['DPIA report'], 'documentation','high', 404),
  ('4.5','GDPR Art 30','Records of Processing Activities (ROPA) cover the DiGA.','Manufacturer is controller for most flows.', ARRAY['ROPA'], 'documentation','medium', 405),
  ('4.6','GDPR Art 12-22','Workflows implemented for export, rectification, erasure and access requests.','Self-service in app preferred.', ARRAY['DSR procedure','In-app data export'], 'verification','high', 406),
  ('4.7','GDPR Art 26/28','Joint-controller and processor agreements signed with all relevant parties.','Includes cloud and analytics vendors.', ARRAY['DPAs','JCAs'], 'documentation','high', 407),
  ('4.8','DiGAV §4','Pseudonymisation / anonymisation strategy for analytics and statistics.','Identifiable data not allowed for product improvement absent consent.', ARRAY['Anonymisation method description'], 'verification','medium', 408),
  ('5.1','DiGAV §5, ISO 27001','ISMS in place whose scope explicitly covers the DiGA.','ISO 27001 certificate required.', ARRAY['ISO 27001 certificate','SoA'], 'documentation','high', 501),
  ('5.2','BSI','Documented security-as-a-process: vulnerability mgmt, patching, monitoring, review cycles.','Continuous, not one-off.', ARRAY['Vulnerability mgmt SOP','Patch policy'], 'verification','high', 502),
  ('5.3','BSI Grundschutz','Applicable BSI Grundschutz building blocks selected and implemented.','Selection must be justified.', ARRAY['Building-block selection log','Implementation evidence'], 'verification','high', 503),
  ('5.4','BSI TR-03161','Conformity to BSI TR-03161 demonstrated.','Independent assessment recommended.', ARRAY['TR-03161 conformity statement'], 'compliance','high', 504),
  ('5.5','DiGAV §5','Penetration test conducted by a qualified independent party within scope.','Re-test on significant change.', ARRAY['Pen-test report','Remediation evidence'], 'verification','high', 505),
  ('5.6','DiGAV §5','Increased protection-needs assessment performed; additional controls in place where applicable.','Trigger when DiGA has high-need data.', ARRAY['Protection-needs analysis'], 'verification','medium', 506),
  ('5.7','GDPR Art 33-34','Incident response and breach-notification process implemented and tested.','24/72-hour notification timelines.', ARRAY['IR plan','Tabletop exercise log'], 'verification','high', 507),
  ('6.1','DiGAV §6','Standards from the interop directory used: FHIR, LOINC, SNOMED CT, ICD-10-GM where applicable.','Use latest published versions.', ARRAY['Standards conformance statement'], 'documentation','high', 601),
  ('6.2','DiGAV §6','Cascade of §6 DiGAV applied with documented justifications for any deviation.','Manufacturer must reason from the cascade.', ARRAY['Cascade decision log'], 'documentation','medium', 602),
  ('6.3','DiGAV §6','Patient data export available in a structured, open format.','Free of charge, on request.', ARRAY['Export feature description','Sample export'], 'verification','high', 603),
  ('6.4','DiGAV §6','Semantic and syntactic interoperability documented.','Mapping tables to standard terminologies.', ARRAY['Interop mapping'], 'documentation','medium', 604),
  ('6.5','DiGAV §6','Open APIs and authentication standards (OAuth2, OIDC) used where APIs are exposed.','Especially for HCP integrations.', ARRAY['API spec','Authn/authz design'], 'verification','medium', 605),
  ('7.1','DiGAV Annex 1 §2','Robustness: error handling, offline behaviour, recovery and integrity tested.','Crash-free rate monitored.', ARRAY['Robustness test report','Crash analytics'], 'verification','medium', 701),
  ('7.2','DiGAV Annex 1 §2','Consumer protection: transparent T&Cs, no dark patterns, fair pricing and cancellation.','Pricing public for self-payers.', ARRAY['T&Cs','Pricing page'], 'documentation','medium', 702),
  ('7.3','BITV / WCAG 2.1 AA','Ease of use: accessibility per BITV and WCAG 2.1 AA, German language UI.','Tested with assistive tech.', ARRAY['Accessibility audit'], 'verification','high', 703),
  ('7.4','DiGAV Annex 1 §2','Healthcare provider support materials available (HCP guide, prescribing info).','German language.', ARRAY['HCP guide','Prescribing leaflet'], 'documentation','medium', 704),
  ('7.5','DiGAV Annex 1 §2','Quality of medical content: cited sources, currency, peer review.','Review cycle recommended.', ARRAY['Content source register','Review log'], 'documentation','high', 705),
  ('7.6','DiGAV Annex 1 §2','Patient safety: red-flag handling, escalation paths and emergency contacts in app.','Where clinically relevant.', ARRAY['Red-flag logic spec','Emergency screen'], 'verification','high', 706),
  ('8.1','SGB V §139e(2), DiGAV §8','Type of positive care effect chosen (medical benefit and/or pSVV).','At least one of mB or pSVV.', ARRAY['Effect-type declaration'], 'documentation','high', 801),
  ('8.2','DiGAV §10','Patient group precisely defined (diagnosis, comorbidities, age, prior care).','Aligns with ICD-10-GM in 2.3.', ARRAY['Patient group spec'], 'documentation','high', 802),
  ('8.3','DiGAV §11','Endpoints defined and patient-relevant.','Validated PROMs preferred.', ARRAY['Endpoint definition','Instrument validation'], 'documentation','high', 803),
  ('8.4','DiGAV §10','Comparative study, conducted in Germany (or justified deviation).','Real-world routine care comparator.', ARRAY['Study protocol'], 'verification','high', 804),
  ('8.5','DiGAV §10','Study registered in a public registry before enrolment starts.','DRKS or equivalent.', ARRAY['Registry entry'], 'compliance','high', 805),
  ('8.6','DiGAV §10','Statistical analysis plan and sample size justification documented.','Pre-registered.', ARRAY['SAP'], 'documentation','high', 806),
  ('8.7','CONSORT','Full study report published per international standards.','Open access.', ARRAY['Published report / DOI'], 'compliance','high', 807),
  ('8.8','SGB V §139e(4)','For provisional listing: evaluation concept and plausibility justification submitted.','Trial period ≤ 12 months, extendable once.', ARRAY['Evaluation concept','Plausibility dossier'], 'documentation','high', 808),
  ('9.1','DiGAV §16','Process to classify and notify significant changes to BfArM.','Notify before deployment.', ARRAY['Change classification SOP','Notification log'], 'verification','high', 901),
  ('9.2','DiGAV §17','Annual mandatory further-development plan in place.','Submitted to BfArM yearly.', ARRAY['FD plan'], 'documentation','medium', 902),
  ('9.3','MDR / DiGAV','PMS reporting cycle aligned with BfArM expectations and PSUR.','Trend analysis on app metrics.', ARRAY['PMS reports'], 'verification','high', 903),
  ('9.4','DiGAV §19','De-listing risk register maintained, with mitigations.','Monitor compliance signals continuously.', ARRAY['De-listing risk log'], 'verification','medium', 904)
) AS x(item_number, clause, requirement, guidance, evidence, category, priority, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.gap_template_items i
  JOIN public.gap_analysis_templates t ON t.id = i.template_id
  WHERE t.framework = 'DIGA_FAST_TRACK' AND i.item_number = x.item_number
);
