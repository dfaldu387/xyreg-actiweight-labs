/**
 * Detailed contextual help data for IEC 60601-1 clauses.
 * Used by the Help & Guide sidebar when the user is on a gap analysis step.
 */

import type { GapClauseHelp } from './gapAnalysisHelpData';

export const IEC_60601_HELP: Record<string, GapClauseHelp> = {
  '1.1': {
    section: '1.1',
    title: 'Scope',
    overview: 'This clause establishes whether IEC 60601-1 applies to your device. The standard applies to Medical Electrical (ME) Equipment that has an Applied Part, transfers energy to or from the patient, and is intended for diagnosis, treatment, monitoring, or rehabilitation.',
    expectations: [
      'Clear identification of all Applied Parts of the device',
      'Documented energy transfer type and direction (to/from patient)',
      'Confirmation that the device qualifies as ME Equipment',
      'Identification of any scope exclusions with rationale',
    ],
    whyItMatters: 'Getting scope right is foundational — if the device does not qualify as ME Equipment, IEC 60601-1 does not apply. Conversely, if it does qualify, all subsequent clauses must be addressed. Notified Bodies will scrutinise this determination.',
    tips: [
      'List every part that physically contacts the patient during normal use — these are your Applied Parts',
      'Be specific about the type of energy transferred (mechanical, electrical, thermal, etc.)',
      'Document your ME Equipment determination in the Device Description document',
      'If any components are excluded from scope, document the rationale clearly',
    ],
    commonPitfalls: [
      'Failing to identify all Applied Parts (e.g., overlooking cables, sensors, or pads)',
      'Not distinguishing between Applied Parts and Accessible Parts',
      'Claiming IVD exclusion without verifying the product is truly IVD',
    ],
    keyDeliverables: ['Applied Parts list', 'ME Equipment determination', 'Energy transfer documentation', 'Scope exclusion rationale'],
    relatedClauses: ['IEC 60601-1 §6.2 (Applied Part Classification)', 'IEC 60601-1 §4.6 (Parts That Contact Patient)'],
  },

  '1.2': {
    section: '1.2',
    title: 'Object',
    overview: 'The object of IEC 60601-1 is to establish requirements for Basic Safety and Essential Performance. Basic Safety means freedom from unacceptable risk directly caused by physical hazards. Essential Performance is the performance of clinical functions whose loss or degradation would result in unacceptable risk.',
    expectations: [
      'All physical hazards (structural, electrical, thermal, etc.) identified and linked to the Risk Management File',
      'Essential Performance features clearly defined and justified',
      'Mapping between Essential Performance features and hazards in the risk file',
      'Risk analysis for loss or degradation of each Essential Performance feature',
    ],
    whyItMatters: 'Basic Safety and Essential Performance are the two pillars of IEC 60601-1. Every test and requirement in the standard traces back to protecting these two aspects. If you cannot define them clearly, you cannot demonstrate compliance.',
    tips: [
      'Essential Performance is NOT just "the device works" — it is specifically the clinical function(s) whose loss would create unacceptable risk',
      'Start from your risk analysis to identify Essential Performance: which functions, if lost, would harm the patient?',
      'Use the Essential Performance table to map each feature to its associated hazard ID',
      'Review IEC 60601-1 Annex A for guidance on determining Essential Performance',
    ],
    commonPitfalls: [
      'Confusing "all device functions" with Essential Performance — only safety-critical clinical functions qualify',
      'Not linking Essential Performance to specific hazards in the risk file',
      'Failing to evaluate both Normal Condition and Single Fault Condition for each EP feature',
    ],
    keyDeliverables: ['Essential Performance list', 'EP-to-Hazard mapping table', 'Basic Safety hazard identification', 'Risk Management File references'],
    relatedClauses: ['IEC 60601-1 §4.3 (Essential Performance)', 'ISO 14971 (Risk Management)'],
  },

  '1.3': {
    section: '1.3',
    title: 'Collateral Standards',
    overview: 'Collateral standards (IEC 60601-1-X series) supplement the general standard with additional requirements for specific aspects such as EMC, usability, alarm systems, and home healthcare environments. You must identify which collateral standards apply to your device.',
    expectations: [
      'Systematic evaluation of each collateral standard for applicability',
      'Documented justification for each "applicable" or "not applicable" determination',
      'Evidence of compliance with each applicable collateral standard',
    ],
    whyItMatters: 'Collateral standards are not optional — if they apply, they carry the same regulatory weight as the general standard. Missing an applicable collateral standard (e.g., EMC for virtually all devices) is a common audit finding.',
    tips: [
      'IEC 60601-1-2 (EMC) applies to virtually ALL ME Equipment — always start with "Yes"',
      'IEC 60601-1-6 (Usability) applies to any device with a user interface',
      'IEC 60601-1-11 (Home healthcare) only applies if the device is used outside professional healthcare facilities',
      'Use the AI assessment feature to help determine applicability based on your device characteristics',
    ],
    commonPitfalls: [
      'Marking IEC 60601-1-2 (EMC) as "N/A" — it almost always applies',
      'Not providing justification for "not applicable" determinations',
      'Forgetting IEC 60601-1-6 (Usability) for devices with touchscreens or complex interfaces',
    ],
    keyDeliverables: ['Collateral standards applicability matrix', 'Justification documents', 'Compliance evidence for each applicable standard'],
    relatedClauses: ['IEC 60601-1 §1.4 (Particular Standards)', 'IEC 60601-1-2 (EMC)', 'IEC 60601-1-6 (Usability)'],
  },

  '1.4': {
    section: '1.4',
    title: 'Particular Standards',
    overview: 'Particular standards (IEC 60601-2-X series) specify requirements for specific types of ME Equipment (e.g., surgical lasers, infusion pumps, patient monitors). Where a particular standard exists for your device type, it takes precedence over the general standard.',
    expectations: [
      'A determination of whether a particular standard exists for the device type',
      'If yes, identification of the specific standard and evidence of compliance',
      'If no, documented rationale and identification of alternative standards',
    ],
    whyItMatters: 'Particular standards contain device-specific safety requirements that go beyond the general standard. Using only IEC 60601-1 when a particular standard exists is a significant compliance gap.',
    tips: [
      'Search the IEC 60601-2-X series for your device type — there are over 80 particular standards',
      'If no particular standard exists, identify alternative standards (e.g., ISO standards for your equipment category)',
      'When a particular standard exists, it may modify, replace, or add to requirements in the general standard',
    ],
    commonPitfalls: [
      'Not checking whether a particular standard exists',
      'Applying an outdated edition of the particular standard',
      'Not addressing modifications to the general standard specified in the particular standard',
    ],
    keyDeliverables: ['Particular standard determination', 'Applicable standard identification', 'Alternative standards list'],
    relatedClauses: ['IEC 60601-1 §1.3 (Collateral Standards)'],
  },

  '2.1': {
    section: '2.1',
    title: 'Normative References',
    overview: 'List all normative references that are indispensable for the application of IEC 60601-1 to your device. This ensures all referenced standards are identified and the correct editions are used.',
    expectations: [
      'A complete list of applicable normative references',
      'Correct editions of each referenced standard identified',
    ],
    whyItMatters: 'Normative references carry the same weight as the main standard. Using an incorrect edition or missing a reference can lead to compliance gaps.',
    tips: [
      'Start with the normative references listed in IEC 60601-1 Clause 2',
      'Add any additional normative references from applicable collateral and particular standards',
      'Verify that you have the correct (current) edition of each standard',
    ],
    keyDeliverables: ['Normative references list'],
    relatedClauses: ['IEC 60601-1 §1.3', 'IEC 60601-1 §1.4'],
  },

  '3.1': {
    section: '3.1',
    title: 'Terms and Definitions',
    overview: 'Confirm that the key definitions from IEC 60601-1 Clause 3 are correctly applied throughout your technical documentation. This ensures consistent interpretation of terms like ME Equipment, Applied Part, Basic Safety, and Essential Performance.',
    expectations: [
      'Key terms are used consistently throughout the documentation',
      'Any deviations from standard definitions are documented and justified',
    ],
    whyItMatters: 'Inconsistent use of terms can lead to misunderstandings and compliance gaps. Auditors will verify that you are using terms as defined in the standard.',
    tips: [
      'Create a glossary in your technical documentation referencing IEC 60601-1 definitions',
      'Pay special attention to: ME Equipment, Applied Part, Basic Safety, Essential Performance, Normal Condition, Single Fault Condition',
    ],
    keyDeliverables: ['Glossary/definitions confirmation'],
    relatedClauses: ['IEC 60601-1 §1.2 (Object)'],
  },

  '4.1': {
    section: '4.1',
    title: 'Conditions for Application',
    overview: 'ME Equipment must comply with IEC 60601-1 when operated under conditions specified by the manufacturer, including normal use, reasonably foreseeable misuse, and specified environmental conditions.',
    expectations: [
      'Clearly defined intended use in the documentation',
      'Reasonably foreseeable misuse scenarios identified',
      'Environmental conditions for transport, storage, and operation specified',
    ],
    whyItMatters: 'The conditions for application define the boundaries of your safety claims. If your device is tested only under ideal conditions but used differently in practice, safety gaps can emerge.',
    tips: [
      'Define intended use as specifically as possible — it drives the scope of testing',
      'Consider user training levels when identifying foreseeable misuse',
      'Environmental conditions must cover transport, storage, AND operation',
    ],
    keyDeliverables: ['Intended use definition', 'Foreseeable misuse analysis', 'Environmental conditions specification'],
    relatedClauses: ['IEC 60601-1 §4.10 (Environmental Conditions)', 'ISO 14971 (Risk Management)'],
  },

  '4.2': {
    section: '4.2',
    title: 'Risk Management Process for ME Equipment',
    overview: 'The manufacturer must apply ISO 14971 risk management to the ME Equipment. This covers general risk management requirements (4.2.1), particular standard requirements (4.2.2), and hazards identified in the IEC 60601 series (4.2.3).',
    expectations: [
      'A Risk Management Plan and Risk Management File compliant with ISO 14971',
      'Risk acceptability criteria defined',
      'Both normal and single fault conditions addressed',
      'All hazards from the IEC 60601 series identified and evaluated',
      'Particular standard risk requirements incorporated',
    ],
    whyItMatters: 'Risk management is the backbone of IEC 60601-1. Nearly every clause references the Risk Management File. Without a robust risk management process, compliance with the standard is impossible.',
    tips: [
      'Start the Risk Management Plan early and maintain it throughout development',
      'Define clear risk acceptability criteria aligned with ISO 14971',
      'Address both normal condition and single fault condition for every identified hazard',
      'Cross-reference hazards from the IEC 60601 series (Table D.2 in Annex D is helpful)',
    ],
    commonPitfalls: [
      'Risk Management Plan does not define acceptability criteria',
      'Single fault conditions are not systematically evaluated',
      'Hazards from applicable particular standards are not included',
    ],
    keyDeliverables: ['Risk Management Plan', 'Risk Management File', 'Hazard analysis', 'Risk/benefit analysis'],
    relatedClauses: ['ISO 14971:2019', 'IEC 60601-1 §4.3 (Essential Performance)', 'IEC 60601-1 §4.7 (Single Fault Condition)'],
  },

  '4.3': {
    section: '4.3',
    title: 'Essential Performance',
    overview: 'During risk analysis, identify the clinical function(s) whose loss or degradation would result in unacceptable risk. These constitute Essential Performance. Evaluate both normal condition and single fault condition.',
    expectations: [
      'Clinical functions identified through risk analysis',
      'Performance limits specified for normal and single fault conditions',
      'Essential Performance features clearly listed with hazard mapping',
      'Risk control measures for each Essential Performance feature',
    ],
    whyItMatters: 'Essential Performance is tested throughout the IEC 60601-1 testing programme. If you cannot define it, you cannot verify that the device maintains it under all required conditions.',
    tips: [
      'Use the tables (4.3a and 4.3b) to systematically evaluate each clinical function',
      'A clinical function is NOT Essential Performance if its loss does not create unacceptable risk',
      'Consider partial degradation, not just total loss, when evaluating risk',
      'Essential Performance features should be defined in your Device Definition → Purpose tab',
    ],
    commonPitfalls: [
      'Listing too many functions as Essential Performance (leads to excessive testing)',
      'Listing too few (misses safety-critical functions)',
      'Not evaluating single fault conditions separately from normal conditions',
    ],
    keyDeliverables: ['Essential Performance table', 'Clinical function risk analysis', 'EP verification test plan'],
    relatedClauses: ['IEC 60601-1 §1.2 (Object)', 'IEC 60601-1 §4.2 (Risk Management)'],
  },

  '4.4': {
    section: '4.4',
    title: 'Expected Service Life',
    overview: 'The manufacturer must specify the expected service life — the time period during which the ME Equipment is expected to remain safe for use (maintain Basic Safety and Essential Performance).',
    expectations: [
      'Expected service life documented in the Risk Management File',
      'Justification for the chosen service life period',
      'Maintenance requirements during the service life identified',
    ],
    whyItMatters: 'The expected service life affects testing requirements (e.g., component degradation, wear testing) and labelling. It also defines the period over which post-market surveillance data must demonstrate continued safety.',
    tips: [
      'Consider component degradation, mechanical wear, and material aging when setting service life',
      'Include maintenance requirements that must be followed during the service life',
      'The service life should be realistic and supportable by test data',
    ],
    keyDeliverables: ['Expected service life specification', 'Maintenance schedule'],
    relatedClauses: ['IEC 60601-1 §4.2 (Risk Management)', 'IEC 60601-1 §11.4 (Biocompatibility)'],
  },

  '6.1': {
    section: '6.1',
    title: 'Classification Against Electric Shock',
    overview: 'ME Equipment must be classified for protection against electric shock: Class I (basic insulation + protective earth), Class II (double/reinforced insulation), or Internally Powered.',
    expectations: [
      'Protection class clearly stated and justified',
      'Classification consistent with the device\'s electrical design',
      'Appropriate insulation and earthing measures implemented',
    ],
    whyItMatters: 'The protection class determines which electrical safety requirements apply and how the device must be tested. An incorrect classification leads to either insufficient protection or unnecessary design constraints.',
    tips: [
      'Class I is most common for mains-powered ME Equipment with metal enclosures',
      'Class II is used when double or reinforced insulation is feasible throughout',
      'Internally powered devices have different leakage current requirements',
    ],
    keyDeliverables: ['Protection class determination', 'Insulation analysis'],
    relatedClauses: ['IEC 60601-1 §8.1 (Fundamental Rule of Protection)', 'IEC 60601-1 §8.3 (Means of Protection)'],
  },

  '6.2': {
    section: '6.2',
    title: 'Classification of Applied Parts',
    overview: 'Applied Parts must be classified as Type B (basic protection), Type BF (floating, higher protection), or Type CF (cardiac, highest protection). The classification determines leakage current limits.',
    expectations: [
      'Each Applied Part classified with justification',
      'Classification appropriate for the intended patient contact',
      'Leakage current limits correctly identified for each type',
    ],
    whyItMatters: 'Applied Part classification directly determines the allowable patient leakage current limits. Type CF (cardiac) has the strictest limits (10 µA normal) because the current path may include the heart.',
    tips: [
      'Type B: No intentional current to patient, not for direct cardiac application',
      'Type BF: Floating applied part, provides higher protection but not for cardiac use',
      'Type CF: Required for any application where current could flow through the heart',
      'When in doubt, classify higher (more protective)',
    ],
    keyDeliverables: ['Applied Part classification document', 'Leakage current test requirements'],
    relatedClauses: ['IEC 60601-1 §8.4 (Leakage Current Limits)', 'IEC 60601-1 §8.5 (Separation of Parts)'],
  },

  '8.1': {
    section: '8.1',
    title: 'Fundamental Rule of Protection',
    overview: 'ME Equipment must provide at least two independent means of protection (MOP) against electric shock for both operators (MOOP) and patients (MOPP). The failure of one MOP must not result in unacceptable risk.',
    expectations: [
      'At least 2 × MOOP and 2 × MOPP identified',
      'Description of each means of protection',
      'Independence of MOPs demonstrated',
    ],
    whyItMatters: 'The two-MOP rule is the fundamental safety principle of IEC 60601-1. It ensures that a single failure cannot expose a person to electric shock.',
    tips: [
      'Common MOPs include: basic insulation, supplementary insulation, protective earth, reinforced insulation, SELV circuits',
      'Patient protection (MOPP) has stricter requirements than operator protection (MOOP)',
      'Document the MOP analysis clearly — auditors will look for this specifically',
    ],
    keyDeliverables: ['MOP analysis document', 'MOOP/MOPP identification'],
    relatedClauses: ['IEC 60601-1 §8.3 (MOPs)', 'IEC 60601-1 §8.4 (Leakage Currents)', 'IEC 60601-1 §8.7 (Creepage/Clearance)'],
  },

  '14.1': {
    section: '14.1',
    title: 'General Requirements for PEMS',
    overview: 'Programmable Electrical Medical Systems (PEMS) — ME Equipment containing programmable electronic subsystems — must comply with additional requirements for software and hardware lifecycle processes.',
    expectations: [
      'Determination of whether the device contains a PEMS',
      'If yes, IEC 62304 applied to the software lifecycle',
      'PEMS architecture documented',
      'Software safety classification performed',
    ],
    whyItMatters: 'PEMS requirements bridge IEC 60601-1 and IEC 62304. Most modern ME Equipment contains software, making this clause applicable to the majority of devices.',
    tips: [
      'If your device contains any programmable component (microcontroller, FPGA, software), it is a PEMS',
      'Reference your IEC 62304 gap analysis for software lifecycle compliance',
      'Ensure the PEMS architecture documentation aligns with the software architecture description',
    ],
    keyDeliverables: ['PEMS determination', 'PEMS architecture', 'Software safety classification', 'IEC 62304 compliance evidence'],
    relatedClauses: ['IEC 62304 (Software Lifecycle)', 'IEC 60601-1 §14.13 (PEMS Risk Management)'],
  },

  '17.1': {
    section: '17.1',
    title: 'General EMC Requirements',
    overview: 'ME Equipment and ME Systems must comply with the EMC requirements of IEC 60601-1-2. The device must perform as intended in its specified electromagnetic environment and must not generate disturbances affecting other equipment.',
    expectations: [
      'IEC 60601-1-2 applied and referenced',
      'Intended electromagnetic environment specified',
      'EMC test plan and reports available',
      'Essential Performance maintained during EMC testing',
    ],
    whyItMatters: 'EMC compliance is required for CE marking and FDA clearance. Electromagnetic interference can cause ME Equipment to malfunction, potentially harming patients.',
    tips: [
      'Specify the intended electromagnetic environment early — it determines test levels',
      'Professional healthcare and home environments have different EMC requirements',
      'Essential Performance must be maintained during and after EMC immunity tests',
    ],
    keyDeliverables: ['EMC test plan', 'EMC test reports', 'EM environment declaration'],
    relatedClauses: ['IEC 60601-1-2', 'IEC 60601-1 §4.3 (Essential Performance)'],
  },
};
