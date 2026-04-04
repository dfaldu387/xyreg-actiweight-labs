/**
 * MDR Annex I (GSPRs) — Clause-Specific Form Field Definitions
 * Step-by-step guided structure for General Safety and Performance Requirements.
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const MDR_ANNEX_I_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  // ═══════════════════════════════════════════════════════════
  // Chapter I — General Requirements (GSPRs 1–9)
  // ═══════════════════════════════════════════════════════════
  '1': {
    clauseTitle: 'GSPR 1 — Intended Performance and Safety',
    evidenceRequired: true,
    steps: [
      {
        id: '1_performance',
        stepLabel: 'Performance & Safety Demonstration',
        requirementText: 'Devices shall achieve their intended performance and shall be designed and manufactured in such a way that, during normal conditions of use, they are suitable for their intended purpose.',
        fields: [
          { id: 'intended_performance', label: 'Intended performance description', type: 'richtext', helpText: 'Describe how the device achieves its intended performance. Reference test data, clinical evidence, and design verification results.' },
          { id: 'safety_demonstration', label: 'Safety during normal use', type: 'richtext', helpText: 'Describe safety measures for patients, users, and third parties during normal conditions of use.' },
          { id: 'evidence_ref', label: 'Supporting evidence', type: 'doc_reference', required: true, helpText: 'Link to performance test reports, clinical evaluation, or design verification documents.' },
        ],
      },
    ],
  },

  '2': {
    clauseTitle: 'GSPR 2 — Risk Management (ALARP)',
    evidenceRequired: true,
    steps: [
      {
        id: '2_risk_mgmt',
        stepLabel: 'Risk Management System',
        requirementText: 'Manufacturers shall establish, implement, document and maintain a risk management system. Risk control measures shall reduce risks as far as possible (ALARP principle).',
        fields: [
          { id: 'risk_system', label: 'Risk management system description', type: 'richtext', helpText: 'Describe how ISO 14971 is applied. Reference the risk management plan and file.' },
          { id: 'alarp_demonstration', label: 'ALARP demonstration', type: 'richtext', helpText: 'Describe how risks have been reduced as far as possible, including the priority order of risk control measures.' },
          { id: 'risk_file_ref', label: 'Risk management file', type: 'doc_reference', required: true, helpText: 'Link to the risk management file.' },
        ],
      },
    ],
  },

  '3': {
    clauseTitle: 'GSPR 3 — Applicable GSPRs and Justification',
    evidenceRequired: true,
    steps: [
      {
        id: '3_gspr_applicability',
        stepLabel: 'GSPR Applicability Assessment',
        requirementText: 'Identify which GSPRs apply to the device based on its intended purpose. Justify why non-applicable requirements do not apply.',
        fields: [
          { id: 'applicable_gsprs', label: 'Applicable GSPRs', type: 'richtext', helpText: 'List all GSPRs that apply to this device based on its intended purpose, technology, and patient population.' },
          { id: 'non_applicable_justification', label: 'Non-applicable GSPRs with justification', type: 'richtext', helpText: 'For each non-applicable GSPR, provide a clear justification (e.g. "GSPR 17 — not applicable, device does not emit radiation").' },
          { id: 'gspr_checklist_ref', label: 'GSPR checklist document', type: 'doc_reference', required: true, helpText: 'Link to the GSPR applicability checklist.' },
        ],
      },
    ],
  },

  '4': {
    clauseTitle: 'GSPR 4 — Risk Control Priority',
    evidenceRequired: true,
    steps: [
      {
        id: '4_risk_priority',
        stepLabel: 'Risk Mitigation Priority Order',
        requirementText: 'Apply risk management measures in priority order: (1) eliminate or reduce risks through inherently safe design, (2) adequate protection measures, (3) provide information for safety.',
        fields: [
          { id: 'priority_order', label: 'Priority order application', type: 'richtext', helpText: 'Demonstrate that the priority hierarchy was followed for each identified risk. Justify when lower-priority measures were used.' },
          { id: 'residual_risk_info', label: 'Information provided for residual risks', type: 'richtext', helpText: 'Describe safety information provided to users about residual risks (IFU, labels, training).' },
        ],
      },
    ],
  },

  '5': {
    clauseTitle: 'GSPR 5 — Patient Clinical Condition and Safety',
    evidenceRequired: true,
    steps: [
      {
        id: '5_clinical_safety',
        stepLabel: 'Clinical Safety Assessment',
        requirementText: 'Devices shall not adversely affect the clinical condition or safety of patients when used as intended.',
        fields: [
          { id: 'clinical_assessment', label: 'Clinical safety demonstration', type: 'richtext', helpText: 'Describe how the device has been shown not to adversely affect patient clinical condition. Reference clinical data and biocompatibility testing.' },
          { id: 'clinical_evidence_ref', label: 'Clinical evidence', type: 'doc_reference', helpText: 'Link to clinical evaluation report or relevant clinical data.' },
        ],
      },
    ],
  },

  '6': {
    clauseTitle: 'GSPR 6 — Benefit-Risk Assessment',
    evidenceRequired: true,
    steps: [
      {
        id: '6_benefit_risk',
        stepLabel: 'Benefit-Risk Assessment',
        requirementText: 'Known and foreseeable risks, and any undesirable side-effects, shall be minimised and acceptable when weighed against the evaluated benefits.',
        fields: [
          { id: 'benefit_risk', label: 'Benefit-risk analysis', type: 'richtext', helpText: 'Document the benefit-risk analysis. Identify all known risks and demonstrate that benefits outweigh risks.' },
          { id: 'state_of_art', label: 'State of the art consideration', type: 'richtext', helpText: 'How does the device risk profile compare to the current state of the art?' },
          { id: 'cer_ref', label: 'Clinical evaluation report', type: 'doc_reference', required: true, helpText: 'Link to the CER containing the benefit-risk analysis.' },
        ],
      },
    ],
  },

  '7': {
    clauseTitle: 'GSPR 7 — Performance During Intended Lifetime',
    evidenceRequired: true,
    steps: [
      {
        id: '7_lifetime',
        stepLabel: 'Lifetime Performance',
        requirementText: 'Demonstrate that the device maintains performance and safety throughout its intended service life under normal use and maintenance conditions.',
        fields: [
          { id: 'lifetime_defined', label: 'Intended service life', type: 'text', placeholder: 'e.g. 5 years, 10,000 cycles', helpText: 'State the intended service life of the device.' },
          { id: 'lifetime_evidence', label: 'Lifetime performance evidence', type: 'richtext', helpText: 'Describe testing and analysis demonstrating performance throughout the intended lifetime (accelerated ageing, fatigue testing, etc.).' },
          { id: 'lifetime_doc', label: 'Lifetime testing documentation', type: 'doc_reference', helpText: 'Link to shelf-life, accelerated ageing, or durability test reports.' },
        ],
      },
    ],
  },

  '8': {
    clauseTitle: 'GSPR 8 — Transport, Storage and Use Conditions',
    evidenceRequired: true,
    steps: [
      {
        id: '8_conditions',
        stepLabel: 'Environmental Conditions',
        requirementText: 'Demonstrate that the device is safe and performs correctly when subject to the stresses of transport, storage, and conditions of use.',
        fields: [
          { id: 'conditions_testing', label: 'Transport and storage testing', type: 'richtext', helpText: 'Describe testing for transport simulation, temperature/humidity exposure, vibration, drop testing, etc.' },
          { id: 'use_conditions', label: 'Conditions of use addressed', type: 'richtext', helpText: 'Describe the use environment conditions (temperature, humidity, altitude) and how the device performs within those ranges.' },
          { id: 'test_doc', label: 'Environmental testing reports', type: 'doc_reference', helpText: 'Link to transport, storage, or environmental test reports.' },
        ],
      },
    ],
  },

  '9': {
    clauseTitle: 'GSPR 9 — Undesirable Side-Effects',
    evidenceRequired: true,
    steps: [
      {
        id: '9_side_effects',
        stepLabel: 'Side-Effects Assessment',
        requirementText: 'Identify undesirable side-effects and demonstrate they constitute an acceptable risk when weighed against the intended benefits.',
        fields: [
          { id: 'side_effects', label: 'Identified undesirable side-effects', type: 'richtext', helpText: 'List all known or foreseeable undesirable side-effects and their frequency/severity.' },
          { id: 'acceptability', label: 'Acceptability determination', type: 'richtext', helpText: 'Document why each side-effect constitutes an acceptable risk in relation to the clinical benefit.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // Chapter II — Design & Manufacture (GSPRs 10–22)
  // ═══════════════════════════════════════════════════════════
  '10': {
    clauseTitle: 'GSPR 10 — Chemical, Physical and Biological Properties',
    evidenceRequired: true,
    steps: [
      {
        id: '10_materials',
        stepLabel: 'Material Properties & Biocompatibility',
        requirementText: 'Address material selection, biocompatibility, toxicology, substances in contact with the body, and contamination risks.',
        fields: [
          { id: 'material_selection', label: 'Material selection rationale', type: 'richtext', helpText: 'Describe materials used and the rationale for selection considering biocompatibility, toxicology, and compatibility.' },
          { id: 'biocompatibility', label: 'Biocompatibility assessment', type: 'richtext', helpText: 'Summarise ISO 10993 biological evaluation. Reference test results or literature justification.' },
          { id: 'cmr_substances', label: 'CMR / endocrine disruptor assessment', type: 'richtext', helpText: 'Address presence of CMR (carcinogenic, mutagenic, reprotoxic) or endocrine-disrupting substances per MDR Article 10(4).' },
          { id: 'bio_doc', label: 'Biocompatibility documentation', type: 'doc_reference', required: true, helpText: 'Link to biological evaluation plan/report (ISO 10993-1).' },
        ],
      },
    ],
  },

  '11': {
    clauseTitle: 'GSPR 11 — Infection and Microbial Contamination',
    evidenceRequired: true,
    steps: [
      {
        id: '11_infection',
        stepLabel: 'Infection Risk Minimisation',
        requirementText: 'Minimise infection risks, ensure sterility where required, validate sterilisation methods, and provide appropriate packaging.',
        fields: [
          { id: 'infection_minimisation', label: 'Infection risk minimisation measures', type: 'richtext', helpText: 'Describe design and manufacturing measures to minimise infection risk to patients, users, and third parties.' },
          { id: 'sterility', label: 'Sterility requirements', type: 'select', options: ['Supplied sterile', 'Sterilised before use', 'Not required to be sterile', 'Contains microbial risk controls'], helpText: 'Indicate the sterility status of the device.' },
          { id: 'sterilisation_validation', label: 'Sterilisation validation (if applicable)', type: 'richtext', helpText: 'Describe the sterilisation method and validation approach (ISO 11135, ISO 11137, ISO 17665, etc.).' },
          { id: 'packaging_validation', label: 'Packaging validation', type: 'richtext', helpText: 'For sterile devices: describe sterile barrier system validation (ISO 11607).' },
          { id: 'sterilisation_doc', label: 'Sterilisation/packaging documentation', type: 'doc_reference', helpText: 'Link to sterilisation validation or packaging validation reports.' },
        ],
      },
    ],
  },

  '12': {
    clauseTitle: 'GSPR 12 — Devices with Medicinal Substance',
    evidenceRequired: true,
    steps: [
      {
        id: '12_medicinal',
        stepLabel: 'Medicinal Substance Assessment',
        requirementText: 'If the device incorporates a substance considered a medicinal product, provide evidence of safety, quality, and usefulness.',
        fields: [
          { id: 'applicability', label: 'Does the device incorporate a medicinal substance?', type: 'select', options: ['Yes', 'No — not applicable'], helpText: 'If no, document the justification and mark as not applicable.' },
          { id: 'substance_details', label: 'Medicinal substance details', type: 'richtext', helpText: 'Identify the substance, its purpose, and evidence of safety, quality, and usefulness.' },
        ],
      },
    ],
  },

  '13': {
    clauseTitle: 'GSPR 13 — Substances Absorbed/Dispersed in Body',
    evidenceRequired: true,
    steps: [
      {
        id: '13_absorbed',
        stepLabel: 'Absorbed/Dispersed Substances',
        requirementText: 'For devices composed of substances absorbed or dispersed in the body, provide toxicological, pharmacological, and biocompatibility data.',
        fields: [
          { id: 'applicability', label: 'Does the device contain substances absorbed/dispersed in the body?', type: 'select', options: ['Yes', 'No — not applicable'], helpText: 'If no, document the justification.' },
          { id: 'substance_data', label: 'Toxicological and pharmacological data', type: 'richtext', helpText: 'Provide or reference relevant safety data for substances that may be absorbed or dispersed.' },
        ],
      },
    ],
  },

  '14': {
    clauseTitle: 'GSPR 14 — Devices and Connections',
    evidenceRequired: true,
    steps: [
      {
        id: '14_connections',
        stepLabel: 'Connectivity & EMC',
        requirementText: 'Address EMC, environmental risks, unauthorised access, software/IT integration, and remote management for connected devices.',
        fields: [
          { id: 'emc', label: 'EMC compliance', type: 'richtext', helpText: 'Describe EMC testing and compliance (IEC 60601-1-2 or applicable standard).' },
          { id: 'it_security', label: 'IT security and unauthorised access protection', type: 'richtext', helpText: 'Describe cybersecurity measures to protect against unauthorised access to device settings and data.' },
          { id: 'interoperability', label: 'Interoperability and connectivity', type: 'richtext', helpText: 'If the device connects to other devices/systems, describe interoperability testing and data integrity measures.' },
          { id: 'emc_doc', label: 'EMC / connectivity documentation', type: 'doc_reference', helpText: 'Link to EMC test reports or cybersecurity assessment.' },
        ],
      },
    ],
  },

  '15': {
    clauseTitle: 'GSPR 15 — Mechanical and Thermal Risks',
    evidenceRequired: true,
    steps: [
      {
        id: '15_mechanical',
        stepLabel: 'Mechanical & Thermal Protection',
        requirementText: 'Demonstrate protection against mechanical risks (moving parts, surfaces, instability) and thermal risks (burns, heat dissipation).',
        fields: [
          { id: 'mechanical_risks', label: 'Mechanical risk assessment', type: 'richtext', helpText: 'Describe mechanical hazards identified and protective measures (guards, stability, surface finish, ergonomics).' },
          { id: 'thermal_risks', label: 'Thermal risk assessment', type: 'richtext', helpText: 'Describe thermal hazards and protection measures (temperature limits, insulation, warnings).' },
          { id: 'mechanical_doc', label: 'Mechanical/thermal test documentation', type: 'doc_reference', helpText: 'Link to mechanical or thermal safety test reports.' },
        ],
      },
    ],
  },

  '16': {
    clauseTitle: 'GSPR 16 — Electrical, Thermal and Fire Risks',
    evidenceRequired: true,
    steps: [
      {
        id: '16_electrical',
        stepLabel: 'Electrical Safety',
        requirementText: 'Address electrical safety, thermal protection, and fire prevention for active devices.',
        fields: [
          { id: 'applicability', label: 'Is the device an active device?', type: 'select', options: ['Yes — active medical device', 'No — not active'], helpText: 'Active devices require electrical safety assessment.' },
          { id: 'electrical_safety', label: 'Electrical safety measures', type: 'richtext', helpText: 'Describe electrical safety measures (insulation, grounding, leakage current limits, protective earth).' },
          { id: 'fire_prevention', label: 'Fire prevention measures', type: 'richtext', helpText: 'Describe fire risk assessment and prevention measures.' },
          { id: 'electrical_doc', label: 'Electrical safety test reports', type: 'doc_reference', helpText: 'Link to IEC 60601-1 or applicable electrical safety test reports.' },
        ],
      },
    ],
  },

  '17': {
    clauseTitle: 'GSPR 17 — Radiation Risks',
    evidenceRequired: true,
    steps: [
      {
        id: '17_radiation',
        stepLabel: 'Radiation Protection',
        requirementText: 'For radiation-emitting devices, demonstrate appropriate radiation levels and quality. For ionising radiation, justify dose vs clinical purpose.',
        fields: [
          { id: 'applicability', label: 'Does the device emit radiation?', type: 'select', options: ['Yes — ionising radiation', 'Yes — non-ionising radiation', 'Yes — both', 'No — not applicable'], helpText: 'If no, document justification and mark as not applicable.' },
          { id: 'radiation_assessment', label: 'Radiation safety assessment', type: 'richtext', helpText: 'Describe radiation levels, dose justification, and protective measures.' },
          { id: 'radiation_doc', label: 'Radiation safety documentation', type: 'doc_reference', helpText: 'Link to radiation safety test reports or dose assessment.' },
        ],
      },
    ],
  },

  '18': {
    clauseTitle: 'GSPR 18 — Software and Digital Health',
    evidenceRequired: true,
    steps: [
      {
        id: '18_software',
        stepLabel: 'Software Development & IT Security',
        requirementText: 'Develop software per state of the art (lifecycle, risk management, verification/validation). Implement IT security measures.',
        fields: [
          { id: 'applicability', label: 'Does the device contain software?', type: 'select', options: ['Yes — embedded software', 'Yes — standalone SaMD', 'Yes — both', 'No — not applicable'], helpText: 'If no, document justification.' },
          { id: 'software_lifecycle', label: 'Software development lifecycle', type: 'richtext', helpText: 'Describe the software development process (IEC 62304), including safety classification, architecture, unit testing, integration testing, and system testing.' },
          { id: 'it_security', label: 'IT security measures', type: 'richtext', helpText: 'Describe cybersecurity measures including threat modelling, access controls, encryption, and vulnerability management.' },
          { id: 'sw_doc', label: 'Software documentation', type: 'doc_reference', required: true, helpText: 'Link to software development plan, verification/validation reports, or IEC 62304 compliance documentation.' },
        ],
      },
    ],
  },

  '19': {
    clauseTitle: 'GSPR 19 — Active Devices and Connected Systems',
    evidenceRequired: true,
    steps: [
      {
        id: '19_active',
        stepLabel: 'Active Device Safety',
        requirementText: 'For active devices, address alarm systems, warning indicators, and protection against unintended or hazardous output.',
        fields: [
          { id: 'applicability', label: 'Is the device an active device?', type: 'select', options: ['Yes', 'No — not applicable'], helpText: 'If no, mark as not applicable.' },
          { id: 'alarms', label: 'Alarm and warning systems', type: 'richtext', helpText: 'Describe alarm systems, their priority levels, and compliance with IEC 60601-1-8 (if applicable).' },
          { id: 'hazardous_output', label: 'Protection against hazardous output', type: 'richtext', helpText: 'Describe safeguards against unintended energy output or device malfunction.' },
        ],
      },
    ],
  },

  '20': {
    clauseTitle: 'GSPR 20 — Measuring Function',
    evidenceRequired: true,
    steps: [
      {
        id: '20_measuring',
        stepLabel: 'Measurement Accuracy',
        requirementText: 'Demonstrate measuring accuracy and stability. Provide calibration procedures and measurement uncertainty analysis.',
        fields: [
          { id: 'applicability', label: 'Does the device have a measuring function?', type: 'select', options: ['Yes', 'No — not applicable'], helpText: 'If no, mark as not applicable.' },
          { id: 'accuracy', label: 'Measurement accuracy and uncertainty', type: 'richtext', helpText: 'Document the measuring accuracy, precision, and uncertainty analysis.' },
          { id: 'calibration', label: 'Calibration requirements', type: 'richtext', helpText: 'Describe calibration procedures, intervals, and traceability to reference standards.' },
          { id: 'measurement_doc', label: 'Measurement validation documentation', type: 'doc_reference', helpText: 'Link to measurement accuracy validation reports.' },
        ],
      },
    ],
  },

  '21': {
    clauseTitle: 'GSPR 21 — Diagnostic/Monitoring Function',
    evidenceRequired: true,
    steps: [
      {
        id: '21_diagnostic',
        stepLabel: 'Diagnostic/Monitoring Reliability',
        requirementText: 'Demonstrate sufficient accuracy and reliability of diagnostic or monitoring information.',
        fields: [
          { id: 'applicability', label: 'Does the device have a diagnostic/monitoring function?', type: 'select', options: ['Yes', 'No — not applicable'], helpText: 'If no, mark as not applicable.' },
          { id: 'reliability', label: 'Diagnostic/monitoring reliability', type: 'richtext', helpText: 'Describe accuracy, sensitivity, specificity, and reliability of the diagnostic or monitoring output.' },
          { id: 'clinical_validation', label: 'Clinical validation of diagnostic function', type: 'richtext', helpText: 'Reference clinical validation studies demonstrating diagnostic or monitoring performance.' },
        ],
      },
    ],
  },

  '22': {
    clauseTitle: 'GSPR 22 — Biological Origin Materials',
    evidenceRequired: true,
    steps: [
      {
        id: '22_biological',
        stepLabel: 'Biological Materials',
        requirementText: 'For devices using biological materials, address sourcing, processing, preservation, and testing.',
        fields: [
          { id: 'applicability', label: 'Does the device incorporate materials of biological origin?', type: 'select', options: ['Yes — human origin', 'Yes — animal origin', 'Yes — both', 'No — not applicable'], helpText: 'If no, mark as not applicable.' },
          { id: 'sourcing_processing', label: 'Sourcing and processing', type: 'richtext', helpText: 'Describe the sourcing, processing, preservation, and testing of biological materials. Address infection and immunological risks.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // Chapter III — Information Supplied (GSPR 23)
  // ═══════════════════════════════════════════════════════════
  '23': {
    clauseTitle: 'GSPR 23 — Label and Instructions for Use',
    evidenceRequired: true,
    steps: [
      {
        id: '23_labels',
        stepLabel: 'Labels',
        requirementText: 'Provide compliant labels including manufacturer details, UDI, safety information, and symbols per ISO 15223-1.',
        fields: [
          { id: 'label_content', label: 'Label content assessment', type: 'richtext', helpText: 'Confirm all required label elements are present: manufacturer name and address, device name, lot/serial number, UDI, safety warnings, symbols.' },
          { id: 'symbols_used', label: 'Symbols compliance (ISO 15223-1)', type: 'richtext', helpText: 'List symbols used on labels and confirm compliance with ISO 15223-1.' },
        ],
      },
      {
        id: '23_ifu',
        stepLabel: 'Instructions for Use',
        requirementText: 'Provide instructions for use containing intended purpose, residual risks, installation instructions, and maintenance requirements.',
        fields: [
          { id: 'ifu_content', label: 'IFU content assessment', type: 'richtext', helpText: 'Confirm all required IFU elements are present per MDR Annex I §23.4 (intended purpose, contraindications, warnings, residual risks, installation, maintenance, disposal).' },
          { id: 'ifu_languages', label: 'Language requirements', type: 'richtext', helpText: 'Confirm IFU is provided in all official languages of the Member States where the device is marketed.' },
          { id: 'labelling_doc', label: 'Labelling documentation', type: 'doc_reference', required: true, helpText: 'Link to label artwork, IFU documents, or labelling review records.' },
        ],
      },
    ],
  },
};
