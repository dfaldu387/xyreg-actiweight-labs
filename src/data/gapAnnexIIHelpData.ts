/**
 * Detailed contextual help data for MDR Annex II (Technical Documentation) sections.
 * Used by the Help & Guide sidebar when the user is on a gap analysis step.
 */

import type { GapClauseHelp } from './gapAnalysisHelpData';

export const MDR_ANNEX_II_HELP: Record<string, GapClauseHelp> = {
  '1.1': {
    section: '1.1',
    title: 'Device Description and Specification',
    overview: 'This section requires a complete description of the device, including its intended purpose, users, UDI, patient population, principles of operation, risk classification, novel features, accessories, variants, functional elements, materials, and technical specifications. It forms the foundation of the entire Technical Documentation.',
    expectations: [
      'Product/trade name and comprehensive device description',
      'Clearly stated intended purpose aligned with labelling and IFU',
      'Basic UDI-DI assigned and documented with issuing entity',
      'Patient population, indications, contra-indications, and warnings defined',
      'Principles of operation with scientific basis',
      'Risk classification with Annex VIII rule justification',
      'Complete list of functional elements, raw materials, and technical specifications',
    ],
    whyItMatters: 'Section 1.1 is the most detailed section of Annex II and feeds into every other section of the Technical Documentation. Errors or gaps here cascade throughout — the intended purpose drives the clinical evaluation, the risk class determines the conformity assessment route, and the materials list drives biocompatibility assessment.',
    tips: [
      'Start with the intended purpose — everything else flows from it',
      'The Basic UDI-DI must match what is registered with your issuing entity and in EUDAMED',
      'Be specific about patient population: age, weight, medical conditions, severity',
      'For risk classification, cite the specific Annex VIII rule(s) and explain why they apply',
      'Novel features trigger additional clinical evaluation requirements',
      'List ALL software components, including SOUP/third-party libraries',
    ],
    commonPitfalls: [
      'Intended purpose is too vague or does not match the IFU',
      'Missing or incorrect Basic UDI-DI',
      'Risk classification rule not clearly identified or justified',
      'Novel features not identified (impacts clinical evaluation strategy)',
      'Incomplete materials list (impacts biocompatibility assessment)',
    ],
    keyDeliverables: ['Device Description document', 'UDI assignment', 'Risk classification rationale', 'Materials list', 'Technical specifications'],
    relatedClauses: ['MDR Article 2(1) — Device definition', 'MDR Annex VIII — Classification rules', 'MDR Annex VI Part C — UDI'],
  },

  '1.2': {
    section: '1.2',
    title: 'Reference to Previous and Similar Generations',
    overview: 'Identify previous generations of the device and similar devices on EU/international markets. This supports clinical evaluation through equivalence assessment and demonstrates awareness of the state of the art.',
    expectations: [
      'Previous device generations documented with key changes',
      'Similar/equivalent devices identified (same and other manufacturers)',
      'Technical, biological, and clinical comparison with equivalent devices',
    ],
    whyItMatters: 'This section directly feeds the clinical evaluation. Demonstrating equivalence to a well-established device can reduce the need for clinical investigations. Without this analysis, Notified Bodies may require more extensive clinical data.',
    tips: [
      'For each predecessor, document what changed and why',
      'For equivalent devices, compare: intended purpose, technical characteristics, and biological characteristics',
      'Reference MDCG 2020-5 for guidance on clinical evaluation of equivalence',
    ],
    commonPitfalls: [
      'Claiming equivalence without sufficient technical/biological/clinical justification',
      'Not identifying predecessor devices from your own product line',
      'Incomplete comparison with competitor devices',
    ],
    keyDeliverables: ['Predecessor device history', 'Equivalence assessment', 'State of the art review'],
    relatedClauses: ['MDR Annex XIV Part A — Clinical evaluation', 'MDCG 2020-5 — Equivalence'],
  },

  '2': {
    section: '2',
    title: 'Information Supplied by the Manufacturer',
    overview: 'Include all labelling and Instructions for Use (IFU) in all required languages. Labels and IFU must comply with MDR Annex I Chapter III (§23). This section demonstrates that users receive adequate information for safe and effective use.',
    expectations: [
      'Complete label artwork with all required elements per §23',
      'Complete IFU addressing all requirements of §23.4',
      'All required language versions provided',
      'Symbols compliant with EN ISO 15223-1',
    ],
    whyItMatters: 'Labelling is one of the most scrutinised areas by Notified Bodies. Incorrect or incomplete labelling can delay or prevent CE marking. It is also a common source of regulatory actions post-market.',
    tips: [
      'Use the EN ISO 15223-1 symbol library rather than custom symbols',
      'Include the UDI carrier on the label per Annex VI',
      'The IFU must include: intended purpose, contraindications, warnings, cleaning/sterilization instructions',
      'Verify label content against the MDR §23 checklist systematically',
    ],
    commonPitfalls: [
      'Missing required label elements (e.g., UDI, CE mark with NB number, lot/serial)',
      'IFU not available in all required languages for target markets',
      'Using non-standard symbols without explanation',
      'Label content inconsistent with the intended purpose stated in Section 1.1',
    ],
    keyDeliverables: ['Label artwork', 'Instructions for Use', 'Language translation records', 'Symbols compliance checklist'],
    relatedClauses: ['MDR Annex I §23 — Labelling', 'EN ISO 15223-1 — Medical device symbols', 'MDR Annex VI — UDI'],
  },

  '3.1': {
    section: '3.1',
    title: 'Design Information',
    overview: 'Provide information that allows understanding of the design stages applied to the device, including the design and development plan, design specifications, drawings, and schematics.',
    expectations: [
      'Design & Development Plan per ISO 13485 §7.3',
      'Design stages from concept through design transfer documented',
      'Complete design specifications with acceptance criteria',
      'Design drawings, schematics, and component specifications',
    ],
    whyItMatters: 'Design information demonstrates that the device was developed under a controlled design process. It provides the traceability from user needs through design inputs, design outputs, and design verification/validation.',
    tips: [
      'Reference your ISO 13485 design control process',
      'Include key design review records showing milestone approvals',
      'Ensure design specifications trace to user needs and risk control measures',
      'Include software architecture diagrams if the device contains software',
    ],
    keyDeliverables: ['Design & Development Plan', 'Design specifications', 'Drawings and schematics', 'Design review records'],
    relatedClauses: ['ISO 13485 §7.3 — Design and development', 'MDR Annex II §3.2 — Manufacturing'],
  },

  '3.2': {
    section: '3.2',
    title: 'Manufacturing Information',
    overview: 'Provide details on manufacturing processes (including sterilization, assembly, and testing) and identify all manufacturing sites, suppliers, and sub-contractors.',
    expectations: [
      'Process flow diagrams for manufacturing',
      'Validation of special processes (e.g., sterilization, welding, sealing)',
      'Complete list of manufacturing sites with scope of activities',
      'Critical suppliers and sub-contractors identified with qualification status',
    ],
    whyItMatters: 'Notified Bodies audit manufacturing sites and may require access to key suppliers. Unvalidated manufacturing processes or unqualified suppliers are major non-conformities.',
    tips: [
      'Include IQ/OQ/PQ references for validated processes',
      'Ensure manufacturing site list matches the QMS scope',
      'Document supplier qualification status and any quality agreements',
      'Special processes (per ISO 13485 §7.5.6) MUST be validated',
    ],
    commonPitfalls: [
      'Missing or incomplete process validation for special processes',
      'Supplier list does not include all critical suppliers',
      'Manufacturing site scope does not match QMS certificate scope',
    ],
    keyDeliverables: ['Process flow diagrams', 'Process validation records', 'Manufacturing site list', 'Supplier qualification records'],
    relatedClauses: ['ISO 13485 §7.5 — Production and service provision', 'ISO 13485 §7.4 — Purchasing'],
  },

  '4': {
    section: '4',
    title: 'General Safety and Performance Requirements (GSPR)',
    overview: 'Demonstrate conformity with each applicable GSPR from MDR Annex I. For each requirement, identify: whether it applies, the method of conformity demonstration, the harmonised standards or common specifications used, and the controlled documents providing evidence.',
    expectations: [
      'GSPR checklist addressing every requirement in Annex I',
      'Non-applicable GSPRs justified with rationale',
      'Methods of conformity demonstration identified for each applicable GSPR',
      'Harmonised standards and common specifications referenced',
      'Traceability matrix mapping GSPRs to evidence documents',
    ],
    whyItMatters: 'The GSPR checklist is the central compliance document of the Technical Documentation. It demonstrates that every safety and performance requirement has been considered and addressed. Notified Bodies review this systematically.',
    tips: [
      'Use a structured GSPR checklist template — do not rely on free-form text',
      'For each applicable GSPR, reference specific controlled document(s) with version and date',
      'Harmonised standards provide a "presumption of conformity" — leverage them',
      'The traceability matrix should enable an auditor to find evidence for any GSPR in under 2 minutes',
    ],
    commonPitfalls: [
      'GSPR checklist incomplete — some Annex I requirements not addressed',
      'Non-applicable justifications are vague or missing',
      'Evidence documents referenced but not version-controlled',
      'Traceability matrix does not point to specific sections within documents',
    ],
    keyDeliverables: ['GSPR checklist', 'Conformity methods documentation', 'Standards compliance matrix', 'GSPR-to-evidence traceability matrix'],
    relatedClauses: ['MDR Annex I — General Safety and Performance Requirements', 'MDR Article 9 — Common Specifications'],
  },

  '5': {
    section: '5',
    title: 'Benefit-Risk Analysis and Risk Management',
    overview: 'Provide the benefit-risk analysis (per Annex I Sections 1 and 8) and the solutions adopted through risk management (per Annex I Section 3). Demonstrate that residual risks are acceptable when weighed against the intended clinical benefits.',
    expectations: [
      'Benefit-risk analysis per ISO 14971',
      'Risk Management File including plan, hazard analysis, and risk management report',
      'Clinical benefits clearly articulated and supported by evidence',
      'Overall residual risk demonstrated to be acceptable',
    ],
    whyItMatters: 'The benefit-risk analysis is a regulatory requirement and forms a key part of the clinical evaluation. It must demonstrate that the known and foreseeable risks are outweighed by the clinical benefits.',
    tips: [
      'Link the benefit-risk analysis to your Clinical Evaluation Report',
      'Use ISO 14971 as the framework — reference specific sections',
      'Quantify clinical benefits where possible (e.g., clinical outcome data)',
      'Address each residual risk individually AND provide an overall residual risk assessment',
    ],
    commonPitfalls: [
      'Benefits are stated without supporting clinical evidence',
      'Overall residual risk not explicitly evaluated',
      'Risk Management Report does not conclude with a clear benefit-risk determination',
    ],
    keyDeliverables: ['Benefit-Risk Analysis', 'Risk Management Plan', 'Risk Management Report', 'FMEA/FTA/Hazard Analysis'],
    relatedClauses: ['ISO 14971:2019', 'MDR Annex I §1 and §8', 'MDR Annex II §6.1(d) — CER'],
  },

  '6.1': {
    section: '6.1',
    title: 'Product Verification and Validation',
    overview: 'Provide all pre-clinical and clinical evidence: test results (biocompatibility, electrical safety, performance), sterilization validation, software V&V, Clinical Evaluation Report, and PMCF plan/report.',
    expectations: [
      'Pre-clinical test reports covering all relevant standards',
      'Biocompatibility evaluation per ISO 10993',
      'Sterilization validation (if applicable) and shelf-life testing',
      'Software verification and validation per IEC 62304',
      'Clinical Evaluation Report per Annex XIV Part A',
      'PMCF plan and evaluation report per Annex XIV Part B',
    ],
    whyItMatters: 'This is the most evidence-intensive section of Annex II. It must demonstrate that the device is safe and performs as intended through objective test data, biocompatibility data, clinical data, and ongoing clinical follow-up.',
    tips: [
      'Organize test reports by standard (e.g., IEC 60601-1 testing, ISO 10993 biocompatibility)',
      'The CER must be updated at least annually or when significant new data is available',
      'PMCF is almost always required — justify carefully if you claim it is not applicable',
      'For software devices, reference your IEC 62304 gap analysis and V&V documentation',
    ],
    commonPitfalls: [
      'Test reports do not cover all applicable standards',
      'CER is outdated or does not follow MEDDEV 2.7/1 Rev.4 / MDR Annex XIV structure',
      'PMCF plan is missing or too generic',
      'Software V&V evidence is incomplete',
    ],
    keyDeliverables: ['Pre-clinical test reports', 'Biocompatibility evaluation', 'Sterilization validation', 'Software V&V documentation', 'CER', 'PMCF plan and report'],
    relatedClauses: ['ISO 10993 series', 'IEC 62304', 'MDR Annex XIV', 'MEDDEV 2.7/1 Rev.4'],
  },

  '6.2': {
    section: '6.2',
    title: 'Additional Information in Specific Cases',
    overview: 'This section applies only if the device falls into specific categories: incorporating a medicinal substance, using tissues/cells of human or animal origin, containing CMR/endocrine-disrupting substances, composed of absorbable substances, having a measuring function, or connected to other devices.',
    expectations: [
      'Determination of which specific cases apply',
      'For each applicable case, the required additional evidence provided',
      'For non-applicable cases, documented justification',
    ],
    whyItMatters: 'These specific cases trigger additional regulatory requirements including, in some cases, opinions from medicines authorities or specific notified body procedures.',
    tips: [
      'Most of these sub-sections will be "not applicable" — document that clearly',
      'If your device connects to other devices, you MUST address interoperability and data integrity',
      'Devices with a measuring function must meet metrological traceability requirements',
    ],
    keyDeliverables: ['Applicability determination', 'Additional evidence per applicable case'],
    relatedClauses: ['MDR Article 1(8) — Drug-device combinations', 'MDR Annex XVI — Non-medical devices'],
  },

  '7': {
    section: '7',
    title: 'Post-Market Surveillance',
    overview: 'Document the post-market surveillance (PMS) system, including the PMS plan, periodic safety update reports (PSUR), and processes for collecting and evaluating post-market data.',
    expectations: [
      'PMS Plan per MDR Article 84',
      'PSUR for Class IIa, IIb, and III devices (per MDR Article 86)',
      'PMS Report for Class I devices (per MDR Article 85)',
      'Process for collecting complaints, vigilance data, and literature',
      'Feedback loop to risk management, clinical evaluation, and design',
    ],
    whyItMatters: 'PMS is a continuous obligation under the MDR. The PMS system must proactively collect data to confirm continued safety and performance, and feed into CER updates, PMCF, and risk management updates.',
    tips: [
      'The PMS Plan should define: data sources, collection methods, analysis methods, and update triggers',
      'PSURs are required at least annually for Class III and at least every 2 years for Class IIa/IIb',
      'Ensure PMS data feeds back into the CER, risk management file, and PMCF',
      'Include complaint handling, vigilance reporting, and trend analysis in your PMS plan',
    ],
    commonPitfalls: [
      'PMS Plan is generic and does not specify data sources or analysis methods',
      'PSUR/PMS Report does not include conclusions on continued safety and performance',
      'No documented feedback loop from PMS to design and risk management',
    ],
    keyDeliverables: ['PMS Plan', 'PSUR or PMS Report', 'Complaint trend analysis', 'Vigilance reporting records'],
    relatedClauses: ['MDR Articles 83-86', 'MDR Annex III — PMS Plan', 'MDR Annex XIV Part B — PMCF'],
  },
};
