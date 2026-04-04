/**
 * IEC 60601-1 Clause-Specific Form Field Definitions — Step-by-Step Structure
 * 
 * Each clause is split into individual steps matching numbered requirements.
 * Each step has its own requirement text and input fields.
 */

export interface ClauseFieldOption {
  value: string;
  label: string;
}

export interface ClauseField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'richtext' | 'hazard_linker' | 'doc_reference';
  options?: (string | ClauseFieldOption)[];
  placeholder?: string;
  /** For doc_reference fields: true = required (shows *), false/undefined = optional */
  required?: boolean;
  /** Practical guidance explaining what this field means and what evidence to provide */
  helpText?: string;
}

export interface ClauseTable {
  id: string;
  title: string;
  columns: string[];
}

export interface ClauseStep {
  id: string;
  stepLabel: string;
  requirementText: string;
  supplementaryInfo?: string;
  fields?: ClauseField[];
  tables?: ClauseTable[];
}

export interface ClauseFormConfig {
  clauseTitle: string;
  steps: ClauseStep[];
  /** Whether evidence/references are required (true=*, false=optional, undefined=no indicator) */
  evidenceRequired?: boolean;
}

export const IEC_60601_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  // ═══════════════════════════════════════════════════════════
  // §1 Scope, object and related standards
  // ═══════════════════════════════════════════════════════════
  '1.1': {
    clauseTitle: '1.1 — Scope',
    evidenceRequired: false,
    steps: [
      {
        id: '1.1_applied_parts',
        stepLabel: 'Applied Parts & Energy Transfer',
        requirementText: 'IEC 60601-1 applies to ME equipment that has an Applied Part (parts that physically contact the patient), transfers energy to or from the patient, and is intended for diagnosis, treatment, monitoring, or rehabilitation.\n\nIdentify all applied parts and confirm energy transfer.',
        supplementaryInfo: 'Applied Parts are the parts of ME equipment that in normal use necessarily come into physical contact with the patient. Examples: seat pads, spinal pads, shoulder braces, electrodes, sensors.',
        fields: [
          { id: 'applied_parts_list', label: 'List all Applied Parts of the device', type: 'textarea', placeholder: 'e.g. Seat Pad, Spinal Pads, Shoulder Braces, Sensors...' },
          { id: 'energy_transfer', label: 'Does the device transfer energy to or from the patient?', type: 'select', options: [
            { value: 'to_patient', label: 'Yes — To patient' },
            { value: 'from_patient', label: 'Yes — From patient' },
            { value: 'bidirectional', label: 'Yes — Bidirectional' },
            { value: 'no', label: 'No' },
          ] },
          { id: 'energy_type', label: 'Type of energy transferred', type: 'select', options: [
            { value: 'Mechanical', label: 'Mechanical (force, vibration, pressure)' },
            { value: 'Electrical', label: 'Electrical (stimulation, current)' },
            { value: 'Thermal', label: 'Thermal (heating, cooling)' },
            { value: 'Electromagnetic', label: 'Electromagnetic (RF, microwave, light/laser)' },
            { value: 'Acoustic', label: 'Acoustic (ultrasound, sound waves)' },
            { value: 'Hydraulic', label: 'Hydraulic' },
            { value: 'Pneumatic', label: 'Pneumatic' },
            { value: 'Multiple', label: 'Multiple (specify in rationale)' },
            { value: 'Other', label: 'Other' },
          ] },
          { id: 'intended_use_category', label: 'Intended use category', type: 'select', options: ['Diagnosis', 'Treatment', 'Monitoring', 'Rehabilitation', 'Multiple (specify in rationale)'] },
        ],
      },
      {
        id: '1.1_me_declaration',
        stepLabel: 'ME Equipment Declaration',
        requirementText: 'To fall under IEC 60601-1, the device must qualify as ME Equipment. Confirm that the device meets all three criteria:\n\n1. Has an Applied Part\n2. Transfers energy to or from the patient\n3. Is intended for diagnosis, treatment, monitoring, or rehabilitation of a patient',
        supplementaryInfo: 'In your Device Description, explicitly state that the device is "ME Equipment" because it provides treatment/diagnosis/monitoring via a controlled energy interface.',
        fields: [
          { id: 'is_me_equipment', label: 'Does the device qualify as ME Equipment?', type: 'select', options: ['Yes — ME Equipment', 'Yes — Part of ME System', 'No — does not qualify'] },
          { id: 'device_description_ref', label: 'Device Description document reference', type: 'richtext', placeholder: 'e.g. DD-001 Rev A, Section 2.1' },
          { id: 'me_rationale', label: 'Rationale for ME Equipment classification', type: 'textarea', placeholder: 'Explain how the device meets the three criteria for ME Equipment classification...' },
        ],
      },
      {
        id: '1.1_exclusions',
        stepLabel: 'Scope Exclusions',
        requirementText: 'Identify any exclusions from scope. IEC 60601-1 does not apply to:\n- In-vitro diagnostic equipment (covered by IEC 61010)\n- Equipment not intended for medical purposes\n- Equipment with specific exclusions listed in particular standards',
        fields: [
          { id: 'ivd_exclusion', label: 'Is the device an IVD (excluded under IEC 61010)?', type: 'select', options: ['No — not IVD', 'Yes — IVD, excluded from 60601-1'] },
          { id: 'non_medical_exclusion', label: 'Are any components non-medical and excluded?', type: 'select', options: ['No — all components are medical', 'Yes — some components excluded (detail below)'] },
          { id: 'exclusions_detail', label: 'List any exclusions from scope with rationale', type: 'textarea', placeholder: 'Detail any excluded components or functions and the rationale...' },
        ],
      },
    ],
  },

  '1.2': {
    clauseTitle: '1.2 — Object',
    evidenceRequired: false,
    steps: [
      {
        id: '1.2_basic_safety',
        stepLabel: 'Basic Safety',
        requirementText: 'The object of IEC 60601-1 is to establish requirements for Basic Safety — freedom from unacceptable risk directly caused by physical hazards.\n\nIdentify the specific physical hazards that apply to this device.',
        supplementaryInfo: 'Basic Safety covers hazards such as: structural integrity failure (frame breaking), electrical shock, mechanical hazards (pinch points, moving parts), thermal hazards, radiation, and chemical hazards.',
        fields: [
          { id: 'structural_hazards', label: 'Structural/mechanical hazards identified', type: 'hazard_linker', placeholder: 'Notes about structural/mechanical hazards not yet in the HTM...' },
          { id: 'electrical_hazards', label: 'Electrical hazards identified', type: 'hazard_linker', placeholder: 'Notes about electrical hazards not yet in the HTM...' },
          { id: 'thermal_hazards', label: 'Thermal hazards identified', type: 'hazard_linker', placeholder: 'Notes about thermal hazards not yet in the HTM...' },
          { id: 'other_physical_hazards', label: 'Other physical hazards', type: 'hazard_linker', placeholder: 'Notes about other physical hazards not yet in the HTM...' },
          { id: 'basic_safety_rmf_ref', label: 'Risk Management File reference for Basic Safety', type: 'doc_reference', placeholder: 'e.g. Section 4.2' },
        ],
      },
      {
        id: '1.2_essential_performance',
        stepLabel: 'Essential Performance',
        requirementText: 'Essential Performance is the clinical function(s) that, if lost or degraded beyond specified limits, would result in an unacceptable risk to the patient.\n\nIdentify all Essential Performance features and link them to hazards in the risk file.',
        supplementaryInfo: 'Example: If a Spinal Tracking Sensor gives a false reading, leading the user to over-rotate → this is Essential Performance. Map each EP feature to its corresponding Hazard ID.',
        fields: [
          { id: 'ep_features', label: 'Essential Performance features', type: 'ssot_ep_display' as any, placeholder: 'Defined in Device Definition → Purpose' },
          { id: 'ep_rmf_ref', label: 'Risk Management File reference for Essential Performance', type: 'doc_reference', placeholder: 'e.g. Section 5.3' },
        ],
        tables: [
          {
            id: 'table_1_2_ep',
            title: 'Essential Performance → Hazard Mapping',
            columns: [
              'Essential Performance Feature',
              'Hazard ID (from Risk File)',
              'Consequence if Lost/Degraded',
              'Risk Acceptable Without EP? (Yes/No)',
            ],
          },
        ],
      },
    ],
  },

  '1.3': {
    clauseTitle: '1.3 — Collateral Standards',
    evidenceRequired: false,
    steps: [
      {
        id: '1.3_collateral',
        stepLabel: 'Identify applicable collateral standards',
        requirementText: 'IEC 60601-1 is a "General" standard. Section 1.3 requires identification of which Collateral Standards (60601-1-X) apply to this device.\n\nFor each collateral standard, indicate applicability and provide justification.',
        supplementaryInfo: 'Common collateral standards:\n• IEC 60601-1-2: EMC — applies to virtually all ME equipment\n• IEC 60601-1-6: Usability — crucial for devices with user interfaces\n• IEC 60601-1-8: Alarm systems — if device sounds warnings\n• IEC 60601-1-11: Home healthcare — only if home-use version exists\n• IEC 60601-1-12: Emergency medical services — if used in EMS environment',
        fields: [
          { id: 'collateral_60601_1_2', label: 'IEC 60601-1-2 (EMC) applicable?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'collateral_60601_1_2_justification', label: 'IEC 60601-1-2 justification', type: 'textarea', placeholder: 'Why this collateral standard applies or does not apply...' },
          { id: 'collateral_60601_1_3', label: 'IEC 60601-1-3 (Radiation protection — diagnostic X-ray) applicable?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'collateral_60601_1_3_justification', label: 'IEC 60601-1-3 justification', type: 'textarea', placeholder: 'e.g. Device does not emit or use diagnostic X-ray radiation...' },
          { id: 'collateral_60601_1_6', label: 'IEC 60601-1-6 (Usability) applicable?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'collateral_60601_1_6_justification', label: 'IEC 60601-1-6 justification', type: 'textarea', placeholder: 'e.g. Device has a 10" touchscreen UI requiring usability evaluation...' },
          { id: 'collateral_60601_1_8', label: 'IEC 60601-1-8 (Alarm systems) applicable?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'collateral_60601_1_8_justification', label: 'IEC 60601-1-8 justification', type: 'textarea', placeholder: 'e.g. Device sounds a warning when ROM limit is reached...' },
          { id: 'collateral_60601_1_9', label: 'IEC 60601-1-9 (Environmentally conscious design) applicable?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'collateral_60601_1_9_justification', label: 'IEC 60601-1-9 justification', type: 'textarea', placeholder: 'e.g. Environmentally conscious design practices applied per organizational policy...' },
          { id: 'collateral_60601_1_10', label: 'IEC 60601-1-10 (Physiologic closed-loop controllers) applicable?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'collateral_60601_1_10_justification', label: 'IEC 60601-1-10 justification', type: 'textarea', placeholder: 'e.g. Device does not incorporate a physiologic closed-loop controller...' },
          { id: 'collateral_60601_1_11', label: 'IEC 60601-1-11 (Home healthcare environment) applicable?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'collateral_60601_1_11_justification', label: 'IEC 60601-1-11 justification', type: 'textarea', placeholder: 'Only applicable if a home-use version of the device exists or is planned...' },
          { id: 'collateral_60601_1_12', label: 'IEC 60601-1-12 (Emergency medical services environment) applicable?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'collateral_60601_1_12_justification', label: 'IEC 60601-1-12 justification', type: 'textarea', placeholder: 'e.g. Device is not intended for use in emergency medical services environments...' },
          { id: 'other_collaterals', label: 'Other applicable collateral standards', type: 'textarea' },
        ],
      },
    ],
  },

  '1.4': {
    clauseTitle: '1.4 — Particular Standards',
    evidenceRequired: false,
    steps: [
      {
        id: '1.4_vertical_check',
        stepLabel: 'Check for vertical standard',
        requirementText: 'Particular standards in the IEC 60601-2-X series specify requirements for specific types of ME equipment. Where a particular standard exists, it takes precedence over the general standard.\n\nDetermine if a specific 60601-2-X vertical standard exists for this device type.',
        supplementaryInfo: 'For exercise/rehabilitation equipment, check if a specific vertical standard applies. If not, follow the general 60601-1 requirements plus device-specific ISO standards (e.g., ISO 20957 for stationary training equipment).',
        fields: [
          { id: 'has_particular_standard', label: 'Does a specific IEC 60601-2-X standard exist for this device type?', type: 'select', options: ['Yes — particular standard identified', 'No — no particular standard exists'] },
          { id: 'particular_standard_id', label: 'Applicable particular standard', type: 'text', placeholder: 'e.g. IEC 60601-2-16 (Haemodialysis), IEC 60601-2-10 (Nerve/muscle stimulators)' },
        ],
      },
      {
        id: '1.4_alternative_standards',
        stepLabel: 'Alternative / supplementary standards',
        requirementText: 'When no particular standard (IEC 60601-2-X) exists, identify any alternative or supplementary standards that apply to this device type.\n\nThese may include ISO standards for the specific equipment category.',
        fields: [
          { id: 'alternative_standards', label: 'Alternative or supplementary standards applicable', type: 'textarea', placeholder: 'e.g. ISO 20957 (Stationary training equipment), ISO 10535 (Hoists for transfer)...' },
          { id: 'no_particular_rationale', label: 'Rationale for "no particular standard" determination', type: 'textarea', placeholder: 'Explain why no IEC 60601-2-X standard applies and how compliance is achieved through general + alternative standards...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §2 Normative references
  // ═══════════════════════════════════════════════════════════
  '2.1': {
    clauseTitle: '2.1 — Normative References',
    evidenceRequired: false,
    steps: [
      {
        id: '2.1_references',
        stepLabel: 'List normative references',
        requirementText: 'The documents referenced in IEC 60601-1 are indispensable for the application of this standard. For dated references, only the edition cited applies. For undated references, the latest edition applies.\n\nList all normative references applicable to this ME equipment.',
        fields: [
          { id: 'normative_references', label: 'List of applicable normative references', type: 'richtext', placeholder: 'e.g. ISO 14971, IEC 62366-1, IEC 62304...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §3 Terms and definitions
  // ═══════════════════════════════════════════════════════════
  '3.1': {
    clauseTitle: '3.1 — Terms and Definitions',
    evidenceRequired: false,
    steps: [
      {
        id: '3.1_terms',
        stepLabel: 'Confirm key definitions',
        requirementText: 'Confirm that the definitions used throughout the technical documentation are consistent with IEC 60601-1 clause 3.\n\nKey terms: ME equipment, ME system, applied part, basic safety, essential performance, normal condition, single fault condition, means of protection.',
        fields: [
          { id: 'definitions_confirmed', label: 'Are all key definitions correctly applied in the technical documentation?', type: 'select', options: ['Yes', 'No — deviations documented', 'Review needed'] },
          { id: 'definitions_notes', label: 'Notes on definitions or deviations', type: 'textarea' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §4 General requirements (existing + new)
  // ═══════════════════════════════════════════════════════════
  '4.1': {
    clauseTitle: '4.1 — Conditions for Application',
    steps: [
      {
        id: '4.1_application',
        stepLabel: 'Conditions for application',
        requirementText: 'ME equipment shall comply with the requirements of this standard when operated under the conditions specified by the manufacturer, including:\n- Normal use\n- Reasonably foreseeable misuse\n- Environmental conditions for transport, storage and operation',
        fields: [
          { id: 'intended_use_defined', label: 'Is the intended use clearly defined?', type: 'select', options: ['Yes', 'No'] },
          { id: 'foreseeable_misuse', label: 'Has reasonably foreseeable misuse been identified?', type: 'select', options: ['Yes', 'No'] },
          { id: 'conditions_location', label: 'Location of conditions for application in documentation', type: 'doc_reference' },
        ],
      },
    ],
  },

  '4.2': {
    clauseTitle: '4.2 — Risk management process for ME equipment',
    steps: [
      {
        id: '4.2.1_general',
        stepLabel: '4.2.1 — General risk management requirements',
        requirementText: 'The manufacturer shall apply the risk management process as defined in ISO 14971 to the ME Equipment or ME System.\n\nThe risk management process shall address at minimum:\n- Intended use and reasonably foreseeable misuse\n- Identification of known or foreseeable hazards associated with the ME Equipment in both normal and fault conditions\n- Estimation and evaluation of risks\n- Control of risks and verification of effectiveness of risk control measures',
        supplementaryInfo: 'ISO 14971 is the foundational risk management standard referenced by IEC 60601-1. The manufacturer must demonstrate that the full risk management process (hazard identification → risk estimation → risk evaluation → risk control → residual risk evaluation) has been applied.',
        fields: [
          { id: 'rmp_reference', label: 'Risk Management Plan document reference', type: 'doc_reference' },
          { id: 'rmf_reference', label: 'Risk Management File document reference', type: 'doc_reference' },
          { id: 'risk_acceptability_criteria', label: 'Have risk acceptability criteria been defined in the Risk Management Plan?', type: 'select', options: ['Yes — criteria defined', 'No — criteria not yet defined'] },
          { id: 'risk_acceptability_detail', label: 'Describe the risk acceptability criteria or reference the relevant section of the RMP', type: 'richtext', placeholder: 'e.g. Risk acceptability matrix per RMP-001 Section 5.3, using severity × probability criteria aligned with ISO 14971:2019 Annex C...' },
          { id: 'rmp_covers_normal_and_fault', label: 'Does the risk management process address both normal and single fault conditions?', type: 'select', options: ['Yes', 'No — needs update'] },
        ],
      },
      {
        id: '4.2.2_particular',
        stepLabel: '4.2.2 — Particular standards',
        requirementText: 'Where particular standards exist within the IEC 60601 series for the type of ME Equipment, the manufacturer shall apply the risk management requirements specified in those particular standards in addition to the general requirements of this clause.\n\nParticular standards may specify additional hazards, test methods, or risk mitigation requirements specific to the device type.',
        supplementaryInfo: 'Particular standards (e.g., IEC 60601-2-xx) often contain clause-specific risk requirements that supplement or modify the general standard. Check whether your device type has an applicable particular standard.',
        fields: [
          { id: 'applicable_particular_standards', label: 'List all applicable IEC 60601-2-xx particular standards', type: 'textarea', placeholder: 'e.g. IEC 60601-2-10 (Nerve and muscle stimulators), IEC 60601-2-46 (Operating tables)...' },
          { id: 'particular_risk_requirements_addressed', label: 'Have the risk management requirements from all applicable particular standards been incorporated?', type: 'select', options: ['Yes — all addressed', 'Partially — some outstanding', 'No particular standards apply', 'Not yet assessed'] },
          { id: 'particular_standards_evidence', label: 'Evidence or rationale for particular standards risk compliance', type: 'richtext', placeholder: 'Reference the sections in your risk management file where particular standard requirements are addressed...' },
        ],
      },
      {
        id: '4.2.3_hazards',
        stepLabel: '4.2.3 — Hazards identified in the IEC 60601 series',
        requirementText: '4.2.3.1 HAZARDS identified in the IEC 60601-series\n\nb) Manufacturer has defined risk acceptability criteria in the risk management plan.\n\nc) When no specific technical requirements provided, manufacturer has determined hazards or hazardous situations exist.\n\n- Hazards or hazardous situations have been evaluated using the risk management process.\n\n4.2.3.2 Manufacturer has addressed hazards or hazardous situations not specifically addressed in the IEC 60601-1 series.',
        fields: [
          { id: 'risks_not_addressed', label: 'Please list all risks, if any, that are not addressed by IEC 60601-1 and its collaterals/particulars as applicable', type: 'textarea' },
        ],
      },
    ],
  },

  '4.3': {
    clauseTitle: '4.3 — Essential Performance',
    steps: [
      {
        id: '4.3_step1',
        stepLabel: 'Identify clinical functions',
        requirementText: 'During risk analysis, the manufacturer shall identify the performance of the clinical function(s) of the ME Equipment or ME System, other than that related to basic safety, that is necessary to achieve its intended use or that could affect the safety of the ME Equipment or ME System.',
        fields: [
          { id: 'ep_location', label: 'Location in RMF of essential performance evaluation', type: 'doc_reference' },
        ],
      },
      {
        id: '4.3_step2',
        stepLabel: 'Specify performance limits (Normal Condition)',
        requirementText: 'The MANUFACTURER shall then specify performance limits between fully functional and total loss of the identified performance in both NORMAL CONDITION and SINGLE FAULT CONDITION.',
        supplementaryInfo: 'Complete the table below for each clinical function identified in the previous step. Essential Performance is a performance of clinical function, the loss or degradation of which, would result in an unacceptable risk.',
        tables: [
          {
            id: 'table_4_3a',
            title: 'Table 4.3a — Essential Performance in Normal Condition',
            columns: [
              'List of clinical function',
              'Normal condition limit',
              'When loss/degradation of clinical function, Risk acceptable (Yes/No)',
              'Is the clinical function Essential Performance (Yes/No)',
              'Risk control measure applied (Yes/No)',
              'Risk control measure needs verification of effectiveness (Yes/No)',
              'Methods specified for verification of effectiveness of risk control measure (Yes/No)',
              'Need function test in this report? (Yes/No)',
            ],
          },
        ],
      },
      {
        id: '4.3_step3',
        stepLabel: 'Evaluate risk (Single Fault Condition)',
        requirementText: 'The MANUFACTURER shall then evaluate the RISK from the loss or degradation of the identified performance beyond the limits specified by the MANUFACTURER. If the resulting RISK is unacceptable, then the identified performance constitutes an ESSENTIAL PERFORMANCE of the ME EQUIPMENT or ME SYSTEM.',
        tables: [
          {
            id: 'table_4_3b',
            title: 'Table 4.3b — Essential Performance in Single Fault Condition',
            columns: [
              'List of essential performance',
              'Single Fault condition limit',
              'Single fault condition detail (e.g. Short/Open)',
              'Single fault condition safe/risk acceptable (Yes/No)',
              'Single fault condition simulated (Yes/No)',
              'Risk control measure applied (Yes/No)',
              'Risk control measure needs to be tested in this report (Yes/No)',
              'Test method / pass-fail criteria for verification of effectiveness of risk control measure',
            ],
          },
        ],
      },
      {
        id: '4.3_step4',
        stepLabel: 'Risk control measures',
        requirementText: 'The manufacturer shall implement risk control measures to reduce the risk from the loss or degradation of the identified performance to an acceptable level.',
        supplementaryInfo: 'Note: Essential performance is most easily understood by considering whether its absence or degradation would result in an unacceptable risk.',
      },
    ],
  },

  '4.4': {
    clauseTitle: '4.4 — Expected Service Life',
    steps: [
      {
        id: '4.4_location',
        stepLabel: 'RMF location',
        requirementText: 'Expected service life stated in risk management file.\n\nThe expected service life is time period specified by the Manufacturer during which the ME Equipment or ME System is expected to remain safe for use (i.e. maintain Basic Safety and Essential Performance).',
        fields: [
          { id: 'rmf_location', label: 'Location in RMF', type: 'doc_reference' },
        ],
      },
      {
        id: '4.4_value',
        stepLabel: 'Expected service life',
        requirementText: 'NOTE: Maintenance can be necessary during the Expected Service Life.',
        fields: [
          { id: 'service_life', label: 'Expected service life is', type: 'text', placeholder: 'e.g. 10 years' },
        ],
      },
    ],
  },

  '4.5': {
    clauseTitle: '4.5 — Alternative Risk Control Measures',
    steps: [
      {
        id: '4.5_justification',
        stepLabel: 'Justification location',
        requirementText: 'Alternative means of addressing particular risks considered acceptable, provided that the Manufacturer can demonstrate through scientific data or clinical opinion or comparative studies that the Residual Risk that results from applying the alternative Risk Control measure or test method remains acceptable and is comparable to the Residual Risk that results from applying the requirements of this standard.\n\nComparative studies in this context mean studies comparing the effect of the alternative Risk Control measure or test method with the Risk Control measure or test method specified in this standard.\n\nEx. Keyed connections instead of required markings (cl. 7.2.4).',
        fields: [
          { id: 'justification_location', label: 'Location of justification in RMF', type: 'doc_reference' },
        ],
      },
    ],
  },

  '4.6': {
    clauseTitle: '4.6 — Parts That Contact the Patient',
    steps: [
      {
        id: '4.6_assessment',
        stepLabel: 'Assessment of parts contacting patient',
        requirementText: 'The risk management process shall include an assessment of whether parts that can come into contact with the patient but fall outside of the definition of applied parts need to be subject to the requirements for applied parts.\n\nAssessment identified the applied part type requirements (Type B/BF/CF).',
        fields: [
          { id: 'assessment_location', label: 'Location of assessment in RMF', type: 'doc_reference' },
          { id: 'parts_identified', label: 'Please list all parts identified in this clause', type: 'textarea' },
        ],
      },
      {
        id: '4.6_applied_parts',
        stepLabel: 'Applied parts classification',
        requirementText: 'Applied part per definition: Part of ME Equipment that in Normal Use necessarily comes into physical contact with the Patient for ME Equipment or an ME System to perform its function.',
        fields: [
          { id: 'applied_parts_assessment_location', label: 'Location of applied part type assessment in RMF', type: 'doc_reference' },
          { id: 'applied_parts', label: 'Please list all applied parts', type: 'textarea' },
        ],
      },
      {
        id: '4.6_accessible_parts',
        stepLabel: 'Accessible parts',
        requirementText: 'Accessible part: Part of electrical equipment other than an applied part that can be touched by means of the standard test finger.\n\nNote! Please keep in mind that one part can only belong to one of the alternatives above (part per clause 4.6, applied part per definition and accessible part).',
        fields: [
          { id: 'accessible_parts', label: 'Please list all accessible parts', type: 'textarea' },
        ],
      },
    ],
  },

  '4.7': {
    clauseTitle: '4.7 — Single Fault Condition',
    steps: [
      {
        id: '4.7_location',
        stepLabel: 'Single faults in RMF',
        requirementText: 'ME Equipment shall be so designed and manufactured that it remains single fault safe, or the risk remains acceptable as determined through application of 4.2.\n\nThe results of the risk analysis shall be used to determine which failures shall be tested.\n\nSINGLE FAULT CONDITION: Condition of ME Equipment in which a single means for reducing a risk is defective or a single abnormal condition is present.',
        fields: [
          { id: 'sfc_location', label: 'Location of Single Faults in RMF', type: 'doc_reference' },
        ],
      },
      {
        id: '4.7_faults',
        stepLabel: 'List single faults to test',
        requirementText: 'The results of the risk analysis shall be used to determine which failures shall be tested.',
        fields: [
          { id: 'single_faults_list', label: 'Please list all single faults to be tested', type: 'textarea' },
        ],
      },
    ],
  },

  '4.8': {
    clauseTitle: '4.8 — Components of ME Equipment',
    steps: [
      {
        id: '4.8_location',
        stepLabel: 'Components outside ratings — RMF location',
        requirementText: 'Any components used outside of their specified ratings shall be justified through risk management, that an unaccepted risk is not introduced.\n\nThis also applies to any component not certified according to an equivalent standard to the IEC 60601-series.',
        fields: [
          { id: 'components_rmf_location', label: 'Location in RMF of risk(s) due to using components outside of their ratings', type: 'doc_reference' },
        ],
      },
      {
        id: '4.8_list',
        stepLabel: 'List components outside ratings',
        requirementText: 'Components and wiring exception in the standard or by risk management process.',
        fields: [
          { id: 'components_outside_ratings', label: 'Please list all component(s) intentionally used outside of their ratings', type: 'textarea' },
        ],
      },
    ],
  },

  '4.9': {
    clauseTitle: '4.9 — High-Integrity Components',
    steps: [
      {
        id: '4.9_location',
        stepLabel: 'High-integrity components — RMF location',
        requirementText: 'A component with high-integrity characteristics shall be used when a fault in a particular component can generate an unacceptable risk.\n\nThe first step to determine a component with high-integrity characteristics is to conduct a risk analysis to find those characteristics that are required to maintain basic safety or essential performance.',
        fields: [
          { id: 'hic_rmf_location', label: 'Location in RMF', type: 'doc_reference' },
        ],
      },
      {
        id: '4.9_list',
        stepLabel: 'List high-integrity components',
        requirementText: 'Having done this, the appropriate component can be selected. Reference can be made to IEC component standards as part of the determination of the characteristics required.',
        fields: [
          { id: 'hic_components_list', label: 'Please list all components with high-integrity characteristics', type: 'textarea' },
        ],
      },
    ],
  },

  '4.10': {
    clauseTitle: '4.10 — Environmental Conditions',
    steps: [
      {
        id: '4.10_transport',
        stepLabel: 'Transport & storage conditions',
        requirementText: 'The manufacturer shall specify environmental conditions for transport and storage. ME equipment shall not be damaged to the extent that basic safety or essential performance is compromised after exposure to these conditions.',
        fields: [
          { id: 'transport_temp_range', label: 'Transport/storage temperature range', type: 'text', placeholder: 'e.g. -40°C to +70°C' },
          { id: 'transport_humidity', label: 'Transport/storage humidity range', type: 'text', placeholder: 'e.g. 10% to 100% RH' },
          { id: 'transport_pressure', label: 'Transport/storage atmospheric pressure range', type: 'text', placeholder: 'e.g. 500 hPa to 1060 hPa' },
        ],
      },
      {
        id: '4.10_operating',
        stepLabel: 'Operating conditions',
        requirementText: 'The manufacturer shall specify environmental conditions for operation. If no conditions are specified, the following default conditions apply:\n- Temperature: +5°C to +40°C\n- Relative humidity: 15% to 85%\n- Atmospheric pressure: 700 hPa to 1060 hPa',
        fields: [
          { id: 'operating_temp_range', label: 'Operating temperature range', type: 'text', placeholder: 'e.g. +5°C to +40°C' },
          { id: 'operating_humidity', label: 'Operating humidity range', type: 'text', placeholder: 'e.g. 15% to 85% RH' },
          { id: 'operating_pressure', label: 'Operating atmospheric pressure range', type: 'text', placeholder: 'e.g. 700 hPa to 1060 hPa' },
          { id: 'operating_altitude', label: 'Operating altitude (if applicable)', type: 'text', placeholder: 'e.g. up to 3000 m' },
        ],
      },
    ],
  },

  '4.11': {
    clauseTitle: '4.11 — Supply Mains Conditions',
    steps: [
      {
        id: '4.11_supply',
        stepLabel: 'Supply mains specifications',
        requirementText: 'The manufacturer shall specify the rated supply voltage, rated frequency, and rated current or rated power for the ME equipment.\n\nFor mains-powered equipment, the equipment shall be designed to operate safely under supply voltage variations of ±10% and frequency variations of ±1 Hz (for 50/60 Hz supplies).',
        fields: [
          { id: 'rated_voltage', label: 'Rated supply voltage', type: 'text', placeholder: 'e.g. 100-240V AC' },
          { id: 'rated_frequency', label: 'Rated frequency', type: 'text', placeholder: 'e.g. 50/60 Hz' },
          { id: 'rated_current_power', label: 'Rated current or rated power', type: 'text', placeholder: 'e.g. 2A / 500W' },
          { id: 'supply_type', label: 'Supply type', type: 'select', options: ['Mains-powered', 'Battery-powered', 'Both (mains + battery)', 'Externally powered (SELV/PELV)'] },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §5 Testing requirements
  // ═══════════════════════════════════════════════════════════
  '5.1': {
    clauseTitle: '5.1 — Type Tests',
    steps: [
      {
        id: '5.1_location',
        stepLabel: 'Simultaneous faults — RMF location',
        requirementText: 'The combination of simultaneous independent faults that could result in a hazardous situation shall be documented in the risk management file.',
        fields: [
          { id: 'simultaneous_faults_location', label: 'Location in RMF of documented combination(s) of simultaneous independent faults', type: 'text' },
        ],
      },
      {
        id: '5.1_list',
        stepLabel: 'List simultaneous faults to test',
        requirementText: 'When testing is necessary to demonstrate that Basic Safety and Essential Performance are maintained under such simultaneous independent faults, the related testing may be limited to worst case situations.',
        fields: [
          { id: 'simultaneous_faults_list', label: 'Please list all combination(s) of simultaneous faults to be tested', type: 'textarea' },
        ],
      },
    ],
  },

  '5.2': {
    clauseTitle: '5.2 — Number of Samples',
    steps: [
      {
        id: '5.2_samples',
        stepLabel: 'Number of test samples',
        requirementText: 'A single sample of ME equipment shall be sufficient for testing unless otherwise specified.\n\nIf tests are destructive or could affect subsequent test results, additional samples may be required.',
        fields: [
          { id: 'num_samples', label: 'Number of samples provided for testing', type: 'text', placeholder: 'e.g. 1' },
          { id: 'additional_samples_justification', label: 'Justification if multiple samples are needed', type: 'textarea' },
        ],
      },
    ],
  },

  '5.3': {
    clauseTitle: '5.3 — Conditioning',
    steps: [
      {
        id: '5.3_conditioning',
        stepLabel: 'Sample conditioning',
        requirementText: 'Before testing, the sample shall be conditioned as specified. The conditioning period and conditions shall be documented.',
        fields: [
          { id: 'conditioning_method', label: 'Conditioning method applied', type: 'textarea' },
        ],
      },
    ],
  },

  '5.4': {
    clauseTitle: '5.4 — Humidity Pre-Treatment',
    steps: [
      {
        id: '5.4_humidity',
        stepLabel: 'Humidity pretreatment',
        requirementText: 'Unless otherwise specified, humidity pretreatment shall be carried out at a relative humidity of (93 ± 3)% at a temperature of (40 ± 2)°C for 48 hours.\n\nEquipment rated for tropical climate may require different conditions.',
        fields: [
          { id: 'humidity_pretreatment_applied', label: 'Was humidity pretreatment applied?', type: 'select', options: ['Yes — standard conditions', 'Yes — modified conditions', 'No — justification provided', 'N/A'] },
          { id: 'humidity_conditions', label: 'Actual pretreatment conditions used', type: 'text' },
        ],
      },
    ],
  },

  '5.5': {
    clauseTitle: '5.5 — Temperature and Humidity During Testing',
    steps: [
      {
        id: '5.5_ambient',
        stepLabel: 'Ambient conditions during testing',
        requirementText: 'Unless otherwise specified, tests shall be carried out at an ambient temperature of (25 ± 10)°C and a relative humidity of (45 to 75)%.',
        fields: [
          { id: 'test_temperature', label: 'Temperature during testing', type: 'text', placeholder: 'e.g. 23°C' },
          { id: 'test_humidity', label: 'Relative humidity during testing', type: 'text', placeholder: 'e.g. 55% RH' },
        ],
      },
    ],
  },

  '5.6': {
    clauseTitle: '5.6 — Supply Voltage During Testing',
    steps: [
      {
        id: '5.6_voltage',
        stepLabel: 'Supply voltage during testing',
        requirementText: 'Unless otherwise specified, tests shall be carried out at the most unfavourable supply voltage within the rated voltage range or at the rated voltage ±10%.',
        fields: [
          { id: 'test_voltage', label: 'Supply voltage during testing', type: 'text', placeholder: 'e.g. 264V (110% of 240V)' },
          { id: 'voltage_justification', label: 'Justification for selected test voltage', type: 'textarea' },
        ],
      },
    ],
  },

  '5.7': {
    clauseTitle: '5.7 — Supply Frequency During Testing',
    steps: [
      {
        id: '5.7_frequency',
        stepLabel: 'Supply frequency during testing',
        requirementText: 'Tests shall be carried out at the rated frequency. For equipment rated for both 50 Hz and 60 Hz, tests shall be carried out at the most unfavourable frequency.',
        fields: [
          { id: 'test_frequency', label: 'Frequency during testing', type: 'text', placeholder: 'e.g. 50 Hz' },
        ],
      },
    ],
  },

  '5.8': {
    clauseTitle: '5.8 — Other Testing Conditions',
    steps: [
      {
        id: '5.8_other',
        stepLabel: 'Other test conditions',
        requirementText: 'Any other testing conditions specified by the manufacturer or required by particular standards shall be documented.',
        fields: [
          { id: 'other_conditions', label: 'Describe any other test conditions', type: 'textarea' },
        ],
      },
    ],
  },

  '5.9': {
    clauseTitle: '5.9 — Loading During Tests',
    steps: [
      {
        id: '5.9_loading',
        stepLabel: 'Loading conditions',
        requirementText: 'Unless otherwise specified, the ME equipment shall be tested under the most unfavourable loading condition that can occur in normal use.',
        fields: [
          { id: 'loading_condition', label: 'Loading condition during testing', type: 'textarea' },
        ],
      },
    ],
  },

  '5.10': {
    clauseTitle: '5.10 — Operating Mode During Testing',
    steps: [
      {
        id: '5.10_mode',
        stepLabel: 'Operating mode during testing',
        requirementText: 'Tests shall be carried out in the most unfavourable operating mode and position that can occur in normal use.',
        fields: [
          { id: 'operating_mode', label: 'Operating mode during testing', type: 'text' },
          { id: 'operating_position', label: 'Operating position during testing', type: 'text' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §6 Classification
  // ═══════════════════════════════════════════════════════════
  '6.1': {
    clauseTitle: '6.1 — Classification Against Electric Shock',
    steps: [
      {
        id: '6.1_class',
        stepLabel: 'Protection class',
        requirementText: 'ME equipment shall be classified as one of the following:\n- Class I: Equipment relying on basic insulation plus protective earth\n- Class II: Equipment relying on double or reinforced insulation\n- Internally powered: Equipment powered by an internal electrical power source',
        fields: [
          { id: 'protection_class', label: 'Protection class', type: 'select', options: ['Class I', 'Class II', 'Internally powered'] },
          { id: 'class_justification', label: 'Justification for classification', type: 'textarea' },
        ],
      },
    ],
  },

  '6.2': {
    clauseTitle: '6.2 — Classification of Applied Parts',
    steps: [
      {
        id: '6.2_applied_parts',
        stepLabel: 'Applied part classification',
        requirementText: 'Applied parts shall be classified as:\n- Type B: Not suitable for direct cardiac application, no intentional current flow\n- Type BF: Floating applied part, not for direct cardiac application\n- Type CF: Suitable for direct cardiac application (highest protection)',
        fields: [
          { id: 'applied_part_type', label: 'Applied part classification', type: 'select', options: ['Type B', 'Type BF', 'Type CF', 'No applied parts'] },
          { id: 'applied_part_list', label: 'List all applied parts with their classification', type: 'textarea' },
        ],
      },
    ],
  },

  '6.3': {
    clauseTitle: '6.3 — Degree of Protection Against Ingress of Water',
    steps: [
      {
        id: '6.3_ip_water',
        stepLabel: 'IP rating — water ingress',
        requirementText: 'ME equipment shall be classified for its degree of protection against the ingress of water in accordance with IEC 60529.\n\nClassifications: IPX0 (no protection) through IPX8 (continuous immersion).',
        fields: [
          { id: 'ip_water_rating', label: 'IPX rating for water ingress protection', type: 'select', options: ['IPX0', 'IPX1', 'IPX2', 'IPX3', 'IPX4', 'IPX5', 'IPX6', 'IPX7', 'IPX8'] },
          { id: 'ip_water_justification', label: 'Justification for IP rating selection', type: 'textarea' },
        ],
      },
    ],
  },

  '6.4': {
    clauseTitle: '6.4 — Degree of Safety in Flammable Environments',
    steps: [
      {
        id: '6.4_flammable',
        stepLabel: 'Flammable environment classification',
        requirementText: 'ME equipment shall be classified for its suitability for use in the presence of a flammable anaesthetic mixture:\n- No AP/APG category: Not suitable for use with flammable anaesthetics\n- Category AP: Suitable for use in the presence of flammable anaesthetic mixture with air\n- Category APG: Suitable for use in the presence of flammable anaesthetic mixture with oxygen or nitrous oxide',
        fields: [
          { id: 'flammable_classification', label: 'Flammable environment classification', type: 'select', options: ['No AP/APG category — not for flammable anaesthetics', 'Category AP', 'Category APG'] },
        ],
      },
    ],
  },

  '6.5': {
    clauseTitle: '6.5 — Mode of Operation',
    steps: [
      {
        id: '6.5_mode',
        stepLabel: 'Mode of operation',
        requirementText: 'ME equipment shall be classified by its mode of operation:\n- Continuous operation\n- Short-time operation (specified duration)\n- Intermittent operation (specified on/off duty cycle)',
        fields: [
          { id: 'operation_mode', label: 'Mode of operation', type: 'select', options: ['Continuous', 'Short-time', 'Intermittent'] },
          { id: 'duty_cycle', label: 'Duty cycle or duration (if short-time or intermittent)', type: 'text', placeholder: 'e.g. 10 min on / 20 min off' },
        ],
      },
    ],
  },

  '6.6': {
    clauseTitle: '6.6 — Conditions for Portability',
    steps: [
      {
        id: '6.6_portability',
        stepLabel: 'Portability classification',
        requirementText: 'ME equipment shall be classified for portability:\n- Portable: Intended to be moved while connected to supply\n- Transportable: Can be moved between locations\n- Stationary: Not intended to be moved\n- Fixed: Fastened to a support\n- Hand-held: Intended to be held in the hand during normal use',
        fields: [
          { id: 'portability_class', label: 'Portability classification', type: 'select', options: ['Portable', 'Transportable', 'Mobile', 'Stationary', 'Fixed', 'Hand-held'] },
        ],
      },
    ],
  },

  '6.7': {
    clauseTitle: '6.7 — ME Equipment Rated Supply',
    steps: [
      {
        id: '6.7_supply',
        stepLabel: 'Rated supply classification',
        requirementText: 'The ME equipment shall be classified by its supply type and rated characteristics.',
        fields: [
          { id: 'supply_classification', label: 'Supply classification details', type: 'textarea', placeholder: 'e.g. Single-phase AC, 100-240V, 50/60Hz' },
        ],
      },
    ],
  },

  '6.8': {
    clauseTitle: '6.8 — Sterility',
    steps: [
      {
        id: '6.8_sterility',
        stepLabel: 'Sterility classification',
        requirementText: 'Where applicable, ME equipment or parts thereof shall be classified regarding their sterility state.',
        fields: [
          { id: 'sterility_classification', label: 'Sterility classification', type: 'select', options: ['Non-sterile', 'Sterile — EO sterilized', 'Sterile — Radiation sterilized', 'Sterile — Steam sterilized', 'Sterile — Other method', 'N/A'] },
          { id: 'sterility_notes', label: 'Sterility notes / sterilization method details', type: 'textarea' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §7 Identification, marking & documents (existing + new)
  // ═══════════════════════════════════════════════════════════
  '7.1': {
    clauseTitle: '7.1 — General Marking Requirements',
    steps: [
      {
        id: '7.1_general',
        stepLabel: 'General marking requirements',
        requirementText: 'Markings shall be:\n- Legible and indelible under normal conditions of use\n- Durable throughout the expected service life\n- Clearly visible during normal use\n- Placed on the ME equipment unless intended for packaging only\n\nSymbols used shall comply with IEC 60417 or ISO 7000.',
        fields: [
          { id: 'marking_legibility', label: 'Are markings legible, indelible and durable?', type: 'select', options: ['Yes', 'No — action required'] },
          { id: 'symbols_compliant', label: 'Do symbols comply with IEC 60417 / ISO 7000?', type: 'select', options: ['Yes', 'No — action required', 'No symbols used'] },
        ],
      },
    ],
  },

  '7.2': {
    clauseTitle: '7.2 — Identification of Detachable Components',
    steps: [
      {
        id: '7.2_risk',
        stepLabel: 'Misidentification risk evaluation',
        requirementText: 'If misidentification of detachable components results in an unacceptable risk, detachable components of the ME equipment shall be marked with:\n- the name or trademark of the manufacturer, and\n- a model or type reference\n\nIf all detachable components are marked accordingly this clause is N/A. Detachable components are not to be confused with accessories.',
        fields: [
          { id: 'misidentification_location', label: 'Risk evaluation of misidentification located in', type: 'text' },
        ],
      },
      {
        id: '7.2_list',
        stepLabel: 'List detachable components',
        requirementText: 'List all detachable components that require marking.',
        fields: [
          { id: 'detachable_components', label: 'Please list all detachable components', type: 'textarea' },
        ],
      },
    ],
  },

  '7.3': {
    clauseTitle: '7.3 — Safety Signs, Warnings & Markings',
    steps: [
      {
        id: '7.3_primary_risk',
        stepLabel: '7.2.3 — Information for safety as primary risk control',
        requirementText: 'If information for safety is used as a Primary Risk Control, the Safety Sign 10 of table D2 shall be marked on the ME Equipment.',
        fields: [
          { id: 'primary_risk_control_location', label: 'Location in RMF of risk(s) that uses information for Safety as a Primary Risk Control', type: 'text' },
        ],
      },
      {
        id: '7.3_physiological',
        stepLabel: '7.2.13 — Physiological effects',
        requirementText: 'ME Equipment producing physiological effects that are not obvious to the operator and can cause harm to the patient or operator shall bear a suitable safety sign.\n\nThe instructions for use shall describe the nature of the hazard and the precautions for avoiding it or minimizing the associated risk.',
        fields: [
          { id: 'physiological_effects_location', label: 'Location in RMF of risk(s) due to functions not being obvious to the operator', type: 'text' },
          { id: 'physiological_effects_list', label: 'Please list all the physiological effect(s) produced', type: 'textarea' },
          { id: 'warning_ifu_location', label: 'Location of the warning in the instruction for use', type: 'text' },
        ],
      },
      {
        id: '7.3_packaging',
        stepLabel: '7.2.17 — Protective packaging',
        requirementText: 'Where premature unpacking of ME Equipment or its parts could result in an unacceptable risk, the packaging shall be marked with a suitable safety sign.',
        fields: [
          { id: 'premature_unpacking_location', label: 'Location in RMF of risk(s) due to premature unpacking', type: 'text' },
        ],
      },
      {
        id: '7.3_batteries',
        stepLabel: '7.3.3 — Batteries',
        requirementText: 'Where lithium batteries or fuel cells are incorporated and where incorrect replacement would result in an unacceptable risk, a warning indicating that replacement by inadequately trained personnel could result in a hazard shall be given.',
        fields: [
          { id: 'batteries_location', label: 'Location in RMF of risk(s) due to incorrect replacement by inadequately trained personnel', type: 'text' },
        ],
      },
      {
        id: '7.3_terminals',
        stepLabel: '7.3.7 — Supply terminals',
        requirementText: 'Terminals for supply conductors shall be marked adjacent to the terminals unless it can be demonstrated that no unacceptable risk can result if connections are interchanged.',
        fields: [
          { id: 'supply_terminals_location', label: 'If not marked accordingly, location in RMF of risk(s) due to interchanged connection', type: 'text' },
        ],
      },
    ],
  },

  '7.4': {
    clauseTitle: '7.4 — Marking on the Outside of ME Equipment',
    steps: [
      {
        id: '7.4_nameplate',
        stepLabel: 'Nameplate / external marking',
        requirementText: 'The following information shall be marked on the outside of the ME equipment:\n- Name or trademark of the manufacturer\n- Model or type reference\n- Serial number or date of manufacture\n- Rated supply characteristics (voltage, frequency, current/power)\n- Classification symbols (Class I/II, Type B/BF/CF, IP rating, AP/APG)\n- Fuse ratings\n- Any required safety signs',
        fields: [
          { id: 'manufacturer_marked', label: 'Manufacturer name/trademark marked?', type: 'select', options: ['Yes', 'No'] },
          { id: 'model_marked', label: 'Model/type reference marked?', type: 'select', options: ['Yes', 'No'] },
          { id: 'serial_marked', label: 'Serial number or date of manufacture marked?', type: 'select', options: ['Yes', 'No'] },
          { id: 'ratings_marked', label: 'Rated supply characteristics marked?', type: 'select', options: ['Yes', 'No', 'N/A — internally powered'] },
          { id: 'classification_symbols_marked', label: 'Classification symbols marked?', type: 'select', options: ['Yes', 'No'] },
          { id: 'external_marking_notes', label: 'Notes on external marking compliance', type: 'textarea' },
        ],
      },
    ],
  },

  '7.5': {
    clauseTitle: '7.5 — Marking on the Inside of ME Equipment',
    steps: [
      {
        id: '7.5_internal',
        stepLabel: 'Internal markings',
        requirementText: 'Where applicable, the following shall be marked on the inside of the ME equipment:\n- Fuse ratings adjacent to fuse holders\n- Wiring diagrams or references to accompanying documents\n- Component identification where necessary for servicing',
        fields: [
          { id: 'fuse_marking', label: 'Are fuse ratings marked adjacent to fuse holders?', type: 'select', options: ['Yes', 'No', 'N/A — no internal fuses'] },
          { id: 'wiring_diagram', label: 'Is a wiring diagram or reference available inside?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'internal_marking_notes', label: 'Notes on internal marking compliance', type: 'textarea' },
        ],
      },
    ],
  },

  '7.6': {
    clauseTitle: '7.6 — Marking of Controls and Instruments',
    steps: [
      {
        id: '7.6_controls',
        stepLabel: 'Control and instrument marking',
        requirementText: 'Controls and instruments shall be marked or identified so that their function is clear to the operator. The direction of actuation of controls shall be consistent with their effect.',
        fields: [
          { id: 'controls_marked', label: 'Are all controls clearly marked/identified?', type: 'select', options: ['Yes', 'No — action required'] },
          { id: 'direction_consistent', label: 'Is direction of actuation consistent with effect?', type: 'select', options: ['Yes', 'No — action required', 'N/A'] },
          { id: 'controls_notes', label: 'Notes on control and instrument marking', type: 'textarea' },
        ],
      },
    ],
  },

  '7.7': {
    clauseTitle: '7.7 — Indicator Lights and Push Buttons',
    steps: [
      {
        id: '7.7_indicators',
        stepLabel: 'Colour coding requirements',
        requirementText: 'Indicator lights and push buttons shall use colours in accordance with IEC 60601-1 requirements:\n- Red: Danger / emergency stop / power off\n- Yellow: Caution / warning\n- Green: Ready / normal / power on\n- Blue: Mandatory action\n\nDeviations shall be justified through the risk management process.',
        fields: [
          { id: 'colour_coding_compliant', label: 'Do indicator lights and push buttons comply with colour coding?', type: 'select', options: ['Yes', 'No — deviations justified in RMF', 'N/A'] },
          { id: 'colour_deviation_location', label: 'Location in RMF of colour coding deviation justification', type: 'text' },
        ],
      },
    ],
  },

  '7.8': {
    clauseTitle: '7.8 — Accompanying Documents — General',
    steps: [
      {
        id: '7.8_documents',
        stepLabel: 'Accompanying document requirements',
        requirementText: 'Accompanying documents shall:\n- Be written in the language of the country where the equipment is to be used\n- Be available in hardcopy and/or electronic form\n- Include technical description, instructions for use, and technical specifications\n- Use symbols from IEC 60417 or ISO 7000',
        fields: [
          { id: 'language_compliance', label: 'Are documents in the appropriate language(s)?', type: 'select', options: ['Yes', 'No — action required'] },
          { id: 'document_availability', label: 'Are documents available in required format?', type: 'select', options: ['Yes — hardcopy', 'Yes — electronic', 'Yes — both', 'No'] },
          { id: 'document_notes', label: 'Notes on accompanying document compliance', type: 'textarea' },
        ],
      },
    ],
  },

  '7.9': {
    clauseTitle: '7.9 — Instructions for Use',
    steps: [
      {
        id: '7.9_content',
        stepLabel: 'IFU content requirements',
        requirementText: 'Instructions for use shall include:\n- Intended use and intended patient population\n- Contraindications\n- Warnings and precautions\n- Description of the equipment\n- Installation instructions\n- Operating instructions\n- Maintenance and calibration instructions\n- Cleaning, disinfection, and sterilization procedures\n- Troubleshooting\n- Disposal instructions\n- EMC guidance per IEC 60601-1-2',
        fields: [
          { id: 'ifu_intended_use', label: 'Intended use described?', type: 'select', options: ['Yes', 'No'] },
          { id: 'ifu_contraindications', label: 'Contraindications listed?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'ifu_warnings', label: 'Warnings and precautions included?', type: 'select', options: ['Yes', 'No'] },
          { id: 'ifu_installation', label: 'Installation instructions included?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'ifu_operation', label: 'Operating instructions included?', type: 'select', options: ['Yes', 'No'] },
          { id: 'ifu_maintenance', label: 'Maintenance and calibration instructions?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'ifu_cleaning', label: 'Cleaning/disinfection/sterilization procedures?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'ifu_disposal', label: 'Disposal instructions included?', type: 'select', options: ['Yes', 'No'] },
          { id: 'ifu_emc', label: 'EMC guidance per IEC 60601-1-2 included?', type: 'select', options: ['Yes', 'No'] },
          { id: 'ifu_notes', label: 'Additional IFU notes', type: 'textarea' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §8 Electrical hazards (existing + new)
  // ═══════════════════════════════════════════════════════════
  '8.1': {
    clauseTitle: '8.1 — Fundamental Rule of Protection',
    steps: [
      {
        id: '8.1_fundamental',
        stepLabel: 'Two means of protection',
        requirementText: 'ME equipment shall provide protection against electric shock by having two independent means of protection (MOP):\n- Means of operator protection (MOOP) — at least two\n- Means of patient protection (MOPP) — at least two\n\nThe failure of one MOP shall not result in an unacceptable risk.',
        fields: [
          { id: 'moop_count', label: 'Number of means of operator protection (MOOP)', type: 'text' },
          { id: 'mopp_count', label: 'Number of means of patient protection (MOPP)', type: 'text' },
          { id: 'mop_description', label: 'Description of means of protection implemented', type: 'textarea' },
        ],
      },
    ],
  },

  '8.2': {
    clauseTitle: '8.2 — Classification Requirements',
    steps: [
      {
        id: '8.2_class_req',
        stepLabel: 'Requirements per classification',
        requirementText: 'Specific requirements derived from the classification (Class I, Class II, internally powered) shall be applied.\n\n- Class I: Protective earth required as one means of protection\n- Class II: Double or reinforced insulation throughout\n- Internally powered: No connection to mains supply during normal use',
        fields: [
          { id: 'class_requirements_met', label: 'Are all classification-specific requirements met?', type: 'select', options: ['Yes', 'No — action required'] },
          { id: 'class_req_notes', label: 'Notes on classification requirements', type: 'textarea' },
        ],
      },
    ],
  },

  '8.3': {
    clauseTitle: '8.3 — Means of Protection (MOPs)',
    steps: [
      {
        id: '8.3_mops',
        stepLabel: 'Specify means of protection',
        requirementText: 'For each circuit and applied part, identify the means of operator protection (MOOP) and means of patient protection (MOPP).\n\nEach MOP can be achieved by:\n- Basic insulation + protective earth (Class I)\n- Double insulation\n- Reinforced insulation\n- Protective impedance\n- SELV/PELV circuits',
        fields: [
          { id: 'mop_analysis_location', label: 'Location of MOP analysis documentation', type: 'text' },
          { id: 'moop_details', label: 'Describe MOOP for each circuit', type: 'textarea' },
          { id: 'mopp_details', label: 'Describe MOPP for each applied part', type: 'textarea' },
        ],
      },
    ],
  },

  '8.4': {
    clauseTitle: '8.4 — Allowable Touch Current and Patient Leakage Current',
    steps: [
      {
        id: '8.4_limits',
        stepLabel: 'Leakage current limits',
        requirementText: 'Leakage current limits (per Table 3/4):\n\nNormal condition:\n- Earth leakage current: 5 mA\n- Touch current: 100 µA\n- Patient leakage current (Type B): 100 µA\n- Patient leakage current (Type BF): 100 µA\n- Patient leakage current (Type CF): 10 µA\n\nSingle fault condition:\n- Earth leakage current: 10 mA\n- Touch current: 500 µA\n- Patient leakage current (Type B): 500 µA\n- Patient leakage current (Type BF): 500 µA\n- Patient leakage current (Type CF): 50 µA',
        fields: [
          { id: 'earth_leakage_nc', label: 'Earth leakage current — normal condition (mA)', type: 'text' },
          { id: 'touch_current_nc', label: 'Touch current — normal condition (µA)', type: 'text' },
          { id: 'patient_leakage_nc', label: 'Patient leakage current — normal condition (µA)', type: 'text' },
          { id: 'leakage_test_report', label: 'Reference to leakage current test report', type: 'text' },
        ],
      },
    ],
  },

  '8.5': {
    clauseTitle: '8.5 — Separation of Parts & Applied Parts',
    steps: [
      {
        id: '8.5_mopp',
        stepLabel: '8.5.1.1 — MOPP considerations',
        requirementText: 'Coatings and other insulation, that complies with IEC 60950-1 or IEC 62368-1, that are intended as a means of protection may be used as a means of operator protection but not automatically as a means of patient protection. For means of patient protection, considerations can arise as a result of the risk management process.',
        fields: [
          { id: 'mopp_location', label: 'Location in RMF for MOPP considerations', type: 'text' },
        ],
      },
      {
        id: '8.5_type_b',
        stepLabel: '8.5.2.2 — Type B applied parts',
        requirementText: 'The patient connection(s) of a type B applied part that is not protectively earthed shall be separated by one means of patient protection from metal accessible parts that are not protectively earthed, unless:\n- the metal accessible part is physically contiguous with the applied part; and\n- The risk that the metal accessible part will make contact with a source of voltage or leakage current above permitted limits is acceptably low.',
        fields: [
          { id: 'type_b_location', label: 'Location in RMF for Type B applied part assessment', type: 'text' },
        ],
      },
      {
        id: '8.5_patient_leads',
        stepLabel: '8.5.2.3 — Patient leads/cables',
        requirementText: 'Any connector for electrical connections on a patient lead or patient cable that is at the end remote from the patient and contains a conductive part not separated by one MOPP shall be constructed so that the said part cannot become connected to earth or possible hazardous voltage while the patient connection(s) contact the patient.',
        fields: [
          { id: 'patient_leads_location', label: 'Location in RMF for patient leads/cables assessment', type: 'text' },
        ],
      },
    ],
  },

  '8.6': {
    clauseTitle: '8.6 — Protective Earthing of Moving Parts',
    steps: [
      {
        id: '8.6_moving',
        stepLabel: 'Moving parts earthing',
        requirementText: 'Any protective earth connection shall not be used for a moving part unless the manufacturer demonstrates that the connection will remain reliable during the expected service life of the ME Equipment.',
        fields: [
          { id: 'moving_parts_earthing', label: 'Description of protective earthing for moving parts', type: 'textarea' },
        ],
      },
    ],
  },

  '8.7': {
    clauseTitle: '8.7 — Creepage Distances and Air Clearances',
    steps: [
      {
        id: '8.7_creepage',
        stepLabel: 'Creepage and clearance requirements',
        requirementText: 'Creepage distances and air clearances shall comply with Tables 11–14 of IEC 60601-1.\n\nValues depend on:\n- Working voltage\n- Means of protection (MOOP or MOPP)\n- Pollution degree\n- Material group',
        fields: [
          { id: 'creepage_analysis_location', label: 'Location of creepage/clearance analysis', type: 'text' },
          { id: 'working_voltages', label: 'Describe working voltages for each insulation barrier', type: 'textarea' },
          { id: 'pollution_degree', label: 'Pollution degree', type: 'select', options: ['1', '2', '3'] },
        ],
      },
    ],
  },

  '8.8': {
    clauseTitle: '8.8 — Mechanical Strength & Resistance to Heat',
    steps: [
      {
        id: '8.8_insulation',
        stepLabel: 'Insulation assessment',
        requirementText: 'The resistance to heat shall be retained by all types of insulation, including insulating partition walls, during the expected service life of the ME Equipment.\n\nCompliance is checked by inspection of the ME Equipment and the design documentation, and, if necessary, inspection of the risk management file.',
        fields: [
          { id: 'insulation_location', label: 'Location in RMF of insulation assessment', type: 'text' },
        ],
      },
    ],
  },

  '8.9': {
    clauseTitle: '8.9 — Voltage and/or Energy Limitations',
    steps: [
      {
        id: '8.9_voltage_limit',
        stepLabel: 'Voltage/energy limitation as MOP',
        requirementText: 'Where voltage and/or energy limitation is used as a means of protection, the voltages and energies shall not exceed the values specified in Table 10.',
        fields: [
          { id: 'voltage_limitation_used', label: 'Is voltage/energy limitation used as a MOP?', type: 'select', options: ['Yes', 'No'] },
          { id: 'voltage_limit_values', label: 'Voltage/energy values and compliance with Table 10', type: 'textarea' },
        ],
      },
    ],
  },

  '8.10': {
    clauseTitle: '8.10 — Overcurrent and Overvoltage Protection',
    steps: [
      {
        id: '8.10_protection',
        stepLabel: 'Overcurrent/overvoltage protection',
        requirementText: 'ME equipment shall be provided with overcurrent protection (fuses or circuit breakers) and, where applicable, overvoltage protection.\n\nProtective devices shall be appropriately rated and accessible for replacement.',
        fields: [
          { id: 'overcurrent_protection', label: 'Describe overcurrent protection devices', type: 'textarea' },
          { id: 'overvoltage_protection', label: 'Describe overvoltage protection (if applicable)', type: 'textarea' },
          { id: 'fuse_ratings', label: 'List fuse ratings', type: 'text' },
        ],
      },
    ],
  },

  '8.11': {
    clauseTitle: '8.11 — Separation Devices and Switching',
    steps: [
      {
        id: '8.11_separation',
        stepLabel: 'Mains disconnection',
        requirementText: 'ME equipment shall have a means of disconnection from the supply mains. The disconnecting device shall disconnect all supply conductors simultaneously (except protective earth).\n\nPlugs, appliance couplers, or switches may serve as the separation device.',
        fields: [
          { id: 'disconnection_method', label: 'Method of mains disconnection', type: 'select', options: ['Mains plug', 'Appliance coupler', 'All-pole switch', 'Other'] },
          { id: 'disconnection_notes', label: 'Notes on disconnection compliance', type: 'textarea' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §9 Mechanical hazards (existing + new)
  // ═══════════════════════════════════════════════════════════
  '9.1': {
    clauseTitle: '9.1 — General Requirements for Mechanical Hazards',
    steps: [
      {
        id: '9.1_general',
        stepLabel: 'General mechanical hazard assessment',
        requirementText: 'ME equipment shall be designed and constructed to protect against mechanical hazards. This includes hazards from:\n- Moving parts\n- Instability\n- Expelled parts\n- Rough surfaces, sharp edges, and corners\n- Stored energy\n- Pressure\n- Suspended masses',
        fields: [
          { id: 'mechanical_hazards_identified', label: 'Have all mechanical hazards been identified?', type: 'select', options: ['Yes', 'No'] },
          { id: 'mechanical_hazards_location', label: 'Location in RMF of mechanical hazard assessment', type: 'text' },
          { id: 'rough_surfaces', label: 'Are rough surfaces, sharp edges, and corners addressed?', type: 'select', options: ['Yes', 'No', 'N/A'] },
        ],
      },
    ],
  },

  '9.2': {
    clauseTitle: '9.2 — Moving Parts — Risk Control',
    steps: [
      {
        id: '9.2_general',
        stepLabel: 'General risk control for moving parts',
        requirementText: 'ME Equipment with moving parts shall be designed, built and laid out so that, when properly installed and used as indicated in the accompanying documents or under reasonably foreseeable misuse, the risks associated with those moving parts are reduced to an acceptable level by use of Risk Control measures.\n\nThe residual risk associated with moving parts is considered acceptable if exposure is needed for the ME Equipment to perform its intended function and risk control measures have been implemented.',
        fields: [
          { id: 'risk_control_measures_list', label: 'List Risk Control measures to be verified by testing', type: 'textarea' },
        ],
      },
      {
        id: '9.2_trapping',
        stepLabel: 'Trapping zone requirements',
        requirementText: 'Where feasible, ME Equipment with a trapping zone shall comply with the requirements of one or more of the following:\n- gaps as specified in 9.2.2.2; or\n- safe distances as specified in 9.2.2.3; or\n- guards and other Risk Control measures as specified in 9.2.2.4; or\n- Continuous activation as specified in 9.2.2.5.',
        fields: [
          { id: 'comply_9222', label: '9.2.2.2 Gaps', type: 'select', options: ['Comply', 'N/A'] },
          { id: 'comply_9223', label: '9.2.2.3 Safe distances', type: 'select', options: ['Comply', 'N/A'] },
          { id: 'comply_9224', label: '9.2.2.4 Guards and other Risk Control measures', type: 'select', options: ['Comply', 'N/A'] },
          { id: 'comply_9225', label: '9.2.2.5 Continuous activation', type: 'select', options: ['Comply', 'N/A'] },
        ],
      },
    ],
  },

  '9.3': {
    clauseTitle: '9.3 — Speed, Unintended Movement & Emergency Stop',
    steps: [
      {
        id: '9.3_speed',
        stepLabel: 'Speed of movement',
        requirementText: 'The speed of movement(s) that position parts of the ME Equipment or patient, where contact with the ME Equipment could result in an unacceptable risk, shall be limited so that the operator will have adequate control of the movement.\n\nThe overtravel (stopping distance) of such movement, occurring after operation of a control to stop the movement, shall not result in an unacceptable risk.',
        fields: [
          { id: 'speed_evaluation_location', label: 'Location in RMF of evaluation of the speed of movement', type: 'text' },
          { id: 'overtravel_location', label: 'Location in RMF of evaluation of the overtravel', type: 'text' },
        ],
      },
      {
        id: '9.3_unintended',
        stepLabel: 'Unintended movement',
        requirementText: 'Controls shall be so positioned, recessed, or protected by other means so that they cannot be accidentally actuated, unless for the intended patient, the usability engineering process concludes otherwise, or activation does not result in an unacceptable risk.',
        fields: [
          { id: 'unintended_movement_location', label: 'Location in RMF of evaluation of unintended movement', type: 'text' },
        ],
      },
      {
        id: '9.3_emergency',
        stepLabel: 'Emergency stopping devices',
        requirementText: 'Where it is considered necessary to have one or more emergency stopping device(s), the emergency stopping device shall comply with all the following requirements:\n- a) Reduce the risk to an acceptable level.\n- b) The proximity and response of the operator can be relied on to prevent harm.\n- e) Operation shall neither introduce a further hazard nor interfere with removing the original hazard.\n- k) Shall be shown to be suitable for its application.',
        fields: [
          { id: 'emergency_stop_effectiveness', label: 'Location in RMF of the evaluation of the effectiveness of the emergency stopping device', type: 'text' },
          { id: 'emergency_stop_proximity', label: 'Location in RMF of the proximity of the emergency stopping device', type: 'text' },
          { id: 'emergency_stop_risks', label: 'Location in RMF of risk(s) due to the activation of an emergency stopping device', type: 'text' },
          { id: 'emergency_stop_suitability', label: 'Location in RMF of the evaluation of the suitability of the emergency stopping device', type: 'text' },
        ],
      },
    ],
  },

  '9.4': {
    clauseTitle: '9.4 — Release of Patient',
    steps: [
      {
        id: '9.4_release',
        stepLabel: 'Patient release evaluation',
        requirementText: 'Means shall be provided to permit the release of the patient quickly and safely in the event of breakdown of the ME Equipment or failure of the power, activation of a risk control measure or emergency stopping.\n\nSpecial attention shall be given to uncontrolled movement, proximity of moving parts, and counterbalanced parts.',
        fields: [
          { id: 'release_location', label: 'Location in RMF of patient release evaluation', type: 'text' },
        ],
      },
    ],
  },

  '9.5': {
    clauseTitle: '9.5 — Expelled Parts',
    steps: [
      {
        id: '9.5_expelled',
        stepLabel: 'Expelled parts risk assessment',
        requirementText: 'Where expelled parts could result in an unacceptable risk, the ME Equipment shall be provided with a means for protecting against such risk.\n\nExpelled parts are ME Equipment parts or fragments that could be expelled by collision, expansion etc. (e.g., damaged vacuum display, mechanical spring, gas pressure cylinder, rotating flywheel, exploded lithium battery).',
        fields: [
          { id: 'expelled_parts_location', label: 'Location in RMF of risk(s) due to expelled parts', type: 'text' },
        ],
      },
    ],
  },

  '9.6': {
    clauseTitle: '9.6 — Acoustic Energy & Vibration',
    steps: [
      {
        id: '9.6_general',
        stepLabel: 'Acoustic energy & vibration assessment',
        requirementText: 'ME Equipment shall be designed so that human exposure to acoustic energy and vibration shall not result in an unacceptable risk.\n\nCompliance is checked by the tests in 9.6.2 and 9.6.3, and, if necessary, by inspection of the RISK MANAGEMENT FILE.',
        fields: [
          { id: 'acoustic_location', label: 'Location in RMF of acoustic energy and vibration assessment', type: 'text' },
        ],
      },
      {
        id: '9.6_infrasound',
        stepLabel: 'Infrasound & ultrasound',
        requirementText: 'When applicable, the manufacturer shall address the risks associated with infrasound or ultrasound in the risk management process.',
        fields: [
          { id: 'infrasound_location', label: 'Location in RMF of infrasound/ultrasound risk assessment', type: 'text' },
        ],
      },
    ],
  },

  '9.7': {
    clauseTitle: '9.7 — Pressure Vessels & Pneumatic/Hydraulic',
    steps: [
      {
        id: '9.7_hazards',
        stepLabel: 'Identify pressure hazards',
        requirementText: 'The requirements of this subclause apply to vessels and parts of ME Equipment subject to pressure, the rupture of which could result in an unacceptable risk.\n\nHazards to consider:\n- a) Mechanical rupture or breakage\n- b) Mechanical loss\n- c) Leakage of toxic gas or liquid\n- d) Leakage of flammable gas or liquid',
        fields: [
          { id: 'hazard_a_risk_id', label: 'Risk(s) ID for mechanical rupture or breakage', type: 'text' },
          { id: 'hazard_b_risk_id', label: 'Risk(s) ID for mechanical loss', type: 'text' },
          { id: 'hazard_c_risk_id', label: 'Risk(s) ID for leakage of toxic gas or liquid', type: 'text' },
          { id: 'hazard_d_risk_id', label: 'Risk(s) ID for leakage of flammable gas or liquid', type: 'text' },
        ],
      },
      {
        id: '9.7_pneumatic',
        stepLabel: 'Pneumatic & hydraulic parts',
        requirementText: 'Requirements:\n- no unacceptable risk from loss of pressure or vacuum\n- no unacceptable risk from fluid jet caused by leakage or component failure\n- pipes and hoses protected against harmful external effects\n- Reservoirs automatically depressurized when isolated from power supply\n- elements remaining under pressure provided with identified exhaust devices',
        fields: [
          { id: 'pneumatic_location', label: 'Location in RMF of risk(s) due to pneumatic and hydraulic parts', type: 'text' },
          { id: 'pressure_loss_risk_id', label: 'Risk(s) ID for loss of pressure or vacuum', type: 'text' },
          { id: 'fluid_jet_risk_id', label: 'Risk(s) ID for fluid jet from leakage or failure', type: 'text' },
          { id: 'external_effects_risk_id', label: 'Risk(s) ID for harmful external effects on pipes/hoses', type: 'text' },
        ],
      },
      {
        id: '9.7_relief',
        stepLabel: 'Pressure-relief device',
        requirementText: 'The discharge opening shall be so located and directed that operation of the device will not deposit material on parts that could result in an unacceptable risk.',
        fields: [
          { id: 'pressure_relief_location', label: 'Location in RMF of risk(s) due to the activation of a pressure-relief device', type: 'text' },
        ],
      },
    ],
  },

  '9.8': {
    clauseTitle: '9.8 — Support Systems',
    steps: [
      {
        id: '9.8_general',
        stepLabel: 'Support system risk analysis',
        requirementText: 'Where ME Equipment parts are designed to support loads or to provide actuating forces, the following requirements shall be applied if a mechanical fault could constitute an unacceptable risk.\n\n- Means of attachment of accessories shall avoid incorrect attachment.\n- The risk analysis shall consider mechanical hazards from static, dynamic, vibration, impact and pressure loading.\n- All likely failure effects shall be considered.',
        fields: [
          { id: 'attachment_location', label: 'Location in RMF of risk(s) due to incorrect attachment of accessories', type: 'text' },
          { id: 'risk_analysis_risk_id', label: 'Risk(s) ID for support system risk analysis', type: 'text' },
          { id: 'failure_effects_risk_id', label: 'Risk(s) ID for failure effects', type: 'text' },
        ],
      },
      {
        id: '9.8_tensile',
        stepLabel: 'Tensile safety factor',
        requirementText: 'Support systems shall maintain structural integrity during the expected service life. Tensile Safety Factors shall not be less than those shown in table 21 unless an alternative method demonstrates structural integrity.',
        fields: [
          { id: 'tensile_factor', label: 'Tensile factor', type: 'text' },
          { id: 'structural_integrity_location', label: 'If tensile factor does not comply with table 21, location of structural integrity evaluation', type: 'text' },
        ],
      },
      {
        id: '9.8_patient_support',
        stepLabel: 'Patient support/suspension',
        requirementText: 'ME Equipment parts serving for support or immobilization of patients shall be designed and manufactured so there is no unacceptable risk of physical injuries or of accidental loosening of fixings.',
        fields: [
          { id: 'unacceptable_risk_after_load', label: 'Please list what constitutes an unacceptable risk(s) after the load test', type: 'textarea' },
          { id: 'support_immobilization_location', label: 'Location in RMF of evaluation of parts serving for support or immobilizing patients', type: 'textarea' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §10 Radiation hazards (existing + new)
  // ═══════════════════════════════════════════════════════════
  '10.1': {
    clauseTitle: '10.1 — X-radiation',
    steps: [
      {
        id: '10.1_xray',
        stepLabel: 'X-radiation assessment',
        requirementText: 'Unintended X-radiation from ME Equipment designed to produce diagnostic or therapeutic X-radiation shall be reduced as far as possible by application of applicable particular and collateral standards, or in the absence of these standards by application of the risk management process.',
        fields: [
          { id: 'xradiation_location', label: 'Location in RMF of X-radiation assessment', type: 'text' },
        ],
      },
    ],
  },

  '10.2': {
    clauseTitle: '10.2 — Particle Radiation',
    steps: [
      {
        id: '10.2_particle',
        stepLabel: 'Particle radiation assessment',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the risks associated with alpha, beta, gamma, neutron and other particle radiation.',
        fields: [
          { id: 'particle_radiation_location', label: 'Location in RMF of particle radiation assessment', type: 'text' },
        ],
      },
    ],
  },

  '10.3': {
    clauseTitle: '10.3 — Microwave Radiation',
    steps: [
      {
        id: '10.3_microwave',
        stepLabel: 'Microwave radiation assessment',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the risks associated with microwave radiation.\n\nMicrowave radiation limits and protective measures shall be documented.',
        fields: [
          { id: 'microwave_applicable', label: 'Does the ME equipment emit microwave radiation?', type: 'select', options: ['Yes', 'No'] },
          { id: 'microwave_location', label: 'Location in RMF of microwave radiation assessment', type: 'text' },
        ],
      },
    ],
  },

  '10.4': {
    clauseTitle: '10.4 — Laser Radiation',
    steps: [
      {
        id: '10.4_laser',
        stepLabel: 'Laser radiation assessment',
        requirementText: 'ME equipment incorporating lasers shall comply with IEC 60825-1 (Safety of laser products).\n\nLaser classification, protective measures, warning labels, and risk assessment shall be documented.',
        fields: [
          { id: 'laser_applicable', label: 'Does the ME equipment incorporate lasers?', type: 'select', options: ['Yes', 'No'] },
          { id: 'laser_class', label: 'Laser classification per IEC 60825-1', type: 'select', options: ['Class 1', 'Class 1M', 'Class 1C', 'Class 2', 'Class 2M', 'Class 3R', 'Class 3B', 'Class 4', 'N/A'] },
          { id: 'laser_location', label: 'Location in RMF of laser radiation assessment', type: 'text' },
        ],
      },
    ],
  },

  '10.5': {
    clauseTitle: '10.5 — Visible Electromagnetic Radiation',
    steps: [
      {
        id: '10.5_visible',
        stepLabel: 'Visible radiation assessment',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the risks associated with visible electromagnetic radiation, other than that produced by lasers.',
        fields: [
          { id: 'visible_radiation_location', label: 'Location in RMF of visible electromagnetic radiation assessment', type: 'text' },
        ],
      },
    ],
  },

  '10.6': {
    clauseTitle: '10.6 — Infrared Radiation',
    steps: [
      {
        id: '10.6_infrared',
        stepLabel: 'Infrared radiation assessment',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the risks associated with infrared radiation, other than that produced by lasers and light emitting diodes.',
        fields: [
          { id: 'infrared_location', label: 'Location in RMF of infrared radiation assessment', type: 'text' },
        ],
      },
    ],
  },

  '10.7': {
    clauseTitle: '10.7 — Ultraviolet Radiation',
    steps: [
      {
        id: '10.7_uv',
        stepLabel: 'UV radiation assessment',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the risks associated with ultraviolet radiation, other than that produced by lasers and light emitting diodes.',
        fields: [
          { id: 'uv_location', label: 'Location in RMF of ultraviolet radiation assessment', type: 'text' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §11 Temperatures & other hazards (existing + new)
  // ═══════════════════════════════════════════════════════════
  '11.1': {
    clauseTitle: '11.1 — Excessive Temperatures',
    steps: [
      {
        id: '11.1_accessible',
        stepLabel: 'Accessible parts temperature',
        requirementText: 'ME Equipment parts shall not reach temperatures exceeding the values given in Table 22 and Table 23.\n\nIf the Accessible Parts touch more than 10% of the body or head surface, new temperature limits shall be determined and documented in Risk Management File.',
        fields: [
          { id: 'temp_accessible_location', label: 'Location in RMF of accessible parts temperature assessment', type: 'text' },
        ],
      },
      {
        id: '11.1_applied_heat',
        stepLabel: 'Applied parts — heat supply',
        requirementText: '11.1.2.1 Applied parts intended to supply heat to a patient\n\nThe temperature (hot or cold surfaces) or (where appropriate) the clinical effects shall be determined and documented in the RMF. The temperatures and clinical effects shall be disclosed in the instructions for use.',
        fields: [
          { id: 'temp_applied_heat_location', label: 'Location in RMF of applied parts (heat supply) temperature assessment', type: 'text' },
        ],
      },
      {
        id: '11.1_applied_no_heat',
        stepLabel: 'Applied parts — no heat supply',
        requirementText: '11.1.2.2 Applied parts not intended to supply heat\n\nThe limits of Table 24 shall apply. For Applied Part(s) that exceeds 41°C, clinical effects shall be determined and documented in the RMF.\n\nSurfaces of Applied Parts that are cooled below ambient temperatures can also result in an unacceptable Risk.\n\nIf limits in table 24 are exceeded, the clinical benefit shall be documented.',
        fields: [
          { id: 'temp_applied_no_heat_location', label: 'Location in RMF of applied parts (no heat supply) temperature assessment', type: 'text' },
        ],
      },
      {
        id: '11.1_measurement',
        stepLabel: 'Temperature measurements',
        requirementText: '11.1.3 Measurements\n\nWhere engineering judgement by the Manufacturer indicates that temperature limits cannot be exceeded, no measurement is required. However, the rationale for such judgement shall be documented in the Risk Management File.\n\nIf a thermal regulatory device is justified to make the method inappropriate, an alternative test method may be justified in the RMF.',
        fields: [
          { id: 'temp_measurement_rationale', label: 'Rationale for engineering judgement if no measurement required', type: 'textarea' },
        ],
      },
    ],
  },

  '11.2': {
    clauseTitle: '11.2 — Fire Prevention',
    steps: [
      {
        id: '11.2_fire',
        stepLabel: 'Fire risk in oxygen rich environment',
        requirementText: 'In ME Equipment and ME Systems, the Risk of fire in an Oxygen Rich Environment shall be reduced as far as possible under Normal and Single Fault Conditions.\n\n- a) Where deviations from worst-case limits are made, they shall be justified and documented in the RMF.\n- b) 3) Seals separating compartments shall be evaluated to establish a maintenance interval.',
        fields: [
          { id: 'fire_justification_location', label: 'Justification found in', type: 'doc_reference' },
        ],
      },
    ],
  },

  '11.3': {
    clauseTitle: '11.3 — Fire Enclosures',
    steps: [
      {
        id: '11.3_enclosure',
        stepLabel: 'Fire enclosure analysis',
        requirementText: 'The Risk Management File shall analyse the constructional requirements, and if not met or a different design solution is used, a justification shall be given.',
        fields: [
          { id: 'fire_enclosure_location', label: 'Location in RMF of fire enclosure analysis', type: 'text' },
        ],
      },
    ],
  },

  '11.4': {
    clauseTitle: '11.4 — Biocompatibility',
    steps: [
      {
        id: '11.4_biocompat',
        stepLabel: 'Biocompatibility assessment',
        requirementText: 'Parts of ME equipment that come into contact with the patient, or that contact material intended for introduction into the patient, shall be assessed for biocompatibility in accordance with the ISO 10993 series.\n\nThe assessment shall consider:\n- Nature of the body contact (surface, externally communicating, implant)\n- Duration of contact (limited, prolonged, permanent)\n- Type of tissue contact',
        fields: [
          { id: 'biocompat_applicable', label: 'Are there parts in contact with the patient?', type: 'select', options: ['Yes', 'No'] },
          { id: 'contact_type', label: 'Nature and duration of body contact', type: 'textarea', placeholder: 'e.g. Surface contact, limited (<24h)' },
          { id: 'iso_10993_evaluation', label: 'Reference to ISO 10993 biological evaluation plan/report', type: 'text' },
          { id: 'biocompat_location', label: 'Location in RMF of biocompatibility assessment', type: 'text' },
        ],
      },
    ],
  },

  '11.5': {
    clauseTitle: '11.5 — Flammable Agents',
    steps: [
      {
        id: '11.5_flammable',
        stepLabel: 'Flammable agents assessment',
        requirementText: 'The manufacturer\'s risk management process shall address the possibility of fire and associated mitigations.',
        fields: [
          { id: 'flammable_agents_location', label: 'Location in RMF of flammable agents assessment', type: 'text' },
        ],
      },
    ],
  },

  '11.6': {
    clauseTitle: '11.6 — Fluids: Overflow, Spillage, Cleaning, Sterilization',
    steps: [
      {
        id: '11.6_overflow',
        stepLabel: '11.6.2 — Overflow',
        requirementText: 'If ME Equipment incorporates a reservoir or liquid storage chamber that is liable to be overfilled or to overflow in normal use, liquid overflowing shall not wet any means of protection, nor shall an unacceptable risk be created.',
      },
      {
        id: '11.6_spillage',
        stepLabel: '11.6.3 — Spillage test conditions',
        requirementText: 'ME Equipment requiring the handling of liquids in normal use shall be so constructed that spillage does not wet parts likely to result in loss of basic safety or essential performance.\n\nA quantity of liquid is poured steadily on a point on the top of the Equipment. The type, volume, duration and location are determined through risk analysis.',
        fields: [
          { id: 'spillage_test_location', label: 'Location in RMF of test condition', type: 'text' },
          { id: 'liquid_type', label: 'Type of liquid', type: 'text' },
          { id: 'liquid_quantity', label: 'Quantity of liquid', type: 'text' },
          { id: 'spill_duration', label: 'Duration of spill', type: 'text' },
          { id: 'spill_location', label: 'Location of spill', type: 'text' },
        ],
      },
      {
        id: '11.6_cleaning',
        stepLabel: '11.6.6 — Cleaning & disinfection',
        requirementText: 'The effects of multiple cleanings/disinfections during expected service life shall be evaluated and documented in the Risk Management File.',
        fields: [
          { id: 'cleaning_location', label: 'Location in RMF of cleaning/disinfection evaluation', type: 'text' },
        ],
      },
      {
        id: '11.6_sterilization',
        stepLabel: '11.6.7 — Sterilization',
        requirementText: 'After sterilization procedure, ME Equipment/ME System shall show no signs of deterioration that could result in an unacceptable Risk.',
        fields: [
          { id: 'sterilization_parts', label: 'Parts and/or accessories to be sterilized', type: 'textarea' },
          { id: 'sterilization_deterioration_location', label: 'Location in RMF of risk(s) due to deterioration', type: 'text' },
        ],
      },
      {
        id: '11.6_compatibility',
        stepLabel: '11.6.8 — Substance compatibility',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the risks associated with compatibility with substances used with the ME Equipment.',
        fields: [
          { id: 'compatibility_location', label: 'Location in RMF of risk(s) due to compatibility with substances used', type: 'text' },
        ],
      },
    ],
  },

  '11.7': {
    clauseTitle: '11.7 — Interrupted Operation',
    steps: [
      {
        id: '11.7_interrupted',
        stepLabel: 'Interrupted operation assessment',
        requirementText: 'ME equipment shall be designed so that interruption and subsequent restoration of the supply mains does not result in a hazardous situation.\n\nThe risk management process shall address:\n- Loss of stored data or settings\n- Automatic restart behaviour\n- Return to safe state after power restoration',
        fields: [
          { id: 'interrupted_operation_applicable', label: 'Could interrupted operation create a hazardous situation?', type: 'select', options: ['Yes', 'No'] },
          { id: 'restart_behaviour', label: 'Describe restart behaviour after power interruption', type: 'textarea' },
          { id: 'interrupted_location', label: 'Location in RMF of interrupted operation assessment', type: 'text' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §12 Accuracy & hazardous outputs (existing + new)
  // ═══════════════════════════════════════════════════════════
  '12.1': {
    clauseTitle: '12.1 — Accuracy of Controls and Instruments',
    steps: [
      {
        id: '12.1_accuracy',
        stepLabel: 'Accuracy risk assessment',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the risks associated with accuracy of controls and instruments.',
        fields: [
          { id: 'accuracy_risk_id', label: 'Risk(s) ID', type: 'text' },
        ],
      },
    ],
  },

  '12.2': {
    clauseTitle: '12.2 — Usability',
    steps: [
      {
        id: '12.2_usability',
        stepLabel: 'Usability / human factors',
        requirementText: 'ME equipment shall be designed with due regard to the mental and physical abilities of the intended users.\n\nConsiderations include:\n- Clear and unambiguous presentation of information\n- Logical grouping and sequencing of controls\n- Prevention of unintentional activation\n- Feedback on the current state of the equipment\n- Refer to IEC 62366-1 (Application of usability engineering) and IEC 60601-1-6 (Usability)',
        fields: [
          { id: 'usability_process', label: 'Has a usability engineering process per IEC 62366-1 been applied?', type: 'select', options: ['Yes', 'No', 'In progress'] },
          { id: 'usability_file_location', label: 'Location of usability engineering file', type: 'text' },
          { id: 'use_errors_identified', label: 'Have critical use errors been identified and mitigated?', type: 'select', options: ['Yes', 'No'] },
        ],
      },
    ],
  },

  '12.3': {
    clauseTitle: '12.3 — Alarm Systems',
    steps: [
      {
        id: '12.3_alarms',
        stepLabel: 'Alarm system requirements',
        requirementText: 'Where ME equipment incorporates alarm systems, the requirements of IEC 60601-1-8 shall apply.\n\nAlarm systems shall:\n- Generate appropriate alarm signals for hazardous conditions\n- Use standardised alarm priority levels (high, medium, low)\n- Allow clinically appropriate alarm limits\n- Provide alarm condition indicators\n- Not be defeated without clear indication',
        fields: [
          { id: 'alarm_system_present', label: 'Does the ME equipment have an alarm system?', type: 'select', options: ['Yes', 'No'] },
          { id: 'iec_60601_1_8_compliant', label: 'Does the alarm system comply with IEC 60601-1-8?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'alarm_priorities', label: 'Describe alarm priority levels implemented', type: 'textarea' },
          { id: 'alarm_location', label: 'Location of alarm system documentation', type: 'text' },
        ],
      },
    ],
  },

  '12.4': {
    clauseTitle: '12.4 — Hazardous Output Conditions',
    steps: [
      {
        id: '12.4_safety_limits',
        stepLabel: '12.4.1 — Intentional exceeding of safety limits',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the risks associated with hazardous output arising from the intentional exceeding of safety limits.',
        fields: [
          { id: 'safety_limits_risk_id', label: 'Risk(s) ID for intentional exceeding of safety limits', type: 'text' },
        ],
      },
      {
        id: '12.4_indication',
        stepLabel: '12.4.2 — Indication relevant to safety',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the need to indicate any hazardous output.\n\nExample: Prior to the delivery of energy or substances to a patient or an X-ray output.',
        fields: [
          { id: 'indication_location', label: 'Location in RMF of risk(s) due to hazardous output(s)', type: 'text' },
        ],
      },
      {
        id: '12.4_excessive',
        stepLabel: '12.4.3 — Accidental selection of excessive output',
        requirementText: 'If a ME Equipment/ME system have multi-purposes such as different treatments, the Risks associated with accidental selection of wrong output with a higher intensity, shall be addressed in the Risk Analysis.',
        fields: [
          { id: 'excessive_output_risk_id', label: 'Risk(s) ID for accidental selection of excessive output values', type: 'text' },
        ],
      },
      {
        id: '12.4_incorrect',
        stepLabel: '12.4.4 — Incorrect output',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the risks associated with incorrect output.',
        fields: [
          { id: 'incorrect_output_risk_id', label: 'Risk(s) ID for incorrect output', type: 'text' },
        ],
      },
      {
        id: '12.4_radiotherapy',
        stepLabel: '12.4.5.3 — Radiotherapy equipment',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the risks associated with radiotherapy.',
        fields: [
          { id: 'radiotherapy_risk_id', label: 'Risk(s) ID for radiotherapy equipment', type: 'text' },
        ],
      },
      {
        id: '12.4_other_radiation',
        stepLabel: '12.4.5.4 — Other diagnostic/therapeutic radiation',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the risks associated with ME Equipment producing diagnostic or therapeutic radiation other than for diagnostic X-rays and radiotherapy.',
        fields: [
          { id: 'other_radiation_risk_id', label: 'Risk(s) ID for other diagnostic/therapeutic radiation', type: 'text' },
        ],
      },
      {
        id: '12.4_acoustic',
        stepLabel: '12.4.6 — Diagnostic/therapeutic acoustic pressure',
        requirementText: 'When applicable, the manufacturer shall address in the risk management process the risks associated with diagnostic or therapeutic acoustic pressure.',
        fields: [
          { id: 'acoustic_pressure_risk_id', label: 'Risk(s) ID for diagnostic/therapeutic acoustic pressure', type: 'text' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §13 Hazardous situations (existing + new)
  // ═══════════════════════════════════════════════════════════
  '13.1': {
    clauseTitle: '13.1 — General Requirements for Hazardous Situations',
    steps: [
      {
        id: '13.1_general',
        stepLabel: 'General hazardous situations',
        requirementText: 'ME equipment shall be designed and manufactured to reduce the risks from hazardous situations that could arise from:\n- Normal use\n- Single fault conditions\n- Reasonably foreseeable misuse\n\nThe risk management process shall identify and address all foreseeable hazardous situations.',
        fields: [
          { id: 'hazardous_situations_identified', label: 'Have all foreseeable hazardous situations been identified?', type: 'select', options: ['Yes', 'No'] },
          { id: 'hazardous_situations_location', label: 'Location in RMF of hazardous situations analysis', type: 'text' },
        ],
      },
    ],
  },

  '13.2': {
    clauseTitle: '13.2 — Leakage of Liquid',
    steps: [
      {
        id: '13.2_leakage',
        stepLabel: 'Liquid leakage assessment',
        requirementText: 'ME Equipment shall be so constructed that liquid that might escape in a single fault condition does not result in an unacceptable risk.',
        fields: [
          { id: 'leakage_location', label: 'Location in RMF of risk(s) due to leakage', type: 'text' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §14 PEMS (Programmable Electrical Medical Systems)
  // ═══════════════════════════════════════════════════════════
  '14.1': {
    clauseTitle: '14.1 — General Requirements for PEMS',
    steps: [
      {
        id: '14.1_general',
        stepLabel: 'PEMS applicability',
        requirementText: 'These requirements apply to any ME equipment or ME system that contains one or more programmable electronic subsystems (PESS).\n\nA PEMS consists of hardware and software working together. The requirements complement IEC 62304 (Medical device software lifecycle).',
        fields: [
          { id: 'pems_applicable', label: 'Does the ME equipment contain programmable electronic subsystems?', type: 'select', options: ['Yes', 'No'] },
          { id: 'pess_list', label: 'List all programmable electronic subsystems (PESS)', type: 'textarea' },
          { id: 'iec_62304_applied', label: 'Is IEC 62304 applied for software lifecycle?', type: 'select', options: ['Yes', 'No', 'N/A'] },
        ],
      },
    ],
  },

  '14.2': {
    clauseTitle: '14.2 — PEMS Development Life Cycle',
    steps: [
      {
        id: '14.2_lifecycle',
        stepLabel: 'Development lifecycle documentation',
        requirementText: 'The manufacturer shall document the PEMS development lifecycle including:\n- Planning activities\n- Design and implementation phases\n- Verification and validation activities\n- Configuration management\n- Problem resolution process',
        fields: [
          { id: 'lifecycle_plan_location', label: 'Location of PEMS development lifecycle plan', type: 'text' },
          { id: 'lifecycle_phases', label: 'Describe development lifecycle phases', type: 'textarea' },
        ],
      },
    ],
  },

  '14.3': {
    clauseTitle: '14.3 — Problem Resolution and Change Management',
    steps: [
      {
        id: '14.3_problem',
        stepLabel: 'Problem resolution process',
        requirementText: 'The manufacturer shall establish a problem resolution process for the PEMS that includes:\n- Problem reporting and tracking\n- Analysis and investigation\n- Corrective action implementation\n- Verification of corrective actions\n\nA change management process shall be established to control modifications to the PEMS.',
        fields: [
          { id: 'problem_resolution_process', label: 'Reference to problem resolution process document', type: 'text' },
          { id: 'change_management_process', label: 'Reference to change management process document', type: 'text' },
        ],
      },
    ],
  },

  '14.4': {
    clauseTitle: '14.4 — PEMS Requirements',
    steps: [
      {
        id: '14.4_requirements',
        stepLabel: 'PEMS requirements specification',
        requirementText: 'The manufacturer shall specify PEMS requirements including:\n- Functional requirements\n- Safety requirements derived from risk analysis\n- Performance requirements\n- Interface requirements\n- Security requirements (where applicable)',
        fields: [
          { id: 'pems_requirements_location', label: 'Location of PEMS requirements specification', type: 'text' },
          { id: 'safety_requirements_derived', label: 'Have safety requirements been derived from risk analysis?', type: 'select', options: ['Yes', 'No'] },
        ],
      },
    ],
  },

  '14.5': {
    clauseTitle: '14.5 — PEMS Architecture',
    steps: [
      {
        id: '14.5_architecture',
        stepLabel: 'PEMS architecture design',
        requirementText: 'The manufacturer shall document the PEMS architecture including:\n- Hardware/software partitioning\n- Identification of safety-related subsystems\n- Interfaces between subsystems\n- Risk control measures implemented in the architecture',
        fields: [
          { id: 'architecture_document_location', label: 'Location of PEMS architecture document', type: 'text' },
          { id: 'hw_sw_partitioning', label: 'Describe hardware/software partitioning', type: 'textarea' },
          { id: 'safety_subsystems', label: 'List safety-related subsystems', type: 'textarea' },
        ],
      },
    ],
  },

  '14.6': {
    clauseTitle: '14.6 — PEMS Design and Implementation',
    steps: [
      {
        id: '14.6_design',
        stepLabel: 'Design and implementation',
        requirementText: 'The manufacturer shall document the detailed design and implementation including:\n- Coding standards\n- Design patterns used\n- Implementation of safety requirements\n- Traceability from requirements to implementation',
        fields: [
          { id: 'coding_standards', label: 'Reference to coding standards used', type: 'text' },
          { id: 'traceability_maintained', label: 'Is requirements-to-implementation traceability maintained?', type: 'select', options: ['Yes', 'No'] },
          { id: 'design_doc_location', label: 'Location of detailed design documentation', type: 'text' },
        ],
      },
    ],
  },

  '14.7': {
    clauseTitle: '14.7 — PEMS Verification',
    steps: [
      {
        id: '14.7_verification',
        stepLabel: 'PEMS verification activities',
        requirementText: 'The manufacturer shall perform verification activities including:\n- Unit testing\n- Integration testing\n- Code reviews / static analysis\n- Dynamic analysis\n- Requirements coverage analysis',
        fields: [
          { id: 'unit_testing', label: 'Have unit tests been performed?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'integration_testing', label: 'Have integration tests been performed?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'code_review', label: 'Have code reviews been performed?', type: 'select', options: ['Yes', 'No'] },
          { id: 'verification_report_location', label: 'Location of PEMS verification report', type: 'text' },
        ],
      },
    ],
  },

  '14.8': {
    clauseTitle: '14.8 — PEMS Validation',
    steps: [
      {
        id: '14.8_validation',
        stepLabel: 'PEMS validation',
        requirementText: 'The manufacturer shall validate the PEMS to demonstrate that it meets the defined requirements and intended use.\n\nValidation shall include:\n- System-level testing in the intended use environment\n- Testing of safety requirements\n- User acceptance testing (where applicable)',
        fields: [
          { id: 'validation_plan_location', label: 'Location of PEMS validation plan', type: 'text' },
          { id: 'validation_report_location', label: 'Location of PEMS validation report', type: 'text' },
          { id: 'safety_requirements_validated', label: 'Have all safety requirements been validated?', type: 'select', options: ['Yes', 'No'] },
        ],
      },
    ],
  },

  '14.9': {
    clauseTitle: '14.9 — PEMS Modification',
    steps: [
      {
        id: '14.9_modification',
        stepLabel: 'PEMS modification process',
        requirementText: 'Modifications to the PEMS after initial release shall be managed through:\n- Impact analysis (safety, performance, regulatory)\n- Regression testing\n- Re-verification and re-validation as needed\n- Updated documentation',
        fields: [
          { id: 'modification_process', label: 'Reference to PEMS modification/change control process', type: 'text' },
          { id: 'regression_testing_policy', label: 'Describe regression testing approach', type: 'textarea' },
        ],
      },
    ],
  },

  '14.10': {
    clauseTitle: '14.10 — Connection of PEMS by Network/Data Coupling',
    steps: [
      {
        id: '14.10_network',
        stepLabel: 'Network connectivity requirements',
        requirementText: 'Where the PEMS is connected to other equipment or networks, the manufacturer shall:\n- Identify risks from network connections\n- Implement measures to prevent unauthorized access\n- Ensure basic safety and essential performance are maintained during network failures\n- Document network interface specifications',
        fields: [
          { id: 'network_connected', label: 'Is the PEMS connected to networks or other equipment?', type: 'select', options: ['Yes', 'No'] },
          { id: 'network_risks_location', label: 'Location of network-related risk assessment', type: 'text' },
          { id: 'cybersecurity_measures', label: 'Describe cybersecurity measures implemented', type: 'textarea' },
        ],
      },
    ],
  },

  '14.11': {
    clauseTitle: '14.11 — PEMS Intended for Compilation',
    steps: [
      {
        id: '14.11_compilation',
        stepLabel: 'PEMS for compilation',
        requirementText: 'Where PEMS components are intended for compilation into larger systems, the manufacturer shall provide sufficient documentation for the integrator to maintain safety.',
        fields: [
          { id: 'compilation_applicable', label: 'Is this PEMS intended for compilation into a larger system?', type: 'select', options: ['Yes', 'No'] },
          { id: 'integration_docs', label: 'Reference to integration documentation provided', type: 'text' },
        ],
      },
    ],
  },

  '14.12': {
    clauseTitle: '14.12 — Documentation Requirements for PEMS',
    steps: [
      {
        id: '14.12_documentation',
        stepLabel: 'PEMS documentation',
        requirementText: 'PEMS documentation shall include:\n- Software development plan\n- Software requirements specification\n- Software architecture document\n- Software detailed design\n- Software test plans and reports\n- Software release notes\n- Known anomalies list',
        fields: [
          { id: 'sw_dev_plan', label: 'Software development plan available?', type: 'select', options: ['Yes', 'No'] },
          { id: 'sw_requirements', label: 'Software requirements specification available?', type: 'select', options: ['Yes', 'No'] },
          { id: 'sw_architecture', label: 'Software architecture document available?', type: 'select', options: ['Yes', 'No'] },
          { id: 'sw_test_reports', label: 'Software test plans and reports available?', type: 'select', options: ['Yes', 'No'] },
          { id: 'known_anomalies', label: 'Known anomalies list maintained?', type: 'select', options: ['Yes', 'No'] },
        ],
      },
    ],
  },

  '14.13': {
    clauseTitle: '14.13 — PEMS Risk Management',
    steps: [
      {
        id: '14.13_risk',
        stepLabel: 'PEMS-specific risk management',
        requirementText: 'The risk management process for PEMS shall include:\n- Software hazard analysis\n- Identification of software items that could contribute to hazardous situations\n- Risk control measures implemented in software\n- Verification that software risk control measures are effective',
        fields: [
          { id: 'sw_hazard_analysis', label: 'Has software hazard analysis been performed?', type: 'select', options: ['Yes', 'No'] },
          { id: 'sw_risk_controls', label: 'Describe software risk control measures', type: 'textarea' },
          { id: 'sw_risk_location', label: 'Location of PEMS risk management documentation', type: 'text' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §15 Construction of ME equipment
  // ═══════════════════════════════════════════════════════════
  '15.1': {
    clauseTitle: '15.1 — Voltage and/or Energy in Construction',
    steps: [
      {
        id: '15.1_voltage',
        stepLabel: 'Voltage/energy constraints',
        requirementText: 'Construction shall ensure that voltages and energies within the ME equipment do not create unacceptable risks.\n\nInternal circuits operating at hazardous voltages shall be adequately insulated and protected.',
        fields: [
          { id: 'max_internal_voltage', label: 'Maximum internal voltage', type: 'text', placeholder: 'e.g. 400V DC' },
          { id: 'voltage_protection', label: 'Describe voltage/energy protection measures in construction', type: 'textarea' },
        ],
      },
    ],
  },

  '15.2': {
    clauseTitle: '15.2 — Enclosures and Protective Covers',
    steps: [
      {
        id: '15.2_enclosures',
        stepLabel: 'Enclosure requirements',
        requirementText: 'Enclosures shall:\n- Prevent access to live parts and moving parts\n- Be adequately secured (tools required for access to hazardous parts)\n- Maintain protection after removal and replacement of covers\n- Provide adequate ventilation while maintaining protection',
        fields: [
          { id: 'enclosure_tool_required', label: 'Is a tool required to open the enclosure?', type: 'select', options: ['Yes', 'No — justified in RMF'] },
          { id: 'ventilation_adequate', label: 'Is ventilation adequate while maintaining protection?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'enclosure_notes', label: 'Notes on enclosure compliance', type: 'textarea' },
        ],
      },
    ],
  },

  '15.3': {
    clauseTitle: '15.3 — Wiring, Connectors and Interconnections',
    steps: [
      {
        id: '15.3_wiring',
        stepLabel: 'Internal wiring requirements',
        requirementText: 'Internal wiring shall:\n- Be adequately supported and protected from damage\n- Have appropriate current-carrying capacity\n- Use appropriate insulation for the voltage and environment\n- Be routed to prevent contact with hot parts or moving parts\n- Have connectors that prevent incorrect connection where this could create a hazard',
        fields: [
          { id: 'wiring_compliant', label: 'Does internal wiring meet requirements?', type: 'select', options: ['Yes', 'No — action required'] },
          { id: 'connector_keying', label: 'Are connectors keyed to prevent incorrect connection?', type: 'select', options: ['Yes', 'No — justified in RMF', 'N/A'] },
          { id: 'wiring_notes', label: 'Notes on wiring compliance', type: 'textarea' },
        ],
      },
    ],
  },

  '15.4': {
    clauseTitle: '15.4 — Mains Parts, Components and Layout',
    steps: [
      {
        id: '15.4_layout',
        stepLabel: 'Component layout and PCB design',
        requirementText: 'Mains parts and component layout shall ensure:\n- Adequate creepage distances and clearances on PCBs\n- Components rated for the applied voltage and current\n- Thermal management considerations\n- Protection against solder bridges and other manufacturing defects that could compromise safety',
        fields: [
          { id: 'pcb_creepage_compliant', label: 'Do PCBs meet creepage/clearance requirements?', type: 'select', options: ['Yes', 'No — action required', 'N/A'] },
          { id: 'component_ratings', label: 'Are all components rated appropriately?', type: 'select', options: ['Yes', 'No — justified via cl. 4.8'] },
          { id: 'layout_notes', label: 'Notes on component layout compliance', type: 'textarea' },
        ],
      },
    ],
  },

  '15.5': {
    clauseTitle: '15.5 — Supply Connection and ME Equipment Power Inlet',
    steps: [
      {
        id: '15.5_supply',
        stepLabel: 'Power inlet requirements',
        requirementText: 'Supply connections and power inlets shall:\n- Be appropriate for the rated voltage and current\n- Include strain relief for power cords\n- Use appliance couplers that comply with relevant standards\n- Include adequate marking of terminals\n- Provide reliable protective earth connections (Class I)',
        fields: [
          { id: 'power_inlet_type', label: 'Type of power inlet', type: 'select', options: ['Permanently connected', 'Appliance coupler (IEC 60320)', 'Plug — non-detachable cord', 'Other'] },
          { id: 'strain_relief', label: 'Is strain relief provided?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'pe_connection', label: 'Is protective earth connection reliable? (Class I only)', type: 'select', options: ['Yes', 'No', 'N/A — Class II or internally powered'] },
          { id: 'supply_connection_notes', label: 'Notes on supply connection compliance', type: 'textarea' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §16 ME Systems
  // ═══════════════════════════════════════════════════════════
  '16.1': {
    clauseTitle: '16.1 — General Requirements for ME Systems',
    steps: [
      {
        id: '16.1_general',
        stepLabel: 'ME system identification',
        requirementText: 'An ME system is a combination of items of equipment, at least one of which is ME equipment, interconnected by functional connection or by use of a multiple socket outlet.\n\nThe manufacturer of the ME system is responsible for the safety of the combination.',
        fields: [
          { id: 'is_me_system', label: 'Does the device form part of an ME system?', type: 'select', options: ['Yes', 'No'] },
          { id: 'system_components', label: 'List all components of the ME system', type: 'textarea' },
          { id: 'system_manufacturer', label: 'Who is the responsible manufacturer of the ME system?', type: 'text' },
        ],
      },
    ],
  },

  '16.2': {
    clauseTitle: '16.2 — ME System Enclosures and Protective Covers',
    steps: [
      {
        id: '16.2_enclosures',
        stepLabel: 'System enclosure requirements',
        requirementText: 'When multiple items are combined into an ME system, the resulting combination shall maintain the same level of protection as the individual items.\n\nIf new accessible parts are created by the combination, they shall be adequately protected.',
        fields: [
          { id: 'system_enclosure_compliant', label: 'Does the ME system maintain adequate enclosure protection?', type: 'select', options: ['Yes', 'No — action required', 'N/A'] },
          { id: 'system_enclosure_notes', label: 'Notes on ME system enclosure compliance', type: 'textarea' },
        ],
      },
    ],
  },

  '16.3': {
    clauseTitle: '16.3 — Protection of Non-ME Equipment in ME System',
    steps: [
      {
        id: '16.3_non_me',
        stepLabel: 'Non-ME equipment requirements',
        requirementText: 'Non-medical equipment used within the patient environment as part of an ME system shall:\n- Comply with its own safety standard (e.g., IEC 62368-1)\n- Be provided with additional measures to achieve the same level of safety as ME equipment\n- Meet leakage current limits when connected in the ME system',
        fields: [
          { id: 'non_me_equipment_list', label: 'List non-ME equipment in the ME system', type: 'textarea' },
          { id: 'non_me_standards', label: 'Safety standards applied to non-ME equipment', type: 'textarea' },
          { id: 'additional_measures', label: 'Additional safety measures applied', type: 'textarea' },
        ],
      },
    ],
  },

  '16.4': {
    clauseTitle: '16.4 — Leakage Currents of ME Systems',
    steps: [
      {
        id: '16.4_leakage',
        stepLabel: 'System leakage currents',
        requirementText: 'The total leakage current of the ME system shall not exceed the limits specified for the individual ME equipment.\n\nWhen multiple items are connected, the cumulative earth leakage current and patient leakage current shall be measured and documented.',
        fields: [
          { id: 'system_earth_leakage', label: 'Combined earth leakage current of ME system (mA)', type: 'text' },
          { id: 'system_patient_leakage', label: 'Combined patient leakage current (µA)', type: 'text' },
          { id: 'system_leakage_compliant', label: 'Are system leakage currents within limits?', type: 'select', options: ['Yes', 'No — action required'] },
        ],
      },
    ],
  },

  '16.5': {
    clauseTitle: '16.5 — Separation Requirements for ME Systems',
    steps: [
      {
        id: '16.5_separation',
        stepLabel: 'System-level separation',
        requirementText: 'The separation (creepage distances and air clearances) between parts of different items in the ME system shall be maintained.\n\nAdditional separation devices (e.g., isolation transformers, additional insulation) may be required when combining equipment.',
        fields: [
          { id: 'system_separation_maintained', label: 'Are separation requirements maintained at system level?', type: 'select', options: ['Yes', 'No — additional measures needed'] },
          { id: 'separation_devices', label: 'Describe additional separation devices used (if any)', type: 'textarea' },
        ],
      },
    ],
  },

  '16.6': {
    clauseTitle: '16.6 — ME System Alarm Systems',
    steps: [
      {
        id: '16.6_alarms',
        stepLabel: 'System-level alarms',
        requirementText: 'When an ME system includes alarm systems from multiple items, the system-level alarm management shall ensure:\n- No loss of alarm information\n- Appropriate prioritization of alarms\n- Clear indication of alarm source',
        fields: [
          { id: 'system_alarms_present', label: 'Does the ME system combine alarm systems?', type: 'select', options: ['Yes', 'No'] },
          { id: 'alarm_management', label: 'Describe system-level alarm management', type: 'textarea' },
        ],
      },
    ],
  },

  '16.7': {
    clauseTitle: '16.7 — Power Supply of ME Systems',
    steps: [
      {
        id: '16.7_power',
        stepLabel: 'System power supply',
        requirementText: 'The power supply arrangement for the ME system shall:\n- Not exceed the rating of the multiple socket outlet (if used)\n- Provide overload protection\n- Maintain safety if individual items are disconnected and reconnected',
        fields: [
          { id: 'mso_used', label: 'Is a multiple socket outlet (MSO) used?', type: 'select', options: ['Yes', 'No'] },
          { id: 'total_power_draw', label: 'Total power draw of ME system', type: 'text', placeholder: 'e.g. 1500 VA' },
          { id: 'overload_protection', label: 'Is overload protection provided?', type: 'select', options: ['Yes', 'No'] },
        ],
      },
    ],
  },

  '16.8': {
    clauseTitle: '16.8 — ME System Marking and Documentation',
    steps: [
      {
        id: '16.8_marking',
        stepLabel: 'System marking and documentation',
        requirementText: 'The ME system shall be accompanied by:\n- System-level instructions for use\n- System configuration description\n- Identification of all components\n- System-level safety information',
        fields: [
          { id: 'system_ifu', label: 'Is system-level IFU provided?', type: 'select', options: ['Yes', 'No'] },
          { id: 'system_config_documented', label: 'Is the system configuration documented?', type: 'select', options: ['Yes', 'No'] },
          { id: 'system_marking_notes', label: 'Notes on ME system marking compliance', type: 'textarea' },
        ],
      },
    ],
  },

  '16.9': {
    clauseTitle: '16.9 — Network/Data Coupling for ME Systems',
    steps: [
      {
        id: '16.9_network',
        stepLabel: 'System network requirements',
        requirementText: 'Where an ME system includes network or data coupling:\n- The manufacturer shall identify risks from network connections within the system\n- Basic safety and essential performance shall be maintained during network failures\n- The system shall be protected against unauthorized access\n- Data integrity shall be maintained',
        fields: [
          { id: 'system_network_used', label: 'Does the ME system use network/data coupling?', type: 'select', options: ['Yes', 'No'] },
          { id: 'network_failure_assessment', label: 'Has network failure impact been assessed?', type: 'select', options: ['Yes', 'No', 'N/A'] },
          { id: 'system_network_notes', label: 'Notes on ME system network compliance', type: 'textarea' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §17 Electromagnetic compatibility (EMC)
  // ═══════════════════════════════════════════════════════════
  '17.1': {
    clauseTitle: '17.1 — General EMC Requirements',
    steps: [
      {
        id: '17.1_general',
        stepLabel: 'General EMC compliance',
        requirementText: 'ME equipment and ME systems shall comply with the EMC requirements of IEC 60601-1-2.\n\nThe manufacturer shall ensure that the ME equipment performs as intended in its specified electromagnetic environment and does not generate electromagnetic disturbances that could affect other equipment.',
        fields: [
          { id: 'emc_standard_applied', label: 'Is IEC 60601-1-2 applied?', type: 'select', options: ['Yes', 'No'] },
          { id: 'intended_em_environment', label: 'Describe the intended electromagnetic environment', type: 'select', options: ['Professional healthcare facility', 'Home healthcare environment', 'Special environment — specify'] },
          { id: 'emc_general_notes', label: 'Notes on general EMC compliance', type: 'textarea' },
        ],
      },
    ],
  },

  '17.2': {
    clauseTitle: '17.2 — Electromagnetic Emissions',
    steps: [
      {
        id: '17.2_emissions',
        stepLabel: 'Emission requirements',
        requirementText: 'ME equipment shall comply with electromagnetic emission limits including:\n- Conducted emissions\n- Radiated emissions\n- Harmonic current emissions\n- Voltage fluctuations and flicker\n\nEmission limits depend on the classification of the intended environment.',
        fields: [
          { id: 'emissions_tested', label: 'Have emission tests been performed?', type: 'select', options: ['Yes', 'No', 'In progress'] },
          { id: 'emission_class', label: 'Emission classification', type: 'select', options: ['Group 1 Class A', 'Group 1 Class B', 'Group 2 Class A', 'Group 2 Class B'] },
          { id: 'emissions_test_report', label: 'Reference to emissions test report', type: 'text' },
        ],
      },
    ],
  },

  '17.3': {
    clauseTitle: '17.3 — Electromagnetic Immunity',
    steps: [
      {
        id: '17.3_immunity',
        stepLabel: 'Immunity requirements',
        requirementText: 'ME equipment shall demonstrate immunity to electromagnetic disturbances including:\n- Electrostatic discharge (ESD)\n- Radiated RF electromagnetic fields\n- Electrical fast transients/burst\n- Surge\n- Conducted RF disturbances\n- Power frequency magnetic fields\n- Voltage dips, interruptions and variations\n\nDuring and after immunity tests, basic safety and essential performance shall be maintained.',
        fields: [
          { id: 'immunity_tested', label: 'Have immunity tests been performed?', type: 'select', options: ['Yes', 'No', 'In progress'] },
          { id: 'essential_performance_maintained', label: 'Is essential performance maintained during/after immunity tests?', type: 'select', options: ['Yes', 'No — deviation documented'] },
          { id: 'immunity_test_report', label: 'Reference to immunity test report', type: 'text' },
        ],
      },
    ],
  },

  '17.4': {
    clauseTitle: '17.4 — EMC Documentation',
    steps: [
      {
        id: '17.4_documentation',
        stepLabel: 'EMC documentation requirements',
        requirementText: 'EMC documentation shall include:\n- EMC test plan\n- EMC test reports\n- Rationale for test level selection\n- Declaration of electromagnetic environment\n- EMC tables for instructions for use (per IEC 60601-1-2)\n- Risk assessment for EMC-related hazards',
        fields: [
          { id: 'emc_test_plan', label: 'EMC test plan available?', type: 'select', options: ['Yes', 'No'] },
          { id: 'emc_test_reports', label: 'EMC test reports available?', type: 'select', options: ['Yes', 'No'] },
          { id: 'emc_risk_assessment', label: 'EMC risk assessment performed?', type: 'select', options: ['Yes', 'No'] },
          { id: 'emc_ifu_tables', label: 'EMC guidance tables included in IFU?', type: 'select', options: ['Yes', 'No'] },
          { id: 'emc_doc_notes', label: 'Notes on EMC documentation', type: 'textarea' },
        ],
      },
    ],
  },
};
