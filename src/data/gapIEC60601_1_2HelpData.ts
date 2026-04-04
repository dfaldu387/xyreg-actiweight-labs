/**
 * Contextual help data for IEC 60601-1-2 (EMC) clauses (§4–9).
 */

import type { GapClauseHelp } from './gapAnalysisHelpData';

export const IEC_60601_1_2_HELP: Record<string, GapClauseHelp> = {
  '4.1': {
    section: '4.1',
    title: 'General',
    overview: 'This clause requires demonstrating overall EMC compliance of the ME equipment or ME system with IEC 60601-1-2.',
    expectations: [
      'A clear statement of the applicable edition of IEC 60601-1-2',
      'Evidence of EMC testing by an accredited laboratory',
      'Documentation of any national deviations applied',
    ],
    whyItMatters: 'EMC compliance is a prerequisite for CE marking and ensures the device does not cause or suffer from electromagnetic interference in its intended environment.',
    tips: [
      'Engage EMC test laboratory early in the design process',
      'Pre-compliance testing can save significant time and cost',
      'Clarify the applicable edition before starting testing',
    ],
    commonPitfalls: [
      'Testing against an outdated edition of the standard',
      'Not accounting for all accessories and cables in the test scope',
      'Missing national deviations for target markets',
    ],
    keyDeliverables: ['EMC compliance statement', 'Test laboratory accreditation evidence'],
  },

  '4.2': {
    section: '4.2',
    title: 'Electromagnetic Compatibility Standard Compliance',
    overview: 'Document point-by-point compliance with IEC 60601-1-2 and justify any deviations from the standard requirements.',
    expectations: [
      'A compliance matrix mapping each clause to evidence',
      'Risk-based justifications for any deviations',
      'Clear documentation of the applied standard edition',
    ],
    whyItMatters: 'Notified bodies and regulators expect a structured demonstration of compliance. Deviations without risk-based justification are major non-conformities.',
    tips: [
      'Create a clause-by-clause compliance matrix early',
      'Any deviation must be supported by a risk analysis per ISO 14971',
    ],
    commonPitfalls: [
      'Incomplete compliance matrix',
      'Deviations without documented risk justification',
    ],
    keyDeliverables: ['EMC compliance matrix', 'Deviation justification reports'],
  },

  '4.3': {
    section: '4.3',
    title: 'Risk Management for EMC',
    overview: 'The risk management process per ISO 14971 must specifically address EMC-related hazards. Essential performance that could be affected by electromagnetic disturbances must be identified.',
    expectations: [
      'EMC hazards identified in the risk management file',
      'Essential performance items related to EMC clearly defined',
      'Intended electromagnetic environment documented',
      'Risk controls for EMC hazards implemented and verified',
    ],
    whyItMatters: 'EMC-related failures can directly impact patient safety. Identifying essential performance affected by EMC is critical for defining appropriate test levels and pass/fail criteria.',
    tips: [
      'Start with the intended use environment to determine applicable immunity levels',
      'Essential performance must be defined before EMC testing begins',
      'Consider both normal and single-fault conditions',
    ],
    commonPitfalls: [
      'Essential performance not defined before EMC testing',
      'EMC hazards not integrated into the main risk management file',
      'Intended environment not clearly specified',
    ],
    keyDeliverables: ['EMC risk analysis', 'Essential performance list', 'Intended environment specification'],
  },

  '5.1': {
    section: '5.1',
    title: 'EMC Test Plan',
    overview: 'An EMC test plan must be prepared before testing, describing the EUT, test configuration, operating modes, and pass/fail criteria linked to essential performance.',
    expectations: [
      'Complete EUT description including software version and accessories',
      'Pass/fail criteria linked to essential performance',
      'All operating modes to be tested identified',
      'Test plan approved before testing begins',
    ],
    whyItMatters: 'Without a proper test plan, EMC test results may be invalid or incomplete, requiring costly re-testing.',
    tips: [
      'Include photos and diagrams of the intended test setup',
      'Define pass/fail criteria in terms of observable behaviour, not just "no malfunction"',
      'Justify any operating modes excluded from testing',
    ],
    commonPitfalls: [
      'Vague pass/fail criteria (e.g., "device operates normally")',
      'Missing accessories or cables from the test plan',
      'Test plan not reflecting the production configuration',
    ],
    keyDeliverables: ['EMC test plan'],
  },

  '5.2': {
    section: '5.2',
    title: 'EMC Test Configuration and Setup',
    overview: 'The test configuration, operating modes, and accessories/cables used during EMC testing must be thoroughly documented.',
    expectations: [
      'Detailed test setup description with photographs',
      'All operating modes tested listed and justified',
      'Cable types, lengths, and routing documented',
      'Power supply configuration documented',
    ],
    whyItMatters: 'The test configuration directly affects EMC results. If the test setup does not represent the real-world configuration, results are not meaningful.',
    tips: [
      'Use the worst-case cable configuration for testing',
      'Photograph the test setup from multiple angles',
      'Document any deviations from the planned setup',
    ],
    commonPitfalls: [
      'Test cables shorter than those used in practice',
      'Not testing all operating modes',
      'Setup photos missing or unclear',
    ],
    keyDeliverables: ['Test setup documentation', 'Setup photographs', 'Operating mode justification'],
  },

  '5.3': {
    section: '5.3',
    title: 'Test Report Content',
    overview: 'The EMC test report must contain all information required by IEC 60601-1-2, including EUT identification, test equipment, results, and any deviations.',
    expectations: [
      'Complete EUT identification (model, serial, software version)',
      'Test equipment list with calibration dates',
      'All test results with measurement data',
      'Deviations from the test plan documented',
    ],
    whyItMatters: 'An incomplete test report will be rejected by notified bodies and may require expensive re-testing.',
    tips: [
      'Use a checklist to verify report completeness before submission',
      'Ensure test equipment calibration covers the testing dates',
    ],
    commonPitfalls: [
      'Missing test equipment calibration certificates',
      'Results presented without measurement data',
      'Deviations from the test plan not documented',
    ],
    keyDeliverables: ['Complete EMC test report'],
  },

  '6.1': {
    section: '6.1',
    title: 'General Emission Requirements',
    overview: 'The ME equipment must be classified by Group (1 or 2) and Class (A or B) to determine applicable emission limits.',
    expectations: [
      'Correct Group and Class designation with justification',
      'Applicable emission limits identified',
    ],
    whyItMatters: 'Incorrect classification leads to testing against wrong limits, potentially requiring re-classification and re-testing.',
    tips: [
      'Group 2 applies if the device intentionally generates RF energy for treatment or diagnosis',
      'Class B (more stringent) applies to home healthcare environments',
    ],
    commonPitfalls: [
      'Classifying a home-use device as Class A instead of Class B',
      'Not recognising RF-generating components (e.g., wireless modules)',
    ],
    keyDeliverables: ['Group/Class classification justification'],
  },

  '6.2': {
    section: '6.2',
    title: 'Conducted and Radiated RF Emissions',
    overview: 'Conducted and radiated RF emission measurements must demonstrate compliance with applicable limits based on the device classification and intended environment.',
    expectations: [
      'Conducted emission results within limits',
      'Radiated emission results within limits',
      'Results differentiated by environment type',
    ],
    whyItMatters: 'Excessive emissions can interfere with other medical devices and equipment in the healthcare environment.',
    tips: ['Test in the worst-case operating mode for maximum emissions', 'Consider all cable configurations'],
    commonPitfalls: ['Not testing worst-case operating mode', 'Missing frequency ranges'],
    keyDeliverables: ['Emission test results', 'Emission compliance declaration'],
  },

  '6.3': {
    section: '6.3',
    title: 'Harmonic Distortion',
    overview: 'Harmonic current emissions must comply with IEC 61000-3-2 unless the device qualifies for an exemption.',
    expectations: ['Harmonic test results or documented exemption basis'],
    whyItMatters: 'Harmonic currents can degrade power quality and affect other equipment on the same supply.',
    tips: ['Check if the device qualifies for exemption based on rated input power'],
    commonPitfalls: ['Claiming exemption without documenting the basis'],
    keyDeliverables: ['Harmonic test results or exemption justification'],
  },

  '6.4': {
    section: '6.4',
    title: 'Voltage Fluctuations and Flicker',
    overview: 'Voltage fluctuations and flicker emissions must comply with IEC 61000-3-3 unless the device qualifies for an exemption.',
    expectations: ['Flicker test results or documented exemption basis'],
    whyItMatters: 'Voltage fluctuations can cause visible flicker in lighting, affecting the healthcare environment.',
    tips: ['Consider the device power cycling pattern when assessing flicker'],
    commonPitfalls: ['Not testing dynamic load changes'],
    keyDeliverables: ['Flicker test results or exemption justification'],
  },

  '7.1': {
    section: '7.1',
    title: 'General Immunity Requirements',
    overview: 'The applicable immunity tests and levels must be determined based on the intended electromagnetic environment and essential performance.',
    expectations: [
      'All applicable immunity tests identified',
      'Test levels appropriate for the intended environment',
      'Performance criteria defined for each test',
    ],
    whyItMatters: 'Insufficient immunity can lead to device malfunction in the presence of electromagnetic disturbances, potentially harming patients.',
    tips: ['Home healthcare environments generally require higher immunity levels', 'Define performance criteria A, B, or C for each test based on essential performance'],
    commonPitfalls: ['Using professional-environment levels for a home-use device', 'Performance criteria not linked to essential performance'],
    keyDeliverables: ['Immunity test level matrix', 'Performance criteria assignments'],
  },

  '7.2': { section: '7.2', title: 'Electrostatic Discharge (ESD)', overview: 'ESD immunity per IEC 61000-4-2 must be tested at specified levels to ensure the device can withstand electrostatic discharges encountered in the healthcare environment.', expectations: ['ESD test results at required levels', 'Pass/fail linked to essential performance'], whyItMatters: 'ESD is one of the most common EMC disturbances in healthcare environments.', tips: ['Test all user-accessible surfaces and connectors', 'Document any temporary effects and recovery time'], commonPitfalls: ['Not testing all accessible points', 'Ignoring temporary degradation'], keyDeliverables: ['ESD test results'] },

  '7.3': { section: '7.3', title: 'Radiated RF Electromagnetic Fields', overview: 'Radiated RF immunity per IEC 61000-4-3 must be tested across the specified frequency range to ensure robustness against RF fields from communications equipment and other sources.', expectations: ['Radiated RF test results at required levels and frequency ranges', 'Essential performance maintained during testing'], whyItMatters: 'RF fields from mobile phones, walkie-talkies, and other equipment are ubiquitous in healthcare environments.', tips: ['Ensure the frequency range covers up to 2.7 GHz (or higher if required)', 'Monitor essential performance continuously during testing'], commonPitfalls: ['Incomplete frequency coverage', 'Not monitoring essential performance during sweeps'], keyDeliverables: ['Radiated RF immunity test results'] },

  '7.4': { section: '7.4', title: 'Proximity Fields from RF Wireless Communications', overview: 'Immunity to proximity fields from wireless communications equipment must be tested per Table 9 of IEC 60601-1-2.', expectations: ['Proximity field test results at specified frequencies and modulations', 'Results documented per Table 9 format'], whyItMatters: 'Wireless devices used in close proximity (within 30 cm) can cause higher field strengths than general radiated RF testing covers.', tips: ['Test at all frequencies and modulations specified in Table 9'], commonPitfalls: ['Missing test frequencies from Table 9'], keyDeliverables: ['Proximity field test results'] },

  '7.5': { section: '7.5', title: 'Electrical Fast Transients / Burst', overview: 'EFT/burst immunity per IEC 61000-4-4 must be tested on power and signal ports.', expectations: ['EFT test results on all applicable ports'], whyItMatters: 'Fast transients are common on power lines and can cause device malfunction.', tips: ['Test all ports: power, signal, and data'], commonPitfalls: ['Missing signal/data port testing'], keyDeliverables: ['EFT test results'] },

  '7.6': { section: '7.6', title: 'Surges', overview: 'Surge immunity per IEC 61000-4-5 must be tested on power lines.', expectations: ['Surge test results at required levels'], whyItMatters: 'Power line surges from lightning or switching can damage equipment or cause malfunction.', tips: ['Test both line-to-line and line-to-ground'], commonPitfalls: ['Only testing one surge coupling mode'], keyDeliverables: ['Surge test results'] },

  '7.7': { section: '7.7', title: 'Conducted Disturbances Induced by RF Fields', overview: 'Conducted RF immunity per IEC 61000-4-6 must be tested on all cables and connectors.', expectations: ['Conducted RF test results on all applicable ports'], whyItMatters: 'RF energy can couple onto cables and cause interference even when direct radiated fields are within limits.', tips: ['Test all cables including power, signal, and network connections'], commonPitfalls: ['Not testing all cable types'], keyDeliverables: ['Conducted RF immunity results'] },

  '7.8': { section: '7.8', title: 'Power-Frequency Magnetic Fields', overview: 'Power-frequency magnetic field immunity per IEC 61000-4-8 must be tested.', expectations: ['Magnetic field test results at the specified level'], whyItMatters: 'Power-frequency magnetic fields from transformers and power cables can affect sensitive medical devices.', tips: ['Consider the proximity to power distribution equipment in the intended environment'], commonPitfalls: ['Using an incorrect test level for the intended environment'], keyDeliverables: ['Magnetic field immunity results'] },

  '7.9': { section: '7.9', title: 'Voltage Dips and Voltage Interruptions', overview: 'Voltage dip and interruption immunity per IEC 61000-4-11 must be tested at specified levels and durations.', expectations: ['Dip and interruption test results at all specified levels', 'Device behaviour during and after each dip documented'], whyItMatters: 'Voltage dips are common on power networks and can cause critical device malfunction if not handled properly.', tips: ['Document device behaviour during the dip (not just after recovery)', 'Consider battery backup if essential performance must be maintained'], commonPitfalls: ['Not documenting behaviour during the dip', 'Missing certain dip durations'], keyDeliverables: ['Voltage dip/interruption test results'] },

  '8.1': { section: '8.1', title: 'General Accompanying Documents', overview: 'EMC-related guidance must be included in the device accompanying documents (IFU) to inform users about the intended electromagnetic environment.', expectations: ['EMC guidance in instructions for use', 'Recommended separation distances documented'], whyItMatters: 'Users need to understand the electromagnetic environment requirements to ensure safe operation.', tips: ['Use the declaration table templates from the standard'], commonPitfalls: ['EMC information missing from IFU'], keyDeliverables: ['IFU with EMC guidance'] },

  '8.2': { section: '8.2', title: 'Professional Healthcare Facility Environment', overview: 'EMC declaration tables (Tables 1–4) must be completed and included in accompanying documents for professional use devices.', expectations: ['All four declaration tables completed'], whyItMatters: 'These tables provide essential information for facility EMC management.', tips: ['Use the exact table formats from IEC 60601-1-2 Annex'], commonPitfalls: ['Incomplete tables or incorrect values'], keyDeliverables: ['Completed EMC declaration tables'] },

  '8.3': { section: '8.3', title: 'Home Healthcare Environment', overview: 'Home healthcare devices require EMC declaration tables with test levels appropriate for the domestic environment.', expectations: ['Home healthcare EMC declaration tables completed', 'Class B emission limits applied'], whyItMatters: 'Home environments have different electromagnetic characteristics and less controlled conditions than healthcare facilities.', tips: ['Ensure Class B emission limits are used for home use devices'], commonPitfalls: ['Using professional environment test levels for home use devices'], keyDeliverables: ['Home healthcare EMC declaration tables'] },

  '8.4': { section: '8.4', title: 'Special Environment', overview: 'If the device is intended for a special electromagnetic environment (e.g., MRI suite, ambulance), specific requirements apply.', expectations: ['Special environment documented with justification', 'Modified test levels if applicable'], whyItMatters: 'Special environments may have unique electromagnetic conditions that standard test levels do not cover.', tips: ['Consult the facility requirements for the special environment'], commonPitfalls: ['Not identifying the device as requiring special environment considerations'], keyDeliverables: ['Special environment EMC documentation'] },

  '9.1': { section: '9.1', title: 'General ME System EMC', overview: 'EMC requirements apply to the complete ME system, including non-medical components. The system integrator must ensure overall compliance.', expectations: ['System-level EMC compliance approach documented', 'Non-medical components identified'], whyItMatters: 'Adding non-medical components to an ME system can change its EMC characteristics.', tips: ['Document the system boundary clearly', 'Assess the EMC impact of each non-medical component'], commonPitfalls: ['Assuming component-level compliance ensures system compliance'], keyDeliverables: ['ME system EMC assessment'] },

  '9.2': { section: '9.2', title: 'ME System Emission Requirements', overview: 'Emission compliance must be demonstrated at the system level, or justified why component-level results are sufficient.', expectations: ['System-level emission results or justification for component-level approach'], whyItMatters: 'System-level emissions can differ significantly from individual component emissions.', tips: ['Test the most representative system configuration'], commonPitfalls: ['Not considering cable interconnections between components'], keyDeliverables: ['System emission test results or justification'] },

  '9.3': { section: '9.3', title: 'ME System Immunity Requirements', overview: 'Immunity compliance must be demonstrated at the system level, considering interactions between components.', expectations: ['System-level immunity results or justification'], whyItMatters: 'System interconnections can create immunity vulnerabilities not present at component level.', tips: ['Focus on interfaces between components'], commonPitfalls: ['Ignoring data interface susceptibility'], keyDeliverables: ['System immunity test results or justification'] },

  '9.4': { section: '9.4', title: 'Cables and Connections in ME Systems', overview: 'Cable types, lengths, and routing in the ME system must be documented as they significantly affect EMC performance.', expectations: ['Cable specifications documented', 'Maximum cable lengths specified', 'Shielding requirements stated'], whyItMatters: 'Cables act as antennas and can significantly affect both emissions and immunity.', tips: ['Specify maximum cable lengths in the system documentation', 'Require shielded cables where necessary'], commonPitfalls: ['Not specifying cable requirements in system documentation', 'Using unshielded cables without assessment'], keyDeliverables: ['Cable specification document'] },
};
