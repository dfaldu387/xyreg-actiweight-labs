/**
 * Detailed contextual help data for every IEC 62304:2015 clause.
 * Used by the Help & Guide sidebar when the user is on a gap analysis step.
 */

export interface GapClauseHelp {
  section: string;
  title: string;
  /** One-paragraph plain-language explanation of the clause. */
  overview: string;
  /** What an auditor / notified body expects to see. */
  expectations: string[];
  /** Why this clause matters — regulatory and practical motivation. */
  whyItMatters: string;
  /** Practical tips for compliance. */
  tips: string[];
  /** Common pitfalls / mistakes. */
  commonPitfalls?: string[];
  /** Key deliverables / evidence artefacts. */
  keyDeliverables?: string[];
  /** Related IEC 62304 or other standard references. */
  relatedClauses?: string[];
  /** Safety class applicability note (A, B, C). */
  safetyClassNote?: string;
}

export const IEC_62304_HELP: Record<string, GapClauseHelp> = {
  '4.1': {
    section: '4.1',
    title: 'Quality Management System',
    overview: 'This clause requires that all software development activities are performed under a quality management system (QMS) that conforms to ISO 13485 or an equivalent standard. The QMS must specifically address the full software lifecycle — from planning through maintenance.',
    expectations: [
      'A valid ISO 13485 certificate or documented QMS covering software activities',
      'Evidence that the QMS scope includes software development, verification, and maintenance',
      'Quality manual sections referencing IEC 62304 software lifecycle processes',
      'Defined roles and responsibilities for software quality activities',
    ],
    whyItMatters: 'Without a QMS foundation, there is no controlled environment for software development. Regulators view this as the prerequisite for all other IEC 62304 activities — if your QMS does not cover software, nothing else in this standard can be considered compliant.',
    tips: [
      'Reference your ISO 13485 certificate and highlight the scope statement covering software',
      'Map your QMS procedures to IEC 62304 clauses in a cross-reference table',
      'Ensure your quality manual explicitly mentions "software as a medical device" or "software in a medical device"',
      'If using an equivalent QMS (e.g., ISO 9001 + additional controls), document the equivalence justification',
    ],
    commonPitfalls: [
      'QMS scope statement does not mention software development',
      'Quality manual references IEC 62304 but has no implementing procedures',
      'Training records do not show that staff are trained on software-specific QMS procedures',
    ],
    keyDeliverables: ['QMS certificate', 'Quality manual (software sections)', 'QMS scope statement', 'Process cross-reference matrix'],
    relatedClauses: ['ISO 13485:2016', 'IEC 62304 §5.1 (Software Development Planning)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '4.2': {
    section: '4.2',
    title: 'Risk Management',
    overview: 'This clause requires that a risk management process conforming to ISO 14971 is applied throughout the software lifecycle. Software-specific hazards must be identified, analysed, and controlled.',
    expectations: [
      'A risk management plan that explicitly includes software-related hazards',
      'Evidence of ISO 14971 application to software items',
      'Hazard analysis covering software failure modes, SOUP risks, and data integrity issues',
      'Traceability from software risk control measures to verification activities',
    ],
    whyItMatters: 'Software can contribute to hazardous situations through incorrect outputs, timing failures, or data corruption. Without systematic risk management, dangerous software behaviours may go undetected until post-market.',
    tips: [
      'Start risk analysis early in the development cycle — do not bolt it on at the end',
      'Include software-specific hazard categories: incorrect computation, timing/sequencing, data integrity, cybersecurity',
      'Link each identified software hazard to specific risk control measures in your architecture or design',
      'Review SOUP anomaly lists as part of your hazard identification',
    ],
    commonPitfalls: [
      'Risk management plan does not mention software or IEC 62304',
      'Hazard analysis only covers hardware — software failure modes are missing',
      'Risk control measures are not verified through testing',
    ],
    keyDeliverables: ['Risk management plan', 'Software hazard analysis', 'Risk/benefit analysis', 'Risk control verification records'],
    relatedClauses: ['ISO 14971:2019', 'IEC 62304 §7.1–7.4'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '4.3': {
    section: '4.3',
    title: 'Software Safety Classification',
    overview: 'Classify your software system (and individual software items) into safety Class A, B, or C based on the potential severity of harm if the software fails. Class A = no injury possible, Class B = non-serious injury possible, Class C = serious injury or death possible.',
    expectations: [
      'A documented safety classification rationale for the software system',
      'Classification of individual software items where decomposition is used',
      'Justification based on the contribution of software to hazardous situations',
      'Approval of the classification by the responsible person (e.g., risk manager)',
    ],
    whyItMatters: 'The safety class determines the rigour of development activities required. Getting this wrong can mean either insufficient safety controls (under-classification) or unnecessary overhead (over-classification). Notified bodies scrutinise classification decisions closely.',
    tips: [
      'Default to Class C if in doubt — you can always decompose and reclassify individual items later',
      'Document the reasoning clearly: what hazards exist, what is the severity, and why the chosen class is appropriate',
      'Consider the entire failure chain: software → system → patient/user/operator → harm',
      'Review classification whenever the intended use, architecture, or risk analysis changes',
    ],
    commonPitfalls: [
      'Classifying the whole system as Class A without sufficient hazard analysis',
      'Not revisiting classification when requirements or architecture change',
      'Confusing device classification (Class I/IIa/IIb/III) with software safety classification (A/B/C)',
    ],
    keyDeliverables: ['Software safety classification document', 'Classification rationale', 'Approved classification record'],
    relatedClauses: ['IEC 62304 §4.2 (Risk Management)', 'IEC 62304 §7.1 (Hazardous Situations)'],
    safetyClassNote: 'This clause determines the applicable requirements for all subsequent clauses.',
  },

  '4.4': {
    section: '4.4',
    title: 'Legacy Software',
    overview: 'If you have software that was developed before the application of IEC 62304 (or without full compliance), this clause provides a pathway to assess and manage it. You must determine if it qualifies as legacy software, perform a risk assessment, conduct a gap analysis, and create a remediation plan.',
    expectations: [
      'Clear determination of whether the software qualifies as "legacy software"',
      'A documented risk assessment specific to the legacy software',
      'A gap analysis comparing the legacy software\'s development against IEC 62304 requirements',
      'A remediation plan addressing identified gaps, or documented justification for continued use',
    ],
    whyItMatters: 'Many medical device manufacturers have software that predates IEC 62304. Simply ignoring the standard for existing products is not acceptable. This clause provides a structured, risk-based approach to bringing legacy software into compliance or justifying its continued use.',
    tips: [
      'Document the development history of the legacy software — what processes were followed, even informally',
      'Focus the gap analysis on safety-critical areas first',
      'A phased remediation plan is acceptable — you do not need to achieve full compliance overnight',
      'If the software has a strong post-market track record, use that data to support your risk assessment',
    ],
    commonPitfalls: [
      'Ignoring legacy software and only applying IEC 62304 to new development',
      'Performing a superficial gap analysis without actionable findings',
      'No timeline or prioritisation in the remediation plan',
    ],
    keyDeliverables: ['Legacy software determination', 'Legacy risk assessment', 'Gap analysis report', 'Remediation plan'],
    relatedClauses: ['IEC 62304 §4.3 (Safety Classification)', 'IEC 62304 §7.1 (Hazardous Situations)'],
    safetyClassNote: 'Applicable to all safety classes. The depth of analysis should be proportional to the safety class.',
  },

  '5.1': {
    section: '5.1',
    title: 'Software Development Planning',
    overview: 'Create and maintain a comprehensive software development plan (SDP) that addresses all aspects of the development lifecycle: processes to be used, deliverables, standards, methods, tools, integration strategy, verification approach, risk management integration, documentation, and configuration management.',
    expectations: [
      'A formal Software Development Plan (SDP) document',
      'Coverage of all 11 sub-clauses (5.1.1–5.1.11)',
      'Identification of development standards, methods, and tools',
      'Integration and verification strategies',
      'Configuration management and documentation plans',
      'Evidence that the plan is kept updated throughout the project',
    ],
    whyItMatters: 'The SDP is the master document that governs your entire software development effort. It defines how you will comply with IEC 62304. Without it, individual activities lack context and coherence.',
    tips: [
      'Write the SDP early and keep it as a living document — update it as the project evolves',
      'Cross-reference your SDP to your QMS procedures rather than duplicating content',
      'Include clear entry and exit criteria for each development phase',
      'Define the software safety class in the SDP and explain how it affects your process tailoring',
      'Address SOUP management, including how SOUP items are evaluated and integrated',
    ],
    commonPitfalls: [
      'Creating the SDP after development is complete (retrofit)',
      'SDP is too generic — does not address project-specific choices',
      'No evidence of plan updates when scope or approach changed',
      'Missing configuration management or documentation planning sections',
    ],
    keyDeliverables: ['Software Development Plan', 'Tool qualification records', 'Standards reference list'],
    relatedClauses: ['IEC 62304 §4.3 (Safety Classification)', 'IEC 62304 §8.1 (Configuration Identification)'],
    safetyClassNote: 'Applicable to all safety classes. Class C requires the most detailed planning.',
  },

  '5.2': {
    section: '5.2',
    title: 'Software Requirements Analysis',
    overview: 'Define and document all software requirements derived from system requirements, including functional, performance, interface, and safety requirements. Include risk control measures as requirements. Verify that requirements are complete, correct, unambiguous, and traceable.',
    expectations: [
      'A Software Requirements Specification (SRS) derived from system requirements',
      'Requirements covering functionality, performance, interfaces, security, and usability',
      'Risk control measures incorporated as software requirements',
      'Traceability from system requirements to software requirements',
      'Verification records showing requirements were reviewed and approved',
    ],
    whyItMatters: 'Software requirements are the foundation for all downstream activities — design, implementation, and testing. Incomplete or incorrect requirements are the #1 root cause of software defects in medical devices.',
    tips: [
      'Use a requirements management tool to maintain traceability',
      'Write requirements that are testable — each requirement should have a clear pass/fail criterion',
      'Involve clinical users and risk management when defining requirements',
      'Re-evaluate the device risk analysis whenever requirements change (§5.2.4)',
      'Tag each requirement with its source (system requirement, risk control, regulatory, user need)',
    ],
    commonPitfalls: [
      'Requirements are vague or untestable ("the system shall be fast")',
      'Risk control measures are not captured as formal requirements',
      'No traceability to system-level requirements',
      'Requirements not reviewed by a cross-functional team',
    ],
    keyDeliverables: ['Software Requirements Specification', 'Requirements traceability matrix', 'Requirements review records'],
    relatedClauses: ['IEC 62304 §5.3 (Architectural Design)', 'IEC 62304 §5.7 (System Testing)', 'IEC 62304 §7.1 (Hazardous Situations)'],
    safetyClassNote: 'All sub-clauses apply to Class B and C. For Class A, only 5.2.1 and 5.2.6 are required.',
  },

  '5.3': {
    section: '5.3',
    title: 'Software Architectural Design',
    overview: 'Transform software requirements into a documented architecture that identifies software items, their interfaces, SOUP items, and any segregation needed for risk control. Verify the architecture against requirements.',
    expectations: [
      'A Software Architecture Description (SAD) document',
      'Identification of all software items and their relationships',
      'SOUP items identified with functional and performance requirements',
      'Hardware/software requirements for each SOUP item documented',
      'Segregation strategy for risk control (if applicable)',
      'Architecture verification records',
    ],
    whyItMatters: 'The architecture determines how software items interact and where safety boundaries exist. A well-designed architecture enables effective risk control through segregation and modularity.',
    tips: [
      'Use diagrams (block diagrams, data flow diagrams) to communicate the architecture clearly',
      'Explicitly identify which software items contribute to safety-critical functions',
      'Document all SOUP items with version numbers, intended use, and known anomalies',
      'Design for testability — the architecture should make verification feasible',
      'Consider cybersecurity boundaries in your architecture',
    ],
    commonPitfalls: [
      'Architecture document is just a code-level class diagram — it should show functional decomposition',
      'SOUP items are not identified or their requirements not documented',
      'No segregation analysis even when safety-critical functions exist',
      'Architecture not updated when significant design changes occur',
    ],
    keyDeliverables: ['Software Architecture Description', 'SOUP list with requirements', 'Interface specifications', 'Architecture verification records'],
    relatedClauses: ['IEC 62304 §5.2 (Requirements)', 'IEC 62304 §5.4 (Detailed Design)', 'IEC 62304 §7.2 (Risk Control Measures)'],
    safetyClassNote: 'All sub-clauses apply to Class B and C. For Class A, architecture documentation is not required.',
  },

  '5.4': {
    section: '5.4',
    title: 'Software Detailed Design',
    overview: 'Refine the architecture into detailed designs for each software unit, including interfaces between units. The detailed design should be sufficient to allow implementation and unit testing without ambiguity.',
    expectations: [
      'Detailed design documents for each software unit',
      'Interface specifications between units',
      'Design sufficient for implementation by a developer who did not write the design',
      'Verification of detailed design against architecture and requirements',
    ],
    whyItMatters: 'Detailed design bridges the gap between architecture and code. For Class C software, it provides the level of design scrutiny needed to catch errors before they become code defects.',
    tips: [
      'The level of detail should be proportional to risk — Class C units need more detail than Class B',
      'Include algorithmic descriptions, state machines, and data structure definitions',
      'Design reviews are an effective verification method at this stage',
      'Ensure each unit\'s design can be traced back to specific requirements',
    ],
    commonPitfalls: [
      'Skipping detailed design and going straight to code',
      'Detailed design is just auto-generated from code (retrofit)',
      'No verification of the detailed design before implementation begins',
    ],
    keyDeliverables: ['Detailed design documents', 'Interface specifications', 'Design verification records'],
    relatedClauses: ['IEC 62304 §5.3 (Architecture)', 'IEC 62304 §5.5 (Unit Implementation)'],
    safetyClassNote: 'Required for Class C only. Not required for Class A or B.',
  },

  '5.5': {
    section: '5.5',
    title: 'Software Unit Implementation and Verification',
    overview: 'Implement each software unit according to the detailed design and verify it against defined acceptance criteria. For Class C, additional criteria (coding standards, no undocumented features) apply.',
    expectations: [
      'Source code for each software unit',
      'Defined acceptance criteria for unit verification',
      'Unit test results demonstrating criteria are met',
      'For Class C: evidence of coding standard compliance and code review',
      'Traceability from units to their detailed design',
    ],
    whyItMatters: 'Unit-level verification catches defects at the earliest and cheapest point in the lifecycle. For safety-critical software, rigorous unit verification is essential to building a reliable system.',
    tips: [
      'Define acceptance criteria before writing code, not after',
      'Use automated unit testing frameworks for repeatable, regression-safe verification',
      'Apply static analysis tools to check coding standard compliance',
      'Conduct code reviews — they catch different types of defects than testing',
      'Document which units are safety-critical and apply extra scrutiny',
    ],
    commonPitfalls: [
      'No formal acceptance criteria — "it works" is not sufficient',
      'Unit tests only cover happy paths, not error conditions or boundary cases',
      'Code reviews are informal and not documented',
      'Acceptance criteria written after implementation (justifying what was built rather than verifying intent)',
    ],
    keyDeliverables: ['Source code', 'Unit test cases and results', 'Code review records', 'Static analysis reports'],
    relatedClauses: ['IEC 62304 §5.4 (Detailed Design)', 'IEC 62304 §5.6 (Integration Testing)'],
    safetyClassNote: 'Class A: 5.5.1 only. Class B: 5.5.1–5.5.3, 5.5.5. Class C: all sub-clauses.',
  },

  '5.6': {
    section: '5.6',
    title: 'Software Integration and Integration Testing',
    overview: 'Integrate software units according to the integration plan, verify that integrated software items work together correctly, perform regression testing, and document results.',
    expectations: [
      'Integration plan or strategy (which units are integrated in which order)',
      'Integration test procedures covering interfaces between software items',
      'Integration test results with pass/fail outcomes',
      'Regression test evidence after integration changes',
      'Problem reports for any integration failures',
    ],
    whyItMatters: 'Integration testing reveals defects that unit testing cannot — interface mismatches, timing issues, data format inconsistencies, and emergent behaviours that only appear when components interact.',
    tips: [
      'Use a bottom-up or incremental integration strategy to isolate failures',
      'Test interfaces explicitly — do not assume that units verified independently will work together',
      'Automate integration tests where possible for faster regression cycles',
      'Document the integration order and rationale',
      'Include negative tests: what happens when an interface receives unexpected input?',
    ],
    commonPitfalls: [
      'Big-bang integration with no incremental testing',
      'Integration tests only test happy paths',
      'No regression testing after fixing integration defects',
      'Test records do not include the specific configuration/versions tested',
    ],
    keyDeliverables: ['Integration test plan', 'Integration test procedures', 'Test results', 'Regression test records'],
    relatedClauses: ['IEC 62304 §5.5 (Unit Verification)', 'IEC 62304 §5.7 (System Testing)', 'IEC 62304 §9 (Problem Resolution)'],
    safetyClassNote: 'Class A: 5.6.1–5.6.4 only. Class B and C: all sub-clauses.',
  },

  '5.7': {
    section: '5.7',
    title: 'Software System Testing',
    overview: 'Establish and execute system-level tests to demonstrate that all software requirements are met. Evaluate test coverage, document results, and ensure problems are resolved through the problem resolution process.',
    expectations: [
      'System test plan referencing all software requirements',
      'Test procedures for each testable requirement',
      'System test results with requirement-level traceability',
      'Evidence that test procedures themselves were evaluated for correctness',
      'Re-test evidence after any changes during system testing',
    ],
    whyItMatters: 'System testing is the final verification that the software meets all specified requirements before release. It provides the primary evidence to regulators that the software does what it is supposed to do.',
    tips: [
      'Ensure every software requirement has at least one system test',
      'Include both positive (expected behaviour) and negative (error handling) tests',
      'Test in a representative environment (or document the differences)',
      'Have someone other than the developer write or review the test procedures',
      'Maintain a requirement-to-test traceability matrix',
    ],
    commonPitfalls: [
      'Test coverage gaps — requirements without corresponding tests',
      'Testing only in a development environment, not a production-like environment',
      'Test procedures are ambiguous — different testers get different results',
      'No re-testing after defect fixes during system testing',
    ],
    keyDeliverables: ['System test plan', 'Test procedures', 'Test results', 'Traceability matrix', 'Test evaluation records'],
    relatedClauses: ['IEC 62304 §5.2 (Requirements)', 'IEC 62304 §5.8 (Release)', 'IEC 62304 §9 (Problem Resolution)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '5.8': {
    section: '5.8',
    title: 'Software Release',
    overview: 'Before releasing software, ensure all verification activities are complete, document known residual anomalies, evaluate their impact, archive the released version, and ensure the release can be reproduced.',
    expectations: [
      'Evidence that all planned verification activities are complete',
      'A list of known residual anomalies with risk evaluation',
      'Release notes documenting the version, changes, and known issues',
      'Archived release package (source code, build scripts, configurations)',
      'Evidence that the release is reproducible (same inputs → same binary)',
    ],
    whyItMatters: 'Software release is a controlled quality gate. Releasing software with unknown defects or without complete verification undermines all prior development efforts and exposes patients to uncontrolled risk.',
    tips: [
      'Create a release checklist that covers all sub-clauses (5.8.1–5.8.8)',
      'Evaluate each known anomaly against the risk management file — can the device still be used safely?',
      'Use automated build systems to ensure reproducibility',
      'Archive not just the code but also the build environment, tools, and configurations',
      'Maintain a release history log for regulatory submissions',
    ],
    commonPitfalls: [
      'Releasing before all verification activities are documented as complete',
      'Known anomalies not evaluated for safety impact',
      'No reproducible build process — unable to rebuild the exact released version',
      'Release archive does not include third-party/SOUP components',
    ],
    keyDeliverables: ['Release notes', 'Known anomaly list with evaluation', 'Release archive', 'Build reproduction evidence'],
    relatedClauses: ['IEC 62304 §5.7 (System Testing)', 'IEC 62304 §8.1 (Configuration Identification)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '6.1': {
    section: '6.1',
    title: 'Establish Software Maintenance Plan',
    overview: 'Define a plan for maintaining the software after release, including criteria for when modifications require re-entry into the software development process, feedback handling, and update delivery mechanisms.',
    expectations: [
      'A Software Maintenance Plan (SMP) document',
      'Criteria for when modifications trigger the development process',
      'Process for collecting and evaluating post-release feedback',
      'Method for delivering updates to users/field installations',
    ],
    whyItMatters: 'Medical device software requires ongoing maintenance — bug fixes, security patches, regulatory updates. Without a plan, maintenance activities can introduce new risks or bypass safety controls.',
    tips: [
      'Define clear thresholds: which changes are "minor" (no re-verification) vs. "significant" (full process)',
      'Include cybersecurity patch management in your maintenance plan',
      'Align the maintenance plan with your post-market surveillance plan',
      'Define how field-reported issues feed into problem resolution (§9)',
    ],
    commonPitfalls: [
      'No maintenance plan exists — maintenance is ad-hoc',
      'All changes are treated equally regardless of risk impact',
      'No connection between maintenance activities and risk management updates',
    ],
    keyDeliverables: ['Software Maintenance Plan'],
    relatedClauses: ['IEC 62304 §6.2 (Problem and Modification Analysis)', 'IEC 62304 §9 (Problem Resolution)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '6.2': {
    section: '6.2',
    title: 'Problem and Modification Analysis',
    overview: 'Evaluate problem reports and change requests systematically. Analyse each for safety impact, determine the appropriate response, approve changes, and communicate to affected parties including users and regulators when necessary.',
    expectations: [
      'Documented evaluation of each problem report',
      'Impact analysis for each change request (including risk impact)',
      'Change approval records',
      'Evidence of communication to users/regulators for safety-relevant changes',
      'Use of the problem resolution process (§9) for software problems',
    ],
    whyItMatters: 'Post-release modifications can introduce new hazards. Systematic analysis ensures that every change is evaluated for safety impact before implementation, and that affected parties are informed.',
    tips: [
      'Triage problem reports by severity — safety issues first',
      'Include risk management in every change impact assessment',
      'Document the decision rationale even when the decision is "no change needed"',
      'Track trends in problem reports — recurring issues may indicate a systemic root cause',
      'Consider regulatory reporting obligations (vigilance) for safety-relevant problems',
    ],
    commonPitfalls: [
      'Problem reports are evaluated informally without documentation',
      'Change impact analysis does not consider risk management implications',
      'No process for communicating safety-relevant changes to users',
    ],
    keyDeliverables: ['Problem evaluation records', 'Change impact analyses', 'Change approval records', 'Communication records'],
    relatedClauses: ['IEC 62304 §6.3 (Implementation of Modification)', 'IEC 62304 §9 (Problem Resolution)'],
    safetyClassNote: 'Applicable to all safety classes. Sub-clauses 6.2.1–6.2.3 apply to all; 6.2.4–6.2.5 apply to Class B and C.',
  },

  '6.3': {
    section: '6.3',
    title: 'Implementation of Modification',
    overview: 'Implement approved modifications using the established software development process. Ensure traceability, re-verification, and regression testing of the modified software.',
    expectations: [
      'Evidence that modifications follow the software development process (§5)',
      'Updated documentation (requirements, design, tests) reflecting the change',
      'Re-verification and regression testing results',
      'Updated risk management file if the modification affects safety',
    ],
    whyItMatters: 'Poorly managed modifications are a leading cause of software-related recalls. Using the established development process for modifications ensures the same level of rigour as original development.',
    tips: [
      'Determine the scope of re-verification based on the impact analysis from §6.2',
      'Update all affected documentation — requirements, design, tests, risk files',
      'Regression test areas of the software that could be affected by the change',
      'Update the version number and release documentation',
    ],
    commonPitfalls: [
      'Modifications bypass the development process ("quick fix" culture)',
      'Documentation is not updated to reflect the modification',
      'Insufficient regression testing after the change',
    ],
    keyDeliverables: ['Updated software artifacts', 'Re-verification records', 'Regression test results', 'Updated release documentation'],
    relatedClauses: ['IEC 62304 §5 (Software Development Process)', 'IEC 62304 §6.2 (Problem Analysis)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '7.1': {
    section: '7.1',
    title: 'Analysis of Software Contributing to Hazardous Situations',
    overview: 'Identify software items that could contribute to hazardous situations by analysing how software failures, including SOUP anomalies, could lead to harm. Document all potential causes.',
    expectations: [
      'List of software items that could contribute to hazardous situations',
      'Analysis of potential causes (failure modes, incorrect algorithms, timing issues)',
      'Evaluation of published SOUP anomaly lists for safety-relevant bugs',
      'Documented potential causes with traceability to risk management file',
    ],
    whyItMatters: 'This is the bridge between ISO 14971 risk management and IEC 62304 software safety. You must understand how your software can contribute to harm before you can control those risks.',
    tips: [
      'Use a systematic approach: FMEA, fault tree analysis, or hazard analysis for each software item',
      'Consider not just functional failures but also timing, sequencing, and data integrity issues',
      'Check SOUP vendor websites, release notes, and CVE databases for known anomalies',
      'Involve both software engineers and risk management specialists in this analysis',
    ],
    commonPitfalls: [
      'Only considering obvious failure modes — missing subtle timing or data corruption risks',
      'Not reviewing SOUP anomaly lists (or not being able to find them)',
      'Analysis is too high-level — does not identify specific software items',
    ],
    keyDeliverables: ['Software hazard analysis', 'SOUP anomaly evaluation records', 'Potential cause documentation'],
    relatedClauses: ['IEC 62304 §4.2 (Risk Management)', 'IEC 62304 §7.2 (Risk Control Measures)', 'ISO 14971'],
    safetyClassNote: 'Applicable to Class B and C only. Not required for Class A.',
  },

  '7.2': {
    section: '7.2',
    title: 'Risk Control Measures',
    overview: 'Define software risk control measures for each identified hazardous situation contribution, and verify that these measures are correctly implemented and effective.',
    expectations: [
      'Defined risk control measures for each identified hazard contribution',
      'Traceability from hazards to risk control measures',
      'Verification evidence that risk control measures are implemented correctly',
      'Risk control measures captured as software requirements (link to §5.2)',
    ],
    whyItMatters: 'Risk control measures are the concrete actions that prevent software from contributing to harm. They must be specifically designed, implemented, and verified — not just assumed.',
    tips: [
      'Capture every risk control measure as a software requirement for traceability',
      'Design verification tests that specifically target the risk control function',
      'Consider defence-in-depth: multiple independent risk control measures for high-severity hazards',
      'Include error detection, error handling, and graceful degradation as risk control strategies',
    ],
    commonPitfalls: [
      'Risk control measures are described in the risk file but not in software requirements',
      'No specific verification testing for risk control measures',
      'Risk control measures rely on user behaviour without considering misuse',
    ],
    keyDeliverables: ['Risk control measure definitions', 'Verification records', 'Updated risk management file'],
    relatedClauses: ['IEC 62304 §7.1 (Hazardous Situations)', 'IEC 62304 §7.3 (Verification)', 'IEC 62304 §5.2 (Requirements)'],
    safetyClassNote: 'Applicable to Class B and C only.',
  },

  '7.3': {
    section: '7.3',
    title: 'Verification of Risk Control Measures',
    overview: 'Verify that all defined risk control measures have been correctly implemented and are effective in reducing the identified risks to acceptable levels.',
    expectations: [
      'Verification test results for each risk control measure',
      'Evidence that risk control measures reduce risk as intended',
      'Traceability from risk control measures to verification activities',
    ],
    whyItMatters: 'A risk control measure that is not verified is essentially untested safety protection. Regulators expect objective evidence that every safety control actually works.',
    tips: [
      'Use both positive testing (control works under normal conditions) and negative testing (control activates under fault conditions)',
      'Include boundary condition testing for risk controls',
      'Document the verification method (test, inspection, analysis) for each control measure',
    ],
    commonPitfalls: [
      'Verification only checks that the feature exists, not that it effectively controls risk',
      'No fault injection testing for safety-critical controls',
    ],
    keyDeliverables: ['Risk control verification records', 'Updated risk management file'],
    relatedClauses: ['IEC 62304 §7.2 (Risk Control Measures)', 'ISO 14971 (Verification of Risk Control)'],
    safetyClassNote: 'Applicable to Class B and C only.',
  },

  '7.4': {
    section: '7.4',
    title: 'Risk Management of Software Changes',
    overview: 'When software changes are made, analyse whether the changes introduce new hazards or affect existing risk control measures. Update the risk documentation accordingly.',
    expectations: [
      'Evidence that every software change is evaluated for new hazards',
      'Assessment of impact on existing risk control measures',
      'Updated risk management file when changes affect safety',
    ],
    whyItMatters: 'Software changes can silently break existing risk control measures or introduce new hazardous behaviours. Without systematic change-risk analysis, safety can degrade over time.',
    tips: [
      'Integrate risk analysis into your change control process — every change request should include a risk impact field',
      'Pay special attention to changes in SOUP items — new versions may fix bugs but introduce new ones',
      'Re-verify affected risk control measures after changes',
    ],
    commonPitfalls: [
      'Changes are evaluated for functional impact but not for safety impact',
      'Risk management file is not updated after changes',
      'SOUP updates are not evaluated for new risks',
    ],
    keyDeliverables: ['Change risk analysis records', 'Updated risk management file'],
    relatedClauses: ['IEC 62304 §6.2 (Modification Analysis)', 'IEC 62304 §7.1 (Hazardous Situations)'],
    safetyClassNote: 'Applicable to Class B and C only.',
  },

  '8.1': {
    section: '8.1',
    title: 'Configuration Identification',
    overview: 'Establish a scheme to uniquely identify all software configuration items (source code, documents, tools), SOUP items (with versions), and system configuration documentation.',
    expectations: [
      'A configuration identification scheme (naming, versioning conventions)',
      'A list of all controlled configuration items',
      'SOUP items identified with name, manufacturer, and version',
      'System configuration documentation maintained',
    ],
    whyItMatters: 'Without proper configuration identification, you cannot ensure reproducibility, traceability, or that the correct version of software items is being used in testing and release.',
    tips: [
      'Use a version control system (Git, SVN) and document your branching strategy',
      'Maintain a SOUP inventory with exact version numbers, download sources, and checksums',
      'Include build tools, compilers, and test tools in your configuration items',
      'Define baseline configurations for each release',
    ],
    commonPitfalls: [
      'Not all items are under version control (e.g., test scripts, build configurations)',
      'SOUP items are listed by name only — no version numbers',
      'System configuration (OS version, dependencies) is not documented',
    ],
    keyDeliverables: ['Configuration identification scheme', 'Configuration item list', 'SOUP inventory'],
    relatedClauses: ['IEC 62304 §8.2 (Change Control)', 'IEC 62304 §5.1 (Development Planning)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '8.2': {
    section: '8.2',
    title: 'Change Control',
    overview: 'Control changes to configuration items through a formal process: approve changes before implementation, verify changes after implementation, and maintain traceability of all changes.',
    expectations: [
      'A defined change control process',
      'Change request records with approval signatures',
      'Verification records for implemented changes',
      'Traceability of changes (what changed, why, when, by whom)',
    ],
    whyItMatters: 'Uncontrolled changes are a major source of software defects and regulatory non-conformities. Change control ensures that every modification is intentional, reviewed, and verified.',
    tips: [
      'Use pull requests / merge requests as part of your change control process',
      'Require at least one independent reviewer for safety-critical changes',
      'Link change requests to requirements, defects, or risk items for traceability',
      'Automate change tracking where possible (commit history, CI/CD pipelines)',
    ],
    commonPitfalls: [
      'Changes are made directly to the main branch without review',
      'Change requests exist but are not linked to actual code changes',
      'No post-change verification',
    ],
    keyDeliverables: ['Change control records', 'Change verification records', 'Change history log'],
    relatedClauses: ['IEC 62304 §8.1 (Configuration Identification)', 'IEC 62304 §6.2 (Modification Analysis)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '8.3': {
    section: '8.3',
    title: 'Configuration Status Accounting',
    overview: 'Maintain records of the configuration status of all software items throughout the lifecycle — what version is current, what changes have been made, and what the status of each item is.',
    expectations: [
      'Current status records for all configuration items',
      'History of changes for each configuration item',
      'Ability to determine the configuration of any released version',
    ],
    whyItMatters: 'Configuration status accounting provides the "audit trail" for your software. It enables you to answer: "What exact code was in version X?" — critical for regulatory submissions and incident investigations.',
    tips: [
      'Use your version control system\'s log and tagging features as the basis for status accounting',
      'Maintain a release history document that maps release versions to configuration baselines',
      'Include SOUP version changes in your status accounting',
    ],
    commonPitfalls: [
      'Unable to reconstruct the exact configuration of a past release',
      'Status accounting only covers source code, not documents or SOUP',
    ],
    keyDeliverables: ['Configuration status records', 'Release baseline records'],
    relatedClauses: ['IEC 62304 §8.1 (Configuration Identification)', 'IEC 62304 §5.8 (Software Release)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '9.1': {
    section: '9.1',
    title: 'Prepare Problem Reports',
    overview: 'Create documented problem reports for each identified software problem. Include a description, classification (severity/priority), and the context in which the problem was discovered.',
    expectations: [
      'A problem reporting template or system',
      'Problem reports with unique identifiers, descriptions, severity, and priority',
      'All identified problems are formally reported (not just "fixed quietly")',
    ],
    whyItMatters: 'Formal problem reporting creates a traceable record of all software issues. Without it, problems can be forgotten, fixed without verification, or repeated.',
    tips: [
      'Use a defect tracking system (Jira, Azure DevOps, etc.) as your problem reporting tool',
      'Classify problems by both severity (impact on safety/function) and priority (urgency of resolution)',
      'Include reproducibility information and the software version in each report',
    ],
    commonPitfalls: [
      'Developers fix problems without creating a formal report',
      'Problem reports lack sufficient detail for investigation',
      'No severity/priority classification',
    ],
    keyDeliverables: ['Problem report template', 'Problem reports'],
    relatedClauses: ['IEC 62304 §9.2 (Investigation)', 'IEC 62304 §9.5 (Records)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '9.2': {
    section: '9.2',
    title: 'Investigate the Problem',
    overview: 'Investigate each reported software problem to determine the root cause, scope of impact, and whether it affects patient safety. Prioritise investigation of safety-relevant problems.',
    expectations: [
      'Investigation records for each problem report',
      'Root cause analysis (at least for significant problems)',
      'Safety impact assessment',
      'Determination of affected software versions and configurations',
    ],
    whyItMatters: 'Without investigation, you cannot determine the appropriate response — is this a cosmetic issue or a safety hazard? Root cause analysis prevents recurring problems.',
    tips: [
      'Prioritise safety-relevant problem investigation',
      'Use structured root cause analysis techniques (5 Whys, fishbone diagram)',
      'Determine if the problem affects released software or only development versions',
      'Check if the root cause could affect other parts of the software',
    ],
    commonPitfalls: [
      'Problems are fixed without understanding the root cause',
      'No safety impact assessment',
      'Investigation is superficial for "minor" problems that turn out to be safety-relevant',
    ],
    keyDeliverables: ['Investigation records', 'Root cause analysis', 'Safety impact assessment'],
    relatedClauses: ['IEC 62304 §9.1 (Problem Reports)', 'IEC 62304 §9.3 (Advise Parties)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '9.3': {
    section: '9.3',
    title: 'Advise Relevant Parties',
    overview: 'Notify users, regulatory authorities, and other relevant parties of safety-related software problems. This includes vigilance reporting obligations.',
    expectations: [
      'A process for determining when external notification is required',
      'Records of notifications sent to users and regulators',
      'Timely notification for safety-relevant problems (per regulatory requirements)',
    ],
    whyItMatters: 'Regulatory obligations require timely notification of safety issues. Failure to notify can result in enforcement actions and — more importantly — patients continuing to use unsafe software.',
    tips: [
      'Define clear criteria for what constitutes a "safety-relevant" problem requiring notification',
      'Know your regulatory reporting timelines (e.g., EU MDR vigilance: 15 days for serious incidents)',
      'Maintain a distribution list of affected customers/users',
      'Coordinate with your regulatory affairs team',
    ],
    commonPitfalls: [
      'No defined criteria for when to notify — decisions are ad hoc',
      'Notifications are delayed beyond regulatory timelines',
      'Users of older software versions are not notified',
    ],
    keyDeliverables: ['Notification records', 'Vigilance reports (if applicable)'],
    relatedClauses: ['IEC 62304 §9.2 (Investigation)', 'EU MDR Article 87 (Vigilance)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '9.4': {
    section: '9.4',
    title: 'Use Change Control Process',
    overview: 'Apply the change control process (§8.2) to implement approved corrections for reported software problems. Ensure changes are controlled, traceable, and verified.',
    expectations: [
      'Change control records for problem corrections',
      'Traceability from problem reports to change requests to verified corrections',
      'Verification of corrective changes before release',
    ],
    whyItMatters: 'Fixes for software problems must go through the same controlled process as any other change. Uncontrolled "quick fixes" can introduce new problems.',
    tips: [
      'Link problem reports directly to change control records',
      'Determine the scope of re-verification based on the change impact',
      'Include regression testing in the verification of corrections',
    ],
    commonPitfalls: [
      'Bug fixes bypass change control ("it\'s just a small fix")',
      'No verification of the correction before release',
    ],
    keyDeliverables: ['Change control records', 'Correction verification records'],
    relatedClauses: ['IEC 62304 §8.2 (Change Control)', 'IEC 62304 §9.1 (Problem Reports)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '9.5': {
    section: '9.5',
    title: 'Maintain Records',
    overview: 'Maintain complete records of all software problems, their investigations, resolutions, and any notifications sent. These records must be available for regulatory review.',
    expectations: [
      'Complete problem resolution records from report through closure',
      'Records are maintained and accessible (not lost or scattered)',
      'Records include the full audit trail: report → investigation → decision → correction → verification',
    ],
    whyItMatters: 'Problem resolution records are primary audit evidence. They demonstrate that your organisation identifies, investigates, and resolves software issues systematically.',
    tips: [
      'Use a centralised defect tracking system with enforced workflows',
      'Ensure records cannot be deleted or modified without an audit trail',
      'Periodically review that all problem reports have been dispositioned',
    ],
    commonPitfalls: [
      'Records are spread across emails, chat messages, and ad-hoc documents',
      'Old problem reports are left open indefinitely without disposition',
    ],
    keyDeliverables: ['Problem resolution records', 'Defect tracking database'],
    relatedClauses: ['IEC 62304 §9.1–9.4'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '9.6': {
    section: '9.6',
    title: 'Analyse Problems for Trends',
    overview: 'Analyse software problem reports to identify trends — recurring types of problems, problematic modules, or systemic process issues that need corrective action.',
    expectations: [
      'Periodic trend analysis of software problem reports',
      'Identification of recurring problem patterns',
      'Corrective actions for systemic issues identified through trend analysis',
    ],
    whyItMatters: 'Individual problems may seem unrelated, but trend analysis can reveal underlying process weaknesses, training gaps, or architectural issues that need systemic correction.',
    tips: [
      'Categorise problems by type (functional, performance, interface, etc.), module, and root cause',
      'Perform trend analysis at regular intervals (e.g., quarterly or per release)',
      'Feed trend findings into management review and CAPA processes',
      'Look for patterns in SOUP-related problems — may indicate a need to change SOUP items',
    ],
    commonPitfalls: [
      'No trend analysis is performed — problems are treated purely individually',
      'Trend analysis is performed but findings are not acted upon',
    ],
    keyDeliverables: ['Trend analysis reports', 'Corrective action records'],
    relatedClauses: ['IEC 62304 §9.5 (Records)', 'ISO 13485 §8.4 (Analysis of Data)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '9.7': {
    section: '9.7',
    title: 'Verify Software Problem Resolution',
    overview: 'Verify that each software problem has been resolved correctly and that the resolution does not introduce new problems. This includes testing the fix and performing regression testing.',
    expectations: [
      'Verification records for each problem resolution',
      'Regression testing to ensure no new problems were introduced',
      'Closure of the problem report only after successful verification',
    ],
    whyItMatters: 'An unverified fix may not actually solve the problem — or worse, it may introduce new defects. Verification closes the loop and ensures the resolution is effective.',
    tips: [
      'Define verification criteria before implementing the fix',
      'Test both that the original problem is fixed and that related functionality still works',
      'Automate regression tests to make them feasible for every fix',
    ],
    commonPitfalls: [
      'Problem reports are closed without verification evidence',
      'Verification only checks the specific fix, not regression effects',
    ],
    keyDeliverables: ['Problem resolution verification records', 'Regression test results'],
    relatedClauses: ['IEC 62304 §9.4 (Change Control)', 'IEC 62304 §5.7 (System Testing)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },

  '9.8': {
    section: '9.8',
    title: 'Test Documentation Contents',
    overview: 'Ensure that all test documentation (test plans, procedures, results) contains the required information for regulatory review: test objectives, pass/fail criteria, configuration under test, results, and anomalies.',
    expectations: [
      'Test documents contain: objectives, procedures, pass/fail criteria, environment/configuration, results, anomalies',
      'Test documentation is complete and self-contained for regulatory review',
      'Records identify who performed the test and when',
    ],
    whyItMatters: 'Test documentation is primary evidence for regulatory submissions. Incomplete or poorly structured test records can delay or jeopardise regulatory approval.',
    tips: [
      'Use a test documentation template that covers all required content',
      'Include the exact software version and test environment configuration in every test record',
      'Have test documentation reviewed by someone not involved in the testing',
      'Ensure traceability from test cases to requirements',
    ],
    commonPitfalls: [
      'Test records do not identify the software version tested',
      'Pass/fail criteria are implicit — not stated in the test procedure',
      'Test anomalies are noted but not linked to problem reports',
    ],
    keyDeliverables: ['Test documentation template', 'Complete test records'],
    relatedClauses: ['IEC 62304 §5.5 (Unit Verification)', 'IEC 62304 §5.6 (Integration Testing)', 'IEC 62304 §5.7 (System Testing)'],
    safetyClassNote: 'Applicable to all safety classes (A, B, C).',
  },
};
