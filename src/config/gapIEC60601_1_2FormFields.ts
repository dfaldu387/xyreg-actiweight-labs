/**
 * IEC 60601-1-2 (EMC) — Clause-Specific Form Field Definitions
 * Step-by-step guided structure for electromagnetic compatibility (§4–9).
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const IEC_60601_1_2_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  // ═══════════════════════════════════════════════════════════
  // §4 General Requirements
  // ═══════════════════════════════════════════════════════════
  '4.1': {
    clauseTitle: '4.1 — General',
    evidenceRequired: true,
    steps: [
      {
        id: '4.1_compliance',
        stepLabel: 'EMC Compliance Statement',
        requirementText: 'Demonstrate that the ME equipment or ME system complies with the general EMC requirements of this collateral standard.',
        fields: [
          { id: 'compliance_statement', label: 'EMC compliance statement', type: 'richtext', helpText: 'Summarise overall EMC compliance status including standard edition applied and any national deviations.' },
          { id: 'emc_standard_edition', label: 'Applicable EMC standard edition', type: 'select', options: ['IEC 60601-1-2:2014 (Ed 4.0)', 'IEC 60601-1-2:2014+AMD1:2020', 'Other (specify in notes)'], helpText: 'Select the edition of IEC 60601-1-2 applied.' },
          { id: 'emc_test_lab', label: 'Test laboratory reference', type: 'doc_reference', helpText: 'Reference to the accredited test laboratory performing EMC testing.' },
        ],
      },
    ],
  },

  '4.2': {
    clauseTitle: '4.2 — Electromagnetic Compatibility Standard Compliance',
    evidenceRequired: true,
    steps: [
      {
        id: '4.2_standard',
        stepLabel: 'Standard Compliance Documentation',
        requirementText: 'Document compliance with the applicable EMC standard edition and any deviations or justifications.',
        fields: [
          { id: 'compliance_documentation', label: 'EMC standard compliance documentation', type: 'richtext', helpText: 'Detail how compliance with each clause of IEC 60601-1-2 is demonstrated.' },
          { id: 'deviations', label: 'Deviations and justifications', type: 'richtext', helpText: 'List any deviations from the standard and provide risk-based justifications.' },
          { id: 'compliance_doc_ref', label: 'Compliance documentation reference', type: 'doc_reference', helpText: 'Link to the EMC compliance matrix or declaration of conformity.' },
        ],
      },
    ],
  },

  '4.3': {
    clauseTitle: '4.3 — Risk Management for EMC',
    evidenceRequired: true,
    steps: [
      {
        id: '4.3_process',
        stepLabel: 'EMC Risk Management Process',
        requirementText: 'Apply the risk management process specifically to EMC-related hazards.',
        fields: [
          { id: 'emc_risk_process', label: 'EMC risk management process description', type: 'richtext', helpText: 'Describe how EMC hazards are identified and analysed within the overall risk management process per ISO 14971.' },
          { id: 'risk_file_ref', label: 'Risk management file reference', type: 'doc_reference', helpText: 'Link to EMC-related sections of the risk management file.' },
        ],
      },
      {
        id: '4.3_environment',
        stepLabel: 'Intended Electromagnetic Environment',
        requirementText: 'Define the intended electromagnetic environment and essential performance affected by electromagnetic disturbances.',
        fields: [
          { id: 'em_environment', label: 'Intended electromagnetic environment', type: 'select', options: ['Professional healthcare facility', 'Home healthcare environment', 'Special environment', 'Multiple environments'], helpText: 'Select the intended electromagnetic environment for the device.' },
          { id: 'essential_performance_emc', label: 'Essential performance related to EMC', type: 'richtext', helpText: 'List essential performance items that could be affected by electromagnetic disturbances and the rationale for each.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §5 EMC Test Plan & Documentation
  // ═══════════════════════════════════════════════════════════
  '5.1': {
    clauseTitle: '5.1 — EMC Test Plan',
    evidenceRequired: true,
    steps: [
      {
        id: '5.1_plan',
        stepLabel: 'Test Plan',
        requirementText: 'Prepare an EMC test plan describing the equipment under test, test configuration, operating modes, and pass/fail criteria.',
        fields: [
          { id: 'test_plan_scope', label: 'Test plan scope and EUT description', type: 'richtext', helpText: 'Describe the equipment under test (EUT), including model numbers, software versions, and accessories included.' },
          { id: 'pass_fail_criteria', label: 'Pass/fail criteria', type: 'richtext', helpText: 'Define pass/fail criteria for each test, related to essential performance and basic safety.' },
          { id: 'test_plan_ref', label: 'EMC test plan document', type: 'doc_reference', required: true, helpText: 'Link to the formal EMC test plan.' },
        ],
      },
    ],
  },

  '5.2': {
    clauseTitle: '5.2 — EMC Test Configuration and Setup',
    evidenceRequired: true,
    steps: [
      {
        id: '5.2_config',
        stepLabel: 'Test Configuration',
        requirementText: 'Document the test configuration, operating modes during testing, and accessories/cables/power supply arrangements used.',
        fields: [
          { id: 'test_configuration', label: 'Test configuration description', type: 'richtext', helpText: 'Describe the physical test setup including grounding, cable routing, and positioning relative to ground plane.' },
          { id: 'operating_modes', label: 'Operating modes during testing', type: 'richtext', helpText: 'List all operating modes tested and justify if any modes were excluded.' },
          { id: 'accessories_cables', label: 'Accessories, cables, and power supply', type: 'richtext', helpText: 'List all accessories, cable types/lengths, and power supply configurations used during testing.' },
          { id: 'setup_photos_ref', label: 'Test setup photographs', type: 'doc_reference', helpText: 'Link to test setup photographs showing the EUT configuration.' },
        ],
      },
    ],
  },

  '5.3': {
    clauseTitle: '5.3 — Test Report Content',
    evidenceRequired: true,
    steps: [
      {
        id: '5.3_report',
        stepLabel: 'Test Report',
        requirementText: 'Ensure the EMC test report contains all required information.',
        fields: [
          { id: 'report_completeness', label: 'Test report completeness checklist', type: 'richtext', helpText: 'Confirm the report includes: EUT identification, test equipment list, test setup photos, all results, and any deviations from the test plan.' },
          { id: 'test_report_ref', label: 'EMC test report', type: 'doc_reference', required: true, helpText: 'Link to the complete EMC test report from the accredited laboratory.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §6 Electromagnetic Disturbances (Emissions)
  // ═══════════════════════════════════════════════════════════
  '6.1': {
    clauseTitle: '6.1 — General Emission Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: '6.1_classification',
        stepLabel: 'Emission Classification',
        requirementText: 'Document the applicable emission requirements and classifications for the ME equipment.',
        fields: [
          { id: 'group_class', label: 'Group and Class designation', type: 'select', options: ['Group 1, Class A', 'Group 1, Class B', 'Group 2, Class A', 'Group 2, Class B'], helpText: 'Group 1: equipment not intentionally generating RF. Group 2: intentionally generates RF. Class A: professional. Class B: domestic.' },
          { id: 'classification_justification', label: 'Classification justification', type: 'richtext', helpText: 'Justify the Group and Class designation based on the device\'s RF generation and intended use environment.' },
        ],
      },
    ],
  },

  '6.2': {
    clauseTitle: '6.2 — Conducted and Radiated RF Emissions',
    evidenceRequired: true,
    steps: [
      {
        id: '6.2_results',
        stepLabel: 'RF Emission Test Results',
        requirementText: 'Provide test results for conducted and radiated RF emissions.',
        fields: [
          { id: 'conducted_emissions', label: 'Conducted emission results', type: 'richtext', helpText: 'Summarise conducted emission measurement results with frequency ranges and limit compliance.' },
          { id: 'radiated_emissions', label: 'Radiated emission results', type: 'richtext', helpText: 'Summarise radiated emission measurement results with frequency ranges and limit compliance.' },
          { id: 'emission_results_ref', label: 'Emission test results reference', type: 'doc_reference', helpText: 'Link to detailed emission test data.' },
        ],
      },
    ],
  },

  '6.3': {
    clauseTitle: '6.3 — Harmonic Distortion',
    evidenceRequired: true,
    steps: [
      {
        id: '6.3_harmonics',
        stepLabel: 'Harmonic Current Results',
        requirementText: 'Provide test results for harmonic current emissions per IEC 61000-3-2 or justification for exemption.',
        fields: [
          { id: 'harmonic_results', label: 'Harmonic emission results or exemption', type: 'richtext', helpText: 'Provide harmonic current test results or state the basis for exemption (e.g., rated input power ≤ 75 W).' },
          { id: 'harmonic_ref', label: 'Harmonic test report reference', type: 'doc_reference', helpText: 'Link to harmonic distortion test results.' },
        ],
      },
    ],
  },

  '6.4': {
    clauseTitle: '6.4 — Voltage Fluctuations and Flicker',
    evidenceRequired: true,
    steps: [
      {
        id: '6.4_flicker',
        stepLabel: 'Flicker Results',
        requirementText: 'Provide test results for voltage fluctuations and flicker per IEC 61000-3-3 or justification for exemption.',
        fields: [
          { id: 'flicker_results', label: 'Voltage fluctuation and flicker results or exemption', type: 'richtext', helpText: 'Provide flicker test results or state the basis for exemption.' },
          { id: 'flicker_ref', label: 'Flicker test report reference', type: 'doc_reference', helpText: 'Link to voltage fluctuation/flicker test results.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §7 Electromagnetic Immunity
  // ═══════════════════════════════════════════════════════════
  '7.1': {
    clauseTitle: '7.1 — General Immunity Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: '7.1_requirements',
        stepLabel: 'Immunity Requirements',
        requirementText: 'Document the applicable immunity requirements based on the intended electromagnetic environment and essential performance.',
        fields: [
          { id: 'immunity_requirements', label: 'Applicable immunity test levels', type: 'richtext', helpText: 'List all applicable immunity tests and their required levels based on the intended use environment.' },
          { id: 'performance_criteria', label: 'Performance criteria per test', type: 'richtext', helpText: 'Define the performance criteria (A, B, or C) for each immunity test based on essential performance requirements.' },
        ],
      },
    ],
  },

  '7.2': {
    clauseTitle: '7.2 — Electrostatic Discharge (ESD)',
    evidenceRequired: true,
    steps: [
      {
        id: '7.2_esd',
        stepLabel: 'ESD Immunity Results',
        requirementText: 'Provide ESD immunity test results per IEC 61000-4-2 at the specified test levels.',
        fields: [
          { id: 'esd_levels', label: 'ESD test levels applied', type: 'richtext', helpText: 'State contact and air discharge levels tested (e.g., ±8 kV contact, ±15 kV air).' },
          { id: 'esd_results', label: 'ESD test results and observations', type: 'richtext', helpText: 'Summarise pass/fail results and any observed effects on essential performance during ESD testing.' },
          { id: 'esd_ref', label: 'ESD test report', type: 'doc_reference', helpText: 'Link to detailed ESD test results.' },
        ],
      },
    ],
  },

  '7.3': {
    clauseTitle: '7.3 — Radiated RF Electromagnetic Fields',
    evidenceRequired: true,
    steps: [
      {
        id: '7.3_rf',
        stepLabel: 'Radiated RF Immunity Results',
        requirementText: 'Provide radiated RF immunity test results per IEC 61000-4-3 at the specified test levels and frequency ranges.',
        fields: [
          { id: 'rf_levels', label: 'Radiated RF test levels and frequencies', type: 'richtext', helpText: 'State test levels (e.g., 3 V/m or 10 V/m) and frequency ranges (80 MHz – 2.7 GHz).' },
          { id: 'rf_results', label: 'Radiated RF test results', type: 'richtext', helpText: 'Summarise pass/fail results and any degradation in essential performance observed.' },
          { id: 'rf_ref', label: 'Radiated RF test report', type: 'doc_reference', helpText: 'Link to detailed radiated RF immunity results.' },
        ],
      },
    ],
  },

  '7.4': {
    clauseTitle: '7.4 — Proximity Fields from RF Wireless Communications',
    evidenceRequired: true,
    steps: [
      {
        id: '7.4_proximity',
        stepLabel: 'Proximity Field Results',
        requirementText: 'Provide immunity test results for proximity fields from wireless communications equipment.',
        fields: [
          { id: 'proximity_results', label: 'Proximity field test results', type: 'richtext', helpText: 'Summarise results for proximity field immunity testing per Table 9 of IEC 60601-1-2.' },
          { id: 'proximity_ref', label: 'Proximity field test report', type: 'doc_reference', helpText: 'Link to detailed proximity field immunity results.' },
        ],
      },
    ],
  },

  '7.5': {
    clauseTitle: '7.5 — Electrical Fast Transients / Burst',
    evidenceRequired: true,
    steps: [
      {
        id: '7.5_eft',
        stepLabel: 'EFT/Burst Results',
        requirementText: 'Provide EFT/burst immunity test results per IEC 61000-4-4 at the specified test levels.',
        fields: [
          { id: 'eft_results', label: 'EFT/burst test results', type: 'richtext', helpText: 'Summarise test levels applied (e.g., ±2 kV power, ±1 kV signal) and pass/fail results.' },
          { id: 'eft_ref', label: 'EFT test report', type: 'doc_reference', helpText: 'Link to detailed EFT/burst test results.' },
        ],
      },
    ],
  },

  '7.6': {
    clauseTitle: '7.6 — Surges',
    evidenceRequired: true,
    steps: [
      {
        id: '7.6_surge',
        stepLabel: 'Surge Results',
        requirementText: 'Provide surge immunity test results per IEC 61000-4-5 at the specified test levels.',
        fields: [
          { id: 'surge_results', label: 'Surge test results', type: 'richtext', helpText: 'Summarise surge test levels (line-to-line and line-to-ground) and pass/fail results.' },
          { id: 'surge_ref', label: 'Surge test report', type: 'doc_reference', helpText: 'Link to detailed surge immunity results.' },
        ],
      },
    ],
  },

  '7.7': {
    clauseTitle: '7.7 — Conducted Disturbances Induced by RF Fields',
    evidenceRequired: true,
    steps: [
      {
        id: '7.7_conducted_rf',
        stepLabel: 'Conducted RF Immunity Results',
        requirementText: 'Provide conducted RF immunity test results per IEC 61000-4-6 at the specified test levels.',
        fields: [
          { id: 'conducted_rf_results', label: 'Conducted RF immunity results', type: 'richtext', helpText: 'Summarise test levels (e.g., 3 V or 6 V rms) and frequency ranges tested, with pass/fail results.' },
          { id: 'conducted_rf_ref', label: 'Conducted RF test report', type: 'doc_reference', helpText: 'Link to detailed conducted RF immunity results.' },
        ],
      },
    ],
  },

  '7.8': {
    clauseTitle: '7.8 — Power-Frequency Magnetic Fields',
    evidenceRequired: true,
    steps: [
      {
        id: '7.8_magnetic',
        stepLabel: 'Magnetic Field Results',
        requirementText: 'Provide power-frequency magnetic field immunity test results per IEC 61000-4-8 at the specified test levels.',
        fields: [
          { id: 'magnetic_results', label: 'Power-frequency magnetic field results', type: 'richtext', helpText: 'State test levels (e.g., 30 A/m) and pass/fail results related to essential performance.' },
          { id: 'magnetic_ref', label: 'Magnetic field test report', type: 'doc_reference', helpText: 'Link to detailed magnetic field immunity results.' },
        ],
      },
    ],
  },

  '7.9': {
    clauseTitle: '7.9 — Voltage Dips and Voltage Interruptions',
    evidenceRequired: true,
    steps: [
      {
        id: '7.9_dips',
        stepLabel: 'Voltage Dip Results',
        requirementText: 'Provide voltage dip and interruption immunity test results per IEC 61000-4-11.',
        fields: [
          { id: 'dip_results', label: 'Voltage dip and interruption results', type: 'richtext', helpText: 'Summarise results for each dip level and duration tested, including any loss of essential performance.' },
          { id: 'dip_ref', label: 'Voltage dip test report', type: 'doc_reference', helpText: 'Link to detailed voltage dip/interruption test results.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §8 Accompanying Documents
  // ═══════════════════════════════════════════════════════════
  '8.1': {
    clauseTitle: '8.1 — General Accompanying Documents',
    evidenceRequired: true,
    steps: [
      {
        id: '8.1_docs',
        stepLabel: 'EMC Information in Accompanying Documents',
        requirementText: 'Document the EMC-related information required in accompanying documents.',
        fields: [
          { id: 'emc_guidance', label: 'EMC guidance for users', type: 'richtext', helpText: 'Describe the electromagnetic environment guidance provided to users in instructions for use.' },
          { id: 'ifu_ref', label: 'Instructions for use reference', type: 'doc_reference', helpText: 'Link to the IFU sections containing EMC guidance.' },
        ],
      },
    ],
  },

  '8.2': {
    clauseTitle: '8.2 — Professional Healthcare Facility Environment',
    evidenceRequired: true,
    steps: [
      {
        id: '8.2_professional',
        stepLabel: 'Professional Environment EMC Declarations',
        requirementText: 'Provide the required EMC declaration tables for professional healthcare facility environments.',
        fields: [
          { id: 'professional_tables', label: 'EMC declaration tables (Tables 1–4)', type: 'richtext', helpText: 'Confirm that Tables 1–4 from IEC 60601-1-2 are completed and included in accompanying documents.' },
          { id: 'tables_ref', label: 'Declaration tables reference', type: 'doc_reference', helpText: 'Link to the completed EMC declaration tables.' },
        ],
      },
    ],
  },

  '8.3': {
    clauseTitle: '8.3 — Home Healthcare Environment',
    evidenceRequired: true,
    steps: [
      {
        id: '8.3_home',
        stepLabel: 'Home Environment EMC Declarations',
        requirementText: 'Provide the required EMC declaration tables for home healthcare environments.',
        fields: [
          { id: 'home_tables', label: 'EMC declaration tables for home use', type: 'richtext', helpText: 'Confirm that the home healthcare EMC declaration tables are completed with appropriate test levels.' },
          { id: 'home_tables_ref', label: 'Home EMC tables reference', type: 'doc_reference', helpText: 'Link to the home healthcare EMC declaration tables.' },
        ],
      },
    ],
  },

  '8.4': {
    clauseTitle: '8.4 — Special Environment',
    evidenceRequired: true,
    steps: [
      {
        id: '8.4_special',
        stepLabel: 'Special Environment Documentation',
        requirementText: 'If the ME equipment is intended for a special electromagnetic environment, document the specific requirements.',
        fields: [
          { id: 'special_env_description', label: 'Special environment description and requirements', type: 'richtext', helpText: 'Describe the special electromagnetic environment and any additional or modified test levels applied.' },
          { id: 'special_ref', label: 'Special environment documentation', type: 'doc_reference', helpText: 'Link to special environment EMC documentation.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §9 ME Systems
  // ═══════════════════════════════════════════════════════════
  '9.1': {
    clauseTitle: '9.1 — General ME System EMC',
    evidenceRequired: true,
    steps: [
      {
        id: '9.1_system',
        stepLabel: 'ME System EMC Approach',
        requirementText: 'Document how EMC requirements apply to the complete ME system.',
        fields: [
          { id: 'system_approach', label: 'ME system EMC compliance approach', type: 'richtext', helpText: 'Describe whether system-level or component-level EMC testing is used and the justification.' },
          { id: 'system_components', label: 'Non-medical components in the system', type: 'richtext', helpText: 'List non-medical electrical equipment in the ME system and their EMC compliance status.' },
        ],
      },
    ],
  },

  '9.2': {
    clauseTitle: '9.2 — ME System Emission Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: '9.2_emissions',
        stepLabel: 'System Emission Results',
        requirementText: 'Provide emission test results for the ME system as a whole, or justification for component-level testing.',
        fields: [
          { id: 'system_emission_results', label: 'System emission results or justification', type: 'richtext', helpText: 'Provide system-level emission results or justify why component-level results are sufficient.' },
          { id: 'system_emission_ref', label: 'System emission test reference', type: 'doc_reference', helpText: 'Link to system emission test results.' },
        ],
      },
    ],
  },

  '9.3': {
    clauseTitle: '9.3 — ME System Immunity Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: '9.3_immunity',
        stepLabel: 'System Immunity Results',
        requirementText: 'Provide immunity test results for the ME system as a whole, or justification for component-level testing.',
        fields: [
          { id: 'system_immunity_results', label: 'System immunity results or justification', type: 'richtext', helpText: 'Provide system-level immunity results or justify why component-level results are sufficient.' },
          { id: 'system_immunity_ref', label: 'System immunity test reference', type: 'doc_reference', helpText: 'Link to system immunity test results.' },
        ],
      },
    ],
  },

  '9.4': {
    clauseTitle: '9.4 — Cables and Connections in ME Systems',
    evidenceRequired: true,
    steps: [
      {
        id: '9.4_cables',
        stepLabel: 'Cable Documentation',
        requirementText: 'Document cable types, lengths, and routing used in the ME system and their impact on EMC performance.',
        fields: [
          { id: 'cable_documentation', label: 'Cable and connection documentation', type: 'richtext', helpText: 'List cable types, maximum lengths, shielding requirements, and routing guidance for the ME system.' },
          { id: 'cable_ref', label: 'Cable specification reference', type: 'doc_reference', helpText: 'Link to cable specification or system installation guide.' },
        ],
      },
    ],
  },
};
