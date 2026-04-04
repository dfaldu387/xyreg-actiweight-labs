/**
 * MDR Annex II — Technical Documentation: Step-by-Step Form Field Definitions
 *
 * Same architecture as IEC 60601-1 form fields. Each section maps to a
 * ClauseFormConfig with ordered steps, requirement text, guidance, and fields.
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const MDR_ANNEX_II_FORM_FIELDS: Record<string, ClauseFormConfig> = {

  // ═══════════════════════════════════════════════════════════
  // §1.1 Device Description and Specification
  // ═══════════════════════════════════════════════════════════
  '1.1': {
    clauseTitle: '1.1 — Device Description and Specification',
    evidenceRequired: false,
    steps: [
      {
        id: '1.1_a_name_description',
        stepLabel: '(a) Product/Trade Name & General Description',
        requirementText: 'Provide the product or trade name and a general description of the device, including its intended purpose, intended users, and any variants or accessories.',
        supplementaryInfo: 'MDR Annex II §1.1(a): The technical documentation shall contain a complete description enabling the identification and understanding of the device.',
        fields: [
          { id: 'product_trade_name', label: 'Product / Trade Name', type: 'text', placeholder: 'e.g. CardioMonitor Pro 3000' },
          { id: 'general_description', label: 'General Description of the Device', type: 'richtext', placeholder: 'Provide a comprehensive description of the device, its appearance, key components, and general function...' },
        ],
      },
      {
        id: '1.1_a2_intended_purpose',
        stepLabel: '(a) Intended Purpose',
        requirementText: 'State the intended purpose of the device, including what it is designed to do, the medical condition(s) it addresses, and any specific clinical claims.',
        supplementaryInfo: 'The intended purpose must align with all labelling and IFU. It should be specific enough to define the scope of the clinical evaluation.',
        fields: [
          { id: 'intended_purpose', label: 'Intended Purpose Statement', type: 'richtext', placeholder: 'The device is intended for...' },
          { id: 'medical_conditions', label: 'Medical Condition(s) / Indications', type: 'richtext', placeholder: 'List the specific medical conditions, diseases, or injuries the device is intended to diagnose, treat, or monitor...' },
        ],
      },
      {
        id: '1.1_a3_intended_users',
        stepLabel: '(a) Intended Users',
        requirementText: 'Identify the intended user(s) of the device. Specify whether professional healthcare providers, lay persons, or both are expected to operate the device.',
        supplementaryInfo: 'Consider the level of training and expertise required. If lay users are intended, address usability and risk mitigations in your human factors analysis.',
        fields: [
          { id: 'intended_users', label: 'Intended User Profile(s)', type: 'richtext', placeholder: 'e.g. Trained healthcare professionals (cardiologists, nurses); Lay users for home monitoring...' },
          { id: 'user_training_requirements', label: 'Training Requirements', type: 'textarea', placeholder: 'Describe any training, qualifications, or experience required to safely use the device...' },
        ],
      },
      {
        id: '1.1_b_udi',
        stepLabel: '(b) Basic UDI-DI',
        requirementText: 'Provide the Basic UDI-DI as referred to in Part C of Annex VI, assigned by the issuing entity.',
        supplementaryInfo: 'The Basic UDI-DI is the primary identifier for the device model. It is used for registration in EUDAMED and does not appear on the device label. Ensure it matches the value registered with your issuing entity (GS1, HIBCC, ICCBBA, or IFA).',
        fields: [
          { id: 'basic_udi_di', label: 'Basic UDI-DI', type: 'text', placeholder: 'e.g. (01)00857674002010' },
          { id: 'issuing_entity', label: 'Issuing Entity', type: 'select', options: ['GS1', 'HIBCC', 'ICCBBA', 'IFA'] },
          { id: 'udi_rationale', label: 'UDI Assignment Rationale', type: 'textarea', placeholder: 'Describe how the UDI-DI was assigned and how it relates to device variants/configurations...' },
        ],
      },
      {
        id: '1.1_c_patient_population',
        stepLabel: '(c) Patient Population & Contra-indications',
        requirementText: 'Describe the intended patient population, medical conditions, severity and stage of disease, indications for use, contra-indications, and warnings.',
        supplementaryInfo: 'Be as specific as possible about the patient population. Include age, weight, gender, anatomy, physiology, and any other relevant characteristics. Contra-indications and warnings should be cross-referenced with the risk management file.',
        fields: [
          { id: 'patient_population', label: 'Intended Patient Population', type: 'richtext', placeholder: 'e.g. Adult patients (≥18 years) with suspected or confirmed cardiac arrhythmias...' },
          { id: 'indications_for_use', label: 'Indications for Use', type: 'richtext', placeholder: 'List specific clinical indications...' },
          { id: 'contraindications', label: 'Contra-indications', type: 'richtext', placeholder: 'List contra-indications (conditions where the device should NOT be used)...' },
          { id: 'warnings_precautions', label: 'Warnings and Precautions', type: 'richtext', placeholder: 'List warnings and precautions for safe use...' },
        ],
      },
      {
        id: '1.1_d_principles_operation',
        stepLabel: '(d) Principles of Operation & Mode of Action',
        requirementText: 'Describe the principles of operation of the device and its scientifically demonstrated mode of action.',
        supplementaryInfo: 'Explain the scientific and/or technological basis for how the device achieves its intended purpose. For software-driven devices, describe the algorithm and its clinical basis. Reference peer-reviewed literature where applicable.',
        fields: [
          { id: 'principles_of_operation', label: 'Principles of Operation', type: 'richtext', placeholder: 'Describe how the device works (mechanism of action, physical principles, algorithms)...' },
          { id: 'mode_of_action', label: 'Mode of Action (Scientific Basis)', type: 'richtext', placeholder: 'Describe the scientifically demonstrated mode of action and reference supporting evidence...' },
        ],
      },
      {
        id: '1.1_e_device_qualification',
        stepLabel: '(e) Qualification as a Medical Device',
        requirementText: 'Provide the rationale for the qualification of the product as a device (rather than e.g. a medicinal product, cosmetic, or general consumer product).',
        supplementaryInfo: 'Reference MDR Article 2(1) definition of a medical device. If the device is borderline, explain why it qualifies as a device and not another product category. Consider relevant MDCG guidance on borderline and classification.',
        fields: [
          { id: 'device_qualification_rationale', label: 'Rationale for Device Qualification', type: 'richtext', placeholder: 'Explain why this product meets the MDR definition of a medical device...' },
          { id: 'borderline_considerations', label: 'Borderline Considerations (if applicable)', type: 'textarea', placeholder: 'If the product could be classified as another product type, explain why it is a medical device...' },
        ],
      },
      {
        id: '1.1_f_risk_class',
        stepLabel: '(f) Risk Class & Classification Rules',
        requirementText: 'State the risk class of the device and provide justification for the classification rule(s) applied in accordance with Annex VIII.',
        supplementaryInfo: 'Identify which classification rule(s) from MDR Annex VIII apply. If multiple rules apply, state the highest class. Reference MDCG 2021-24 classification guidance if helpful.',
        fields: [
          { id: 'risk_class', label: 'Risk Class', type: 'select', options: [
            { value: 'I', label: 'Class I' },
            { value: 'Im', label: 'Class I (measuring)' },
            { value: 'Is', label: 'Class I (sterile)' },
            { value: 'Ir', label: 'Class I (reusable surgical)' },
            { value: 'IIa', label: 'Class IIa' },
            { value: 'IIb', label: 'Class IIb' },
            { value: 'III', label: 'Class III' },
          ] },
          { id: 'classification_rules', label: 'Applicable Classification Rule(s)', type: 'richtext', placeholder: 'e.g. Rule 11 (software intended to provide information for diagnostic or therapeutic decisions)...' },
          { id: 'classification_justification', label: 'Justification', type: 'richtext', placeholder: 'Provide the rationale for the selected classification rule(s) and resulting risk class...' },
        ],
      },
      {
        id: '1.1_g_novel_features',
        stepLabel: '(g) Novel Features',
        requirementText: 'Provide an explanation of any novel features of the device.',
        supplementaryInfo: 'Novel features may include new materials, new clinical applications, new technologies, or new modes of action. Novelty impacts the clinical evaluation strategy (e.g. requirement for clinical investigations).',
        fields: [
          { id: 'has_novel_features', label: 'Does the device incorporate novel features?', type: 'select', options: ['Yes', 'No'] },
          { id: 'novel_features_description', label: 'Description of Novel Features', type: 'richtext', placeholder: 'Describe what is novel and how it differs from existing devices on the market...' },
          { id: 'novel_features_impact', label: 'Impact on Clinical Evaluation Strategy', type: 'textarea', placeholder: 'How do novel features affect your clinical evaluation approach?...' },
        ],
      },
      {
        id: '1.1_h_accessories',
        stepLabel: '(h) Accessories & Combination Products',
        requirementText: 'Describe any accessories for the device, other devices and other products which are not devices that are intended to be used in combination with it.',
        supplementaryInfo: 'Include all accessories (MDR Article 2(2)), parts, and other products intended for combined use. Each accessory intended to be marketed as a medical device must have its own CE marking.',
        fields: [
          { id: 'accessories_list', label: 'Accessories and Combination Products', type: 'richtext', placeholder: 'List all accessories, companion devices, and non-device products intended for combined use...' },
          { id: 'accessories_regulatory_status', label: 'Regulatory Status of Accessories', type: 'textarea', placeholder: 'For each accessory, state whether it is a medical device, its CE marking status, and the manufacturer...' },
        ],
      },
      {
        id: '1.1_i_variants',
        stepLabel: '(i) Configurations / Variants',
        requirementText: 'Describe the different configurations/variants of the device intended to be made available on the market.',
        supplementaryInfo: 'Variants may differ in size, shape, material, software version, power supply, or accessories. Ensure each variant is covered by the same Basic UDI-DI where applicable.',
        fields: [
          { id: 'variants_description', label: 'Configurations and Variants', type: 'richtext', placeholder: 'List and describe all device configurations and variants (e.g. sizes, models, software versions)...' },
          { id: 'variants_differences', label: 'Key Differences Between Variants', type: 'textarea', placeholder: 'Summarize how variants differ and confirm they fall under the same technical documentation...' },
        ],
      },
      {
        id: '1.1_jkl_functional_elements',
        stepLabel: '(j-l) Functional Elements, Materials & Technical Specs',
        requirementText: 'Describe:\n(j) Key functional elements (parts, components, software, formulation, composition)\n(k) Raw materials incorporated into key functional elements and those making direct or indirect contact with the human body\n(l) Technical specifications (features, dimensions, performance attributes, etc.)',
        supplementaryInfo: 'This information feeds into biocompatibility assessment (ISO 10993), design verification, and manufacturing controls. Software of unknown provenance (SOUP) should be identified.',
        fields: [
          { id: 'functional_elements', label: '(j) Key Functional Elements', type: 'richtext', placeholder: 'List key parts, components, sub-assemblies, and software modules...' },
          { id: 'raw_materials', label: '(k) Raw Materials & Patient-Contact Materials', type: 'richtext', placeholder: 'List raw materials, especially those in contact with the human body (direct or indirect)...' },
          { id: 'technical_specifications', label: '(l) Technical Specifications', type: 'richtext', placeholder: 'Dimensions, weight, performance attributes, electrical characteristics, environmental conditions...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §1.2 Reference to Previous and Similar Generations
  // ═══════════════════════════════════════════════════════════
  '1.2': {
    clauseTitle: '1.2 — Reference to Previous and Similar Generations',
    evidenceRequired: false,
    steps: [
      {
        id: '1.2_previous_generations',
        stepLabel: 'Previous & Similar Devices',
        requirementText: 'Provide an overview of the previous generation(s) of the device, if any, and identify similar devices available on the EU or international markets.',
        supplementaryInfo: 'This supports clinical evaluation (equivalence assessment) and demonstrates the state of the art. Include predecessor devices from the same manufacturer and competitor devices.',
        fields: [
          { id: 'previous_generations', label: 'Previous Generation(s) of the Device', type: 'richtext', placeholder: 'Describe previous versions/generations produced by the manufacturer, key changes, and market history...' },
          { id: 'similar_devices', label: 'Similar Devices on EU/International Markets', type: 'richtext', placeholder: 'Identify similar devices (equivalents or competitors). For each, note: manufacturer, trade name, intended purpose, and key technical differences...' },
          { id: 'predicate_comparison', label: 'Comparison Summary', type: 'richtext', placeholder: 'Summarize technical, biological, and clinical similarities/differences with identified equivalent devices...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §2 Information Supplied by the Manufacturer
  // ═══════════════════════════════════════════════════════════
  '2': {
    clauseTitle: '2 — Information Supplied by the Manufacturer',
    evidenceRequired: false,
    steps: [
      {
        id: '2_labels',
        stepLabel: 'Labels and Packaging',
        requirementText: 'Include complete labelling for the device, including the label on the device itself and on the packaging. Labels must comply with MDR Annex I Chapter III (§23).',
        supplementaryInfo: 'Labels must include: manufacturer name and address, device description, UDI carrier, CE mark, class, lot/serial number, symbols per EN ISO 15223-1, and any required warnings.',
        fields: [
          { id: 'label_description', label: 'Label Content Summary', type: 'richtext', placeholder: 'Describe or reference the label content, including all required elements per MDR Annex I §23...' },
          { id: 'label_languages', label: 'Languages Provided', type: 'textarea', placeholder: 'List all languages in which labels are available...' },
          { id: 'label_documents', label: 'Label Artwork / Documents', type: 'doc_reference', required: true, placeholder: 'Link to label artwork files...' },
        ],
      },
      {
        id: '2_ifu',
        stepLabel: 'Instructions for Use (IFU)',
        requirementText: 'Include the complete Instructions for Use (IFU) in all required languages. The IFU must comply with MDR Annex I Chapter III (§23.4).',
        supplementaryInfo: 'IFU must include: intended purpose, user profile, contra-indications, warnings, precautions, performance characteristics, installation/calibration instructions, and cleaning/disinfection/sterilization information.',
        fields: [
          { id: 'ifu_summary', label: 'IFU Content Summary', type: 'richtext', placeholder: 'Summarize the key content of the IFU or confirm it addresses all requirements of Annex I §23.4...' },
          { id: 'ifu_languages', label: 'Languages Provided', type: 'textarea', placeholder: 'List all languages in which the IFU is available...' },
          { id: 'ifu_documents', label: 'IFU Document(s)', type: 'doc_reference', required: true, placeholder: 'Link to IFU documents...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §3.1 Design Information
  // ═══════════════════════════════════════════════════════════
  '3.1': {
    clauseTitle: '3.1 — Design Information',
    evidenceRequired: false,
    steps: [
      {
        id: '3.1_design_stages',
        stepLabel: 'Design and Development Stages',
        requirementText: 'Provide information that allows understanding of the design stages applied to the device, including an overview of the design and development plan.',
        supplementaryInfo: 'Reference your Design & Development Plan (per ISO 13485 §7.3). Include key design milestones, design reviews, and how design outputs trace to design inputs.',
        fields: [
          { id: 'design_development_overview', label: 'Design & Development Overview', type: 'richtext', placeholder: 'Describe the design stages, from concept through design transfer, including key milestones and reviews...' },
          { id: 'design_plan_reference', label: 'Design & Development Plan', type: 'doc_reference', required: true, placeholder: 'Link to the Design & Development Plan...' },
        ],
      },
      {
        id: '3.1_specifications',
        stepLabel: 'Design Specifications & Drawings',
        requirementText: 'Include complete information on the design specifications, including drawings, schematics, and component specifications.',
        supplementaryInfo: 'Design specifications should trace to user needs and design inputs. Include mechanical drawings, electrical schematics, software architecture diagrams, and component specifications.',
        fields: [
          { id: 'specifications_summary', label: 'Design Specifications Summary', type: 'richtext', placeholder: 'Summarize key design specifications, performance requirements, and acceptance criteria...' },
          { id: 'drawings_documents', label: 'Drawings & Schematics', type: 'doc_reference', required: true, placeholder: 'Link to design drawings, schematics, and specifications...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §3.2 Manufacturing Information
  // ═══════════════════════════════════════════════════════════
  '3.2': {
    clauseTitle: '3.2 — Manufacturing Information',
    evidenceRequired: false,
    steps: [
      {
        id: '3.2_a_processes',
        stepLabel: '(a) Manufacturing Processes',
        requirementText: 'Provide information on the manufacturing processes, including validation of manufacturing processes, assembly, final testing, packaging, and sterilization (if applicable).',
        supplementaryInfo: 'Include process flow diagrams. Identify special processes requiring validation (e.g. sterilization, welding, sealing). Reference IQ/OQ/PQ protocols and reports.',
        fields: [
          { id: 'manufacturing_processes', label: 'Manufacturing Process Description', type: 'richtext', placeholder: 'Describe key manufacturing processes, including assembly, testing, packaging, and sterilization...' },
          { id: 'process_validation', label: 'Process Validation Summary', type: 'richtext', placeholder: 'Summarize validation of special processes (e.g. sterilization validation, process qualification)...' },
          { id: 'process_documents', label: 'Process Documentation', type: 'doc_reference', required: false, placeholder: 'Link to process flow diagrams, validation protocols/reports...' },
        ],
      },
      {
        id: '3.2_b_sites',
        stepLabel: '(b) Manufacturing Sites & Suppliers',
        requirementText: 'Provide the identification of all manufacturing sites, including suppliers and sub-contractors, where design and manufacturing activities are performed.',
        supplementaryInfo: 'Include the name, address, and scope of activities for each site. This information is required for Notified Body audits and must match the QMS scope.',
        fields: [
          { id: 'manufacturing_sites', label: 'Manufacturing Sites', type: 'richtext', placeholder: 'List all manufacturing sites with name, address, and scope of activities performed at each site...' },
          { id: 'suppliers_subcontractors', label: 'Key Suppliers and Sub-contractors', type: 'richtext', placeholder: 'List critical suppliers and sub-contractors, including their scope (e.g. sterilization, PCB assembly, component supply)...' },
          { id: 'sites_documents', label: 'Site Documentation', type: 'doc_reference', required: false, placeholder: 'Link to supplier qualification records, site master files...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §4 General Safety and Performance Requirements
  // ═══════════════════════════════════════════════════════════
  '4': {
    clauseTitle: '4 — General Safety and Performance Requirements (GSPR)',
    evidenceRequired: true,
    steps: [
      {
        id: '4_a_applicable_gsprs',
        stepLabel: '(a) Applicable GSPRs',
        requirementText: 'Identify the GSPRs set out in Annex I that apply to the device and provide an explanation as to why other GSPRs do not apply.',
        supplementaryInfo: 'Create a GSPR checklist addressing each requirement of Annex I. For non-applicable requirements, provide a clear justification (e.g. "Not applicable — device does not contain software").',
        fields: [
          { id: 'applicable_gsprs', label: 'Applicable GSPRs', type: 'richtext', placeholder: 'List all applicable GSPRs from Annex I, or reference your GSPR checklist document...' },
          { id: 'non_applicable_justification', label: 'Non-Applicable GSPRs & Justification', type: 'richtext', placeholder: 'For each GSPR that does not apply, provide the justification...' },
          { id: 'gspr_checklist_reference', label: 'GSPR Checklist Document', type: 'doc_reference', required: true, placeholder: 'Link to GSPR checklist...' },
        ],
      },
      {
        id: '4_b_conformity_methods',
        stepLabel: '(b) Methods of Conformity Demonstration',
        requirementText: 'Describe the method or methods used to demonstrate conformity with each applicable GSPR.',
        supplementaryInfo: 'Methods may include: compliance with harmonised standards, compliance with common specifications, risk management, testing, clinical evaluation, or reference to other standards.',
        fields: [
          { id: 'conformity_methods', label: 'Methods of Conformity Demonstration', type: 'richtext', placeholder: 'For each applicable GSPR, describe the method used to demonstrate conformity...' },
        ],
      },
      {
        id: '4_c_standards',
        stepLabel: '(c) Harmonised Standards & Common Specifications',
        requirementText: 'Identify the harmonised standards, common specifications (CS), or other solutions applied to demonstrate conformity with each applicable GSPR.',
        supplementaryInfo: 'Reference the specific edition and sections of each standard applied. For harmonised standards, confirm they are listed in the Official Journal of the EU.',
        fields: [
          { id: 'harmonised_standards', label: 'Harmonised Standards Applied', type: 'richtext', placeholder: 'List all harmonised standards applied (e.g. EN ISO 14971:2019, EN IEC 62366-1:2020)...' },
          { id: 'common_specifications', label: 'Common Specifications Applied', type: 'richtext', placeholder: 'List any Common Specifications (CS) adopted under Article 9 that are applied...' },
          { id: 'standards_documents', label: 'Standards Compliance Documentation', type: 'doc_reference', required: false, placeholder: 'Link to standards compliance matrix or certificates...' },
        ],
      },
      {
        id: '4_d_evidence_identity',
        stepLabel: '(d) Evidence Documentation Identity',
        requirementText: 'Provide the precise identity of the controlled documents offering evidence of conformity with each GSPR, including document title, version, date, and the element of the GSPR to which each document relates.',
        supplementaryInfo: 'This creates the traceability matrix between GSPRs and supporting evidence. Use a structured table or matrix to clearly map each GSPR to its supporting controlled document(s).',
        fields: [
          { id: 'evidence_traceability', label: 'Evidence Traceability Summary', type: 'richtext', placeholder: 'Provide or reference a traceability matrix mapping each applicable GSPR to the specific controlled document(s) that provide evidence of conformity...' },
          { id: 'traceability_matrix_doc', label: 'Traceability Matrix Document', type: 'doc_reference', required: true, placeholder: 'Link to the GSPR traceability matrix...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §5 Benefit-Risk Analysis and Risk Management
  // ═══════════════════════════════════════════════════════════
  '5': {
    clauseTitle: '5 — Benefit-Risk Analysis and Risk Management',
    evidenceRequired: true,
    steps: [
      {
        id: '5_a_benefit_risk',
        stepLabel: '(a) Benefit-Risk Analysis',
        requirementText: 'Provide the benefit-risk analysis referred to in Sections 1 and 8 of Annex I.',
        supplementaryInfo: 'The benefit-risk analysis demonstrates that the residual risks associated with each hazard, as well as the overall residual risk, are acceptable when weighed against the intended clinical benefits. Reference ISO 14971 for the risk management process.',
        fields: [
          { id: 'benefit_risk_analysis', label: 'Benefit-Risk Analysis Summary', type: 'richtext', placeholder: 'Summarize the benefit-risk determination: clinical benefits vs. residual risks, acceptability conclusion...' },
          { id: 'benefit_risk_document', label: 'Benefit-Risk Analysis Document', type: 'doc_reference', required: true, placeholder: 'Link to the Benefit-Risk Analysis report...' },
        ],
      },
      {
        id: '5_b_risk_management',
        stepLabel: '(b) Risk Management Solutions & Results',
        requirementText: 'Provide the solutions adopted and the results of the risk management referred to in Section 3 of Annex I.',
        supplementaryInfo: 'Include the risk management plan, hazard identification, risk estimation, risk evaluation, risk control measures, and the residual risk evaluation. The Risk Management Report should demonstrate that all identified risks have been controlled to an acceptable level.',
        fields: [
          { id: 'risk_management_summary', label: 'Risk Management Summary', type: 'richtext', placeholder: 'Summarize risk control measures implemented, residual risk levels, and the overall risk management conclusion...' },
          { id: 'risk_management_file', label: 'Risk Management File', type: 'doc_reference', required: true, placeholder: 'Link to the Risk Management File (Plan, FMEA/FTA, Report)...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §6.1 Pre-clinical and Clinical Data
  // ═══════════════════════════════════════════════════════════
  '6.1': {
    clauseTitle: '6.1 — Product Verification and Validation: Pre-clinical and Clinical Data',
    evidenceRequired: true,
    steps: [
      {
        id: '6.1_a_test_results',
        stepLabel: '(a) Pre-clinical Test Results',
        requirementText: 'Provide results of all pre-clinical tests, including bench testing, biocompatibility evaluation, physical, chemical, microbiological, and electrical safety testing.',
        supplementaryInfo: 'Testing should cover all relevant aspects per the applicable standards (e.g. IEC 60601-1 for electrical safety, ISO 10993 for biocompatibility, IEC 62133 for batteries). Include test protocols, acceptance criteria, and results.',
        fields: [
          { id: 'preclinical_testing_summary', label: 'Pre-clinical Testing Summary', type: 'richtext', placeholder: 'Summarize all pre-clinical tests performed, results, and conclusions...' },
          { id: 'biocompatibility_evaluation', label: 'Biocompatibility Evaluation', type: 'richtext', placeholder: 'Summarize the biological evaluation per ISO 10993-1, endpoints evaluated, and results...' },
          { id: 'test_reports', label: 'Test Reports', type: 'doc_reference', required: true, placeholder: 'Link to pre-clinical test reports...' },
        ],
      },
      {
        id: '6.1_b_sterilization',
        stepLabel: '(b) Sterilization Validation & Shelf Life',
        requirementText: 'Provide results of sterilization process validation and results of shelf-life and transport testing (packaging validation).',
        supplementaryInfo: 'For sterile devices, include sterilization validation per the appropriate standard (e.g. ISO 11135 for EO, ISO 11137 for radiation). Shelf-life testing should cover accelerated and/or real-time ageing per ASTM F1980.',
        fields: [
          { id: 'sterilization_validation', label: 'Sterilization Validation Summary', type: 'richtext', placeholder: 'Describe the sterilization method, validation approach, and results. If not applicable, state why...' },
          { id: 'shelf_life_testing', label: 'Shelf Life / Stability Testing', type: 'richtext', placeholder: 'Summarize accelerated ageing and/or real-time ageing test results, transport/packaging validation...' },
          { id: 'sterilization_documents', label: 'Sterilization & Shelf Life Documents', type: 'doc_reference', required: false, placeholder: 'Link to sterilization validation and stability test reports...' },
        ],
      },
      {
        id: '6.1_c_software',
        stepLabel: '(c) Software Verification and Validation',
        requirementText: 'Provide evidence of software verification and validation, including documentation of the software development lifecycle per IEC 62304.',
        supplementaryInfo: 'Include the software development plan, requirements specification, architecture description, unit/integration/system test results, and traceability matrix. For SaMD, reference the software classification per MDR Rule 11 and IEC 62304 safety class.',
        fields: [
          { id: 'software_applicable', label: 'Does the device incorporate software?', type: 'select', options: ['Yes', 'No', 'N/A — No software'] },
          { id: 'software_vv_summary', label: 'Software V&V Summary', type: 'richtext', placeholder: 'Summarize the software verification and validation activities, including the safety classification and test results...' },
          { id: 'software_documents', label: 'Software Development Documentation', type: 'doc_reference', required: false, placeholder: 'Link to software development plan, V&V reports, traceability matrix...' },
        ],
      },
      {
        id: '6.1_d_cer',
        stepLabel: '(d) Clinical Evaluation Report',
        requirementText: 'Include the Clinical Evaluation Report (CER) and its updates in accordance with Annex XIV Part A, and the clinical evaluation plan.',
        supplementaryInfo: 'The CER must follow MEDDEV 2.7/1 Rev.4 or the MDR Annex XIV Part A requirements. It should include: scope, clinical background, state of the art, device description, equivalence assessment (if applicable), clinical data analysis, and benefit-risk conclusions.',
        fields: [
          { id: 'cer_summary', label: 'CER Summary', type: 'richtext', placeholder: 'Summarize the key conclusions of the Clinical Evaluation Report...' },
          { id: 'clinical_evaluation_plan', label: 'Clinical Evaluation Plan', type: 'doc_reference', required: true, placeholder: 'Link to the Clinical Evaluation Plan...' },
          { id: 'cer_document', label: 'Clinical Evaluation Report', type: 'doc_reference', required: true, placeholder: 'Link to the CER...' },
        ],
      },
      {
        id: '6.1_e_pmcf',
        stepLabel: '(e) PMCF Plan and Evaluation Report',
        requirementText: 'Include the PMCF plan and PMCF evaluation report in accordance with Annex XIV Part B, or a justification as to why a PMCF is not applicable.',
        supplementaryInfo: 'The PMCF plan defines ongoing clinical data collection methods (e.g. registries, surveys, literature review, PMCF studies). The PMCF evaluation report presents findings and feeds back into the CER update cycle.',
        fields: [
          { id: 'pmcf_applicable', label: 'Is PMCF applicable?', type: 'select', options: ['Yes', 'No — justify below'] },
          { id: 'pmcf_summary', label: 'PMCF Plan / Evaluation Summary', type: 'richtext', placeholder: 'Summarize the PMCF plan, methods of data collection, and status of the evaluation report...' },
          { id: 'pmcf_justification', label: 'Justification (if PMCF not applicable)', type: 'textarea', placeholder: 'If PMCF is not applicable, provide justification...' },
          { id: 'pmcf_documents', label: 'PMCF Documents', type: 'doc_reference', required: false, placeholder: 'Link to PMCF plan and evaluation report...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §6.2 Additional Information in Specific Cases
  // ═══════════════════════════════════════════════════════════
  '6.2': {
    clauseTitle: '6.2 — Additional Information in Specific Cases',
    evidenceRequired: false,
    steps: [
      {
        id: '6.2_a_medicinal',
        stepLabel: '(a) Medicinal Substance',
        requirementText: 'Where a device incorporates, as an integral part, a substance which, if used separately, may be considered to be a medicinal product: provide evidence of the quality, safety, and usefulness of that substance.',
        supplementaryInfo: 'Applies to drug-device combination products. Requires a separate opinion from a Medicines Authority (EMA or national competent authority) on the medicinal substance.',
        fields: [
          { id: 'medicinal_applicable', label: 'Does the device incorporate a medicinal substance?', type: 'select', options: ['Yes', 'No — not applicable'] },
          { id: 'medicinal_substance_details', label: 'Medicinal Substance Details', type: 'richtext', placeholder: 'Identify the substance, its function in the device, and provide evidence of quality, safety, and usefulness...' },
          { id: 'medicinal_documents', label: 'Supporting Documentation', type: 'doc_reference', required: false, placeholder: 'Link to supporting evidence, Medicines Authority opinion...' },
        ],
      },
      {
        id: '6.2_b_tissues',
        stepLabel: '(b) Human/Animal Tissues or Cells',
        requirementText: 'Where a device is manufactured utilising tissues or cells of human or animal origin, or their derivatives: provide documentation on the source materials and compliance with relevant regulations.',
        supplementaryInfo: 'Subject to additional scrutiny per MDR Article 1(6)(g). May require TSE/BSE risk assessment for animal-origin materials.',
        fields: [
          { id: 'tissues_applicable', label: 'Does the device utilize human or animal tissues/cells?', type: 'select', options: ['Yes', 'No — not applicable'] },
          { id: 'tissues_details', label: 'Tissue/Cell Origin Details', type: 'richtext', placeholder: 'Describe the source materials, origin, processing, and compliance with sourcing regulations...' },
          { id: 'tissues_documents', label: 'Supporting Documentation', type: 'doc_reference', required: false, placeholder: 'Link to tissue sourcing documentation, TSE/BSE risk assessment...' },
        ],
      },
      {
        id: '6.2_c_cmr',
        stepLabel: '(c) CMR / Endocrine-Disrupting Substances',
        requirementText: 'Where a device contains substances that are carcinogenic, mutagenic, or toxic to reproduction (CMR), or substances with endocrine-disrupting properties: provide justification for their presence.',
        supplementaryInfo: 'Per MDR Annex I §10.4, the presence of CMR 1A/1B or endocrine-disrupting substances above 0.1% w/w must be justified. Provide a benefit-risk analysis for the substance.',
        fields: [
          { id: 'cmr_applicable', label: 'Does the device contain CMR or endocrine-disrupting substances?', type: 'select', options: ['Yes', 'No — not applicable'] },
          { id: 'cmr_details', label: 'Substance Details and Justification', type: 'richtext', placeholder: 'Identify the substance(s), concentration, function, and provide a benefit-risk justification for their presence...' },
          { id: 'cmr_documents', label: 'Supporting Documentation', type: 'doc_reference', required: false, placeholder: 'Link to material composition analysis, justification report...' },
        ],
      },
      {
        id: '6.2_d_absorbed_substances',
        stepLabel: '(d) Absorbed / Locally Dispersed Substances',
        requirementText: 'Where a device is composed of substances or combinations of substances that are intended to be introduced into the human body and are absorbed or locally dispersed: provide relevant pharmacokinetic data.',
        supplementaryInfo: 'This applies to devices that deliver substances absorbed by the body (e.g. drug-eluting stents, medicated dressings). Include pharmacokinetic/absorption study data.',
        fields: [
          { id: 'absorbed_applicable', label: 'Does the device deliver substances absorbed by the body?', type: 'select', options: ['Yes', 'No — not applicable'] },
          { id: 'absorbed_details', label: 'Substance and Pharmacokinetic Details', type: 'richtext', placeholder: 'Describe the substance, delivery mechanism, absorption profile, and supporting pharmacokinetic data...' },
          { id: 'absorbed_documents', label: 'Supporting Documentation', type: 'doc_reference', required: false, placeholder: 'Link to pharmacokinetic study reports, absorption data...' },
        ],
      },
      {
        id: '6.2_e_measuring',
        stepLabel: '(e) Measuring Function',
        requirementText: 'Where a device has a measuring function: provide information on the accuracy and precision, including the measurement uncertainty, the traceability of measurement, and calibration.',
        supplementaryInfo: 'Applies to devices with a measuring function (Class Im). Include metrological traceability, measurement uncertainty budget, and calibration procedures.',
        fields: [
          { id: 'measuring_applicable', label: 'Does the device have a measuring function?', type: 'select', options: ['Yes', 'No — not applicable'] },
          { id: 'measuring_details', label: 'Measurement Accuracy & Traceability', type: 'richtext', placeholder: 'Describe measurement accuracy, precision, measurement uncertainty, and metrological traceability...' },
          { id: 'measuring_documents', label: 'Supporting Documentation', type: 'doc_reference', required: false, placeholder: 'Link to accuracy study reports, calibration procedures...' },
        ],
      },
      {
        id: '6.2_f_connected',
        stepLabel: '(f) Connected to Other Devices',
        requirementText: 'Where a device is intended to be connected to and interact with other devices or equipment: provide information on the interoperability and compatibility.',
        supplementaryInfo: 'Address IT network integration, data interfaces (e.g. HL7 FHIR, DICOM), cybersecurity considerations, and electromagnetic compatibility with connected equipment.',
        fields: [
          { id: 'connected_applicable', label: 'Is the device connected to other devices?', type: 'select', options: ['Yes', 'No — not applicable'] },
          { id: 'connected_details', label: 'Interoperability & Compatibility', type: 'richtext', placeholder: 'Describe device connectivity, communication protocols, interoperability testing, and cybersecurity measures...' },
          { id: 'connected_documents', label: 'Supporting Documentation', type: 'doc_reference', required: false, placeholder: 'Link to interoperability test reports, cybersecurity documentation...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §7 Post-Market Surveillance
  // ═══════════════════════════════════════════════════════════
  '7': {
    clauseTitle: '7 — Post-Market Surveillance',
    evidenceRequired: false,
    steps: [
      {
        id: '7_pms_plan',
        stepLabel: 'PMS Plan',
        requirementText: 'Include the Post-Market Surveillance (PMS) plan as required by Article 84. The PMS plan shall cover the collection and utilization of available information on the device throughout its lifetime.',
        supplementaryInfo: 'The PMS plan should address: data sources (complaints, vigilance, literature, registries), data collection methods, analysis methodology, and how findings feed back into the risk management and clinical evaluation processes.',
        fields: [
          { id: 'pms_plan_summary', label: 'PMS Plan Summary', type: 'richtext', placeholder: 'Summarize the PMS plan: data sources, collection methods, analysis approach, and feedback mechanisms...' },
          { id: 'pms_plan_document', label: 'PMS Plan Document', type: 'doc_reference', required: true, placeholder: 'Link to the PMS Plan...' },
        ],
      },
      {
        id: '7_psur_status',
        stepLabel: 'PSUR / PMS Report Status',
        requirementText: 'For Class IIa, IIb, and III devices: include the PSUR as per Article 86. For Class I devices: include the PMS report per Article 85. Also address the status of PMCF activities.',
        supplementaryInfo: 'The PSUR/PMS Report should include: summary of PMS data, trend analysis, impact on benefit-risk determination, conclusions on the need for corrective/preventive actions, and update to the CER.',
        fields: [
          { id: 'psur_or_pms_report', label: 'PSUR / PMS Report Summary', type: 'richtext', placeholder: 'Summarize the latest PSUR (Class IIa/IIb/III) or PMS Report (Class I), including key findings and conclusions...' },
          { id: 'psur_document', label: 'PSUR / PMS Report Document', type: 'doc_reference', required: true, placeholder: 'Link to the PSUR or PMS Report...' },
          { id: 'pmcf_status', label: 'PMCF Activities Status', type: 'richtext', placeholder: 'Summarize the current status of PMCF activities and any findings...' },
        ],
      },
    ],
  },
};
