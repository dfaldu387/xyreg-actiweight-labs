/**
 * Contextual help data for IEC 60601-1-6 (Usability) clauses (§4–5).
 */

import type { GapClauseHelp } from './gapAnalysisHelpData';

export const IEC_60601_1_6_HELP: Record<string, GapClauseHelp> = {
  '4.1': {
    section: '4.1',
    title: 'Application of Usability Engineering Process',
    overview: 'This clause requires that a usability engineering process per IEC 62366-1 is applied throughout the ME equipment lifecycle. The process must be documented in a usability engineering plan.',
    expectations: [
      'A documented usability engineering plan referencing IEC 62366-1',
      'Evidence that the UE process covers all lifecycle stages',
      'Clear linkage between UE activities and risk management',
    ],
    whyItMatters: 'IEC 60601-1-6 makes IEC 62366-1 a normative reference for ME equipment. Without a documented UE process, usability-related safety claims cannot be substantiated.',
    tips: [
      'Reference IEC 62366-1 directly in your usability engineering plan',
      'Integrate UE milestones with your design control process',
      'Ensure the UE plan is device-specific, not just a generic company procedure',
    ],
    commonPitfalls: [
      'UE plan exists but does not reference IEC 62366-1',
      'UE activities not linked to risk management outputs',
      'UE plan not updated when the device design changes',
    ],
    keyDeliverables: ['Usability engineering plan', 'UE process flow diagram'],
  },

  '4.2': {
    section: '4.2',
    title: 'Usability Engineering File',
    overview: 'A usability engineering file must be maintained containing all records and documents produced by the UE process, providing full traceability.',
    expectations: [
      'A structured UE file with table of contents',
      'All UE documents referenced or contained',
      'Version control applied to UE documents',
    ],
    whyItMatters: 'The UE file is the primary evidence reviewed by auditors and notified bodies. Without it, compliance with IEC 62366-1 cannot be demonstrated.',
    tips: [
      'Keep an index that cross-references the UE file to IEC 62366-1 clauses',
      'Include or reference: use specification, risk analysis, UI specification, formative evaluations, summative evaluation',
    ],
    commonPitfalls: [
      'UE file incomplete or not maintained',
      'Documents scattered across multiple systems without a central index',
    ],
    keyDeliverables: ['Usability engineering file', 'UE file index'],
  },

  '5.1': {
    section: '5.1',
    title: 'Prepare USE Specification',
    overview: 'The use specification defines the intended medical indication, patient population, intended users, use environment, and operating principle. It is the foundation for all subsequent UE activities.',
    expectations: [
      'Intended medical indication and patient population defined',
      'Detailed intended user profile (training, experience, capabilities)',
      'Intended use environment described (physical, organisational)',
      'Operating principle explained',
    ],
    whyItMatters: 'All usability requirements and evaluations are derived from the use specification. An incomplete or inaccurate use specification undermines the entire UE process.',
    tips: [
      'Base user profiles on research, not assumptions',
      'Consider the full range of users including worst-case (e.g., fatigued, inexperienced)',
      'Describe the use environment in enough detail to inform design decisions',
    ],
    commonPitfalls: [
      'Generic user profiles not based on actual user research',
      'Use environment described too vaguely',
      'Missing consideration of lay users for home-use devices',
    ],
    keyDeliverables: ['Use specification document'],
  },

  '5.2': {
    section: '5.2',
    title: 'Identify User Interface Characteristics Related to Safety',
    overview: 'Analyse the user interface to identify characteristics that could lead to use errors and hazardous situations. Document hazard-related use scenarios.',
    expectations: [
      'UI hazard analysis documented',
      'Use errors and their potential consequences identified',
      'Hazard-related use scenarios described',
      'Linkage to the risk management process',
    ],
    whyItMatters: 'Use errors are a leading cause of medical device incidents. Systematic identification is essential for designing safe user interfaces.',
    tips: [
      'Use task analysis and FMEA to identify potential use errors',
      'Consider both omission errors (failing to act) and commission errors (wrong action)',
      'Involve actual users in the hazard identification process',
    ],
    commonPitfalls: [
      'Only considering obvious errors, not subtle interaction issues',
      'Not linking UI hazards to the risk management file',
    ],
    keyDeliverables: ['UI hazard analysis', 'Hazard-related use scenario list'],
  },

  '5.3': {
    section: '5.3',
    title: 'Identify Hazard-Related Use Scenarios',
    overview: 'Systematically identify all hazard-related use scenarios through task analysis and failure mode analysis.',
    expectations: [
      'Task analyses documented for critical tasks',
      'Use error failure modes identified',
      'Hazard-related use scenarios fully described (trigger, error, consequence)',
    ],
    whyItMatters: 'These scenarios form the basis for summative usability evaluation and are critical for demonstrating safety.',
    tips: [
      'Include both routine and emergency use scenarios',
      'Consider scenarios involving transitions between modes or users',
    ],
    commonPitfalls: [
      'Only analysing the "happy path"',
      'Not considering emergency or degraded-mode scenarios',
    ],
    keyDeliverables: ['Task analysis reports', 'Hazard-related use scenario documentation'],
  },

  '5.4': {
    section: '5.4',
    title: 'Select Hazard-Related Use Scenarios for Summative Evaluation',
    overview: 'Select the critical hazard-related use scenarios that must be validated during summative usability testing.',
    expectations: [
      'Selection criteria documented and justified',
      'Selected scenarios cover the highest-risk use errors',
      'Rationale for exclusion of any scenarios documented',
    ],
    whyItMatters: 'Summative testing must cover the most critical scenarios. Poor selection can leave significant use risks unvalidated.',
    tips: [
      'Prioritise by severity of potential harm',
      'Include scenarios that previous formative evaluations flagged as problematic',
      'Document why excluded scenarios are adequately mitigated by other means',
    ],
    commonPitfalls: [
      'Selecting only easy-to-test scenarios',
      'Not documenting the rationale for exclusions',
    ],
    keyDeliverables: ['Summative scenario selection with rationale'],
  },

  '5.5': {
    section: '5.5',
    title: 'Establish User Interface Specification',
    overview: 'Define measurable user interface requirements that address identified hazards and use errors.',
    expectations: [
      'UI requirements traceable to identified hazards',
      'Requirements for displays, controls, alarms, and labelling',
      'Requirements are testable and measurable',
    ],
    whyItMatters: 'UI requirements drive the design and provide the basis for verification and validation.',
    tips: [
      'Make requirements specific and measurable (e.g., "alarm audible at 1 m", not "alarm is loud")',
      'Trace each requirement back to a hazard or use scenario',
    ],
    commonPitfalls: [
      'Vague requirements that cannot be tested',
      'Requirements not traced to hazards',
    ],
    keyDeliverables: ['User interface specification'],
  },

  '5.6': {
    section: '5.6',
    title: 'Establish User Interface Evaluation Plan',
    overview: 'Plan both formative and summative evaluations of the user interface, including methods, participants, and acceptance criteria.',
    expectations: [
      'Formative evaluation methods defined',
      'Summative evaluation protocol with acceptance criteria',
      'Participant recruitment criteria defined',
    ],
    whyItMatters: 'A well-planned evaluation ensures that usability issues are found early (formative) and that the final design is validated (summative).',
    tips: [
      'Plan multiple formative rounds — they are inexpensive and highly valuable',
      'Define summative acceptance criteria before testing, not after',
    ],
    commonPitfalls: [
      'No formative evaluations planned',
      'Acceptance criteria set after seeing results (biased)',
    ],
    keyDeliverables: ['UI evaluation plan', 'Summative test protocol'],
  },

  '5.7': {
    section: '5.7',
    title: 'UI Design, Implementation and Formative Evaluation',
    overview: 'Design and implement the UI, then conduct formative evaluations (expert reviews, cognitive walkthroughs, early user tests) to identify and fix usability issues iteratively.',
    expectations: [
      'Evidence of iterative design with formative feedback',
      'Formative evaluation reports documenting findings and design changes',
      'Multiple formative cycles before summative testing',
    ],
    whyItMatters: 'Formative evaluation is where most usability issues are found and fixed. Skipping this step leads to costly failures in summative testing.',
    tips: [
      'Start with low-fidelity prototypes for early formative rounds',
      'Document all design changes made as a result of formative findings',
      'Include diverse user groups in formative testing',
    ],
    commonPitfalls: [
      'Only one formative round conducted',
      'Formative findings not systematically tracked',
      'Design changes not documented',
    ],
    keyDeliverables: ['Formative evaluation reports', 'Design change log'],
  },

  '5.8': {
    section: '5.8',
    title: 'Summative Evaluation of Usability',
    overview: 'Conduct summative usability testing with representative users to validate that critical use scenarios can be completed safely. This is the final validation of the user interface.',
    expectations: [
      'Summative test conducted with representative users',
      'All selected hazard-related use scenarios tested',
      'Results demonstrate acceptable residual risk',
      'Test report with detailed findings and conclusions',
    ],
    whyItMatters: 'Summative evaluation is the definitive evidence that the UI is safe for its intended users. Notified bodies scrutinise this closely.',
    tips: [
      'Recruit participants matching the intended user profile',
      'Use a formal test protocol with trained moderators',
      'Document both successes and failures in detail',
      'Address any use errors through design changes or risk controls, not just training',
    ],
    commonPitfalls: [
      'Participants not representative of intended users',
      'Insufficient number of participants',
      'Critical use errors dismissed as "user training issues"',
      'Test conducted on a non-final prototype',
    ],
    keyDeliverables: ['Summative usability test plan', 'Summative usability test report', 'Residual risk assessment'],
  },

  '5.9': {
    section: '5.9',
    title: 'User Interface for Self-Use ME Equipment',
    overview: 'For self-use (home use) ME equipment, additional requirements apply to ensure lay users can operate the device safely without professional supervision.',
    expectations: [
      'Lay user interface designed with simplified controls',
      'Training materials appropriate for lay users',
      'Summative testing with lay user participants',
    ],
    whyItMatters: 'Lay users have no medical training and may use devices in unsupervised, uncontrolled environments. The UI must compensate for this.',
    tips: [
      'Design for the lowest common denominator of user capability',
      'Include clear error messages and recovery guidance',
      'Test with actual lay users, not healthcare professionals',
    ],
    commonPitfalls: [
      'Testing with healthcare professionals instead of lay users',
      'Assuming lay users will read the manual',
      'Complex error messages using medical terminology',
    ],
    keyDeliverables: ['Self-use UI assessment', 'Lay user training materials'],
  },
};
