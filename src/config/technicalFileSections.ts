import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export interface TFSubItem {
  letter: string;
  description: string;
  requirement: string;
  guidance: string;
  helpText: string;
}

export interface TFSectionItem extends Omit<GenericSectionItem, 'subItems'> {
  subItems: TFSubItem[];
}

/**
 * Technical File sections mapped to the GenericGapLaunchView format.
 * Each section corresponds to a TF-x section from TECHNICAL_FILE_SECTIONS in designReview.ts.
 * The `section` field matches the TF id (e.g. 'TF-0').
 */
export const TECHNICAL_FILE_GUIDED_SECTIONS: TFSectionItem[] = [
  // Group 1: Administrative
  {
    section: 'TF-0',
    title: 'Administrative',
    description: 'Certificates, DoC, Basic UDI-DI — EU Declaration of Conformity, NB certificates, and general device identification per MDR Art. 10 & 19.',
    sectionGroup: 1,
    sectionGroupName: 'Administrative',
    type: 'evidence',
    subItems: [
      {
        letter: 'a',
        description: 'EU Declaration of Conformity (DoC)',
        requirement: 'The manufacturer shall draw up and keep up to date an EU declaration of conformity for each device (MDR Art. 19).',
        guidance: 'Include device identification, manufacturer details, classification rule, conformity assessment procedure, NB reference (if applicable), and signature of authorised person. Use template per Annex IV.',
        helpText: 'The EU Declaration of Conformity is a legally binding document where you declare your device meets all applicable MDR requirements. It must be signed by an authorised person and kept up to date throughout the device lifecycle.',
      },
      {
        letter: 'b',
        description: 'Notified Body certificates',
        requirement: 'Where a conformity assessment procedure requires involvement of a Notified Body, the relevant certificates shall be included (MDR Art. 56).',
        guidance: 'Include the EU Type-Examination certificate, QMS certificate, or Technical Documentation Assessment certificate as applicable to your device class.',
        helpText: 'Notified Body certificates prove that an independent third-party organisation has assessed your device or QMS. Required for Class Is (sterile/measuring), IIa, IIb, and III devices.',
      },
      {
        letter: 'c',
        description: 'Basic UDI-DI / EUDAMED registration',
        requirement: 'The manufacturer shall assign a Basic UDI-DI and register the device in EUDAMED before placing it on the market (MDR Art. 29).',
        guidance: 'Provide the Basic UDI-DI, issuing agency (e.g. GS1), and evidence of EUDAMED submission or registration confirmation.',
        helpText: 'The Basic UDI-DI is a unique identifier for your device model in the EUDAMED database. It groups all UDI-DIs for the same device and is essential for EU market traceability.',
      },
      {
        letter: 'd',
        description: 'Economic operator information (Art. 10/11/13/14)',
        requirement: 'Identify the manufacturer, authorised representative, importers, and distributors involved in the supply chain (MDR Art. 10–14).',
        guidance: 'Include names, addresses, SRN numbers, and roles of all economic operators. Ensure the Authorised Representative mandate letter is on file.',
        helpText: 'Economic operators are all parties in the device supply chain. Each has specific MDR obligations. The SRN (Single Registration Number) uniquely identifies each operator in EUDAMED.',
      },
      {
        letter: 'e',
        description: 'Person Responsible for Regulatory Compliance (PRRC)',
        requirement: 'The manufacturer shall have at least one PRRC with the required expertise available within the organisation (MDR Art. 15).',
        guidance: 'Provide the name, qualifications, and evidence of expertise of the designated PRRC. Document their responsibilities and organisational reporting line.',
        helpText: 'The PRRC is a mandatory role under MDR Art. 15. This person ensures regulatory compliance across your organisation — they must have proven expertise in regulatory affairs or quality management for medical devices.',
      },
    ],
  },

  // Group 2: Technical Documentation (Annex II §1–§6)
  {
    section: 'TF-1',
    title: 'Device Description & Specification',
    description: 'Device variants, accessories, and UDI-DI per MDR Annex II §1.',
    sectionGroup: 2,
    sectionGroupName: 'Technical Documentation',
    type: 'evidence',
    subItems: [
      {
        letter: 'a',
        description: 'Device name, variants, and accessories',
        requirement: 'A description of the device including variants, accessories, its intended purpose, and the patient population (MDR Annex II §1.1(a)).',
        guidance: 'List the product/trade name, all variants and configurations, and any accessories sold with or intended to be used with the device.',
        helpText: 'This is the foundation of your technical file — clearly identify every variant and accessory. Auditors check that all configurations are covered by your risk analysis and clinical evaluation.',
      },
      {
        letter: 'b',
        description: 'Intended purpose and indications',
        requirement: 'The intended purpose of the device including precise medical indications, the condition to be diagnosed/treated, and target patient population (MDR Annex II §1.1(b)).',
        guidance: 'Clearly state what the device is intended to do, for which medical condition, and any contraindications. This drives classification and clinical evaluation scope.',
        helpText: 'The intended purpose defines the regulatory scope of your device. Getting this wrong can affect classification, clinical evaluation requirements, and post-market obligations. Be precise and avoid over-claiming.',
      },
      {
        letter: 'c',
        description: 'Patient population and intended users',
        requirement: 'Description of the patient population and intended users of the device (MDR Annex II §1.1(c)).',
        guidance: 'Specify age groups, clinical conditions, and whether the device is intended for professional healthcare providers, lay users, or both.',
        helpText: 'Distinguishing between professional users and lay users impacts IFU requirements, usability testing needs, and risk assessment. Include age ranges, conditions, and any vulnerable populations.',
      },
      {
        letter: 'd',
        description: 'Principles of operation',
        requirement: 'An explanation of the principles of operation and scientific rationale (MDR Annex II §1.1(d)).',
        guidance: 'Describe the mechanism of action, mode of operation, and the scientific principles underlying the device\'s function.',
        helpText: 'Explain how the device works at a scientific level. This connects to your clinical evaluation — the mechanism of action must be supported by clinical evidence.',
      },
      {
        letter: 'e',
        description: 'Device classification and applicable rules',
        requirement: 'Risk class of the device and the classification rule(s) applied in accordance with Annex VIII (MDR Annex II §1.1(e)).',
        guidance: 'State the risk class (I, IIa, IIb, III) and cite the specific classification rule(s) from Annex VIII. Justify the classification with rationale.',
        helpText: 'Classification determines everything: conformity assessment route, Notified Body involvement, clinical evidence requirements, and PMS obligations. Always cite the specific Annex VIII rule number.',
      },
      {
        letter: 'f',
        description: 'Reference to previous/similar generations',
        requirement: 'Reference to any previous and similar generations of the device (MDR Annex II §1.1(f)).',
        guidance: 'Identify predecessor devices, competitive equivalents, or predicate devices. Summarise key changes from previous generations.',
        helpText: 'Documenting device history helps demonstrate design maturity and supports equivalence claims in your clinical evaluation. Include version history and key design changes.',
      },
    ],
  },
  {
    section: 'TF-2',
    title: 'Information Supplied by Manufacturer',
    description: 'Labels, IFU, and required language translations per MDR Annex II §2.',
    sectionGroup: 2,
    sectionGroupName: 'Technical Documentation',
    type: 'evidence',
    subItems: [
      {
        letter: 'a',
        description: 'Label content and artwork',
        requirement: 'The label shall bear the information set out in MDR Annex I, Chapter III, Section 23.2.',
        guidance: 'Include final label artwork with UDI carrier, CE mark, device name, manufacturer details, lot/serial number, and all mandatory symbols per EN ISO 15223-1.',
        helpText: 'Labels must include all mandatory symbols from ISO 15223-1 and the UDI carrier (barcode). Auditors frequently check label artwork against Annex I §23.2 requirements — ensure nothing is missing.',
      },
      {
        letter: 'b',
        description: 'Instructions for Use (IFU)',
        requirement: 'Instructions for use shall contain the information set out in Annex I, Section 23.4 (MDR Annex II §2).',
        guidance: 'Provide the complete IFU covering intended purpose, warnings, contraindications, installation, use, maintenance, and disposal instructions.',
        helpText: 'The IFU is one of the most scrutinised documents. It must match your intended purpose, cover all warnings from risk analysis, and be validated for usability with your target user population.',
      },
      {
        letter: 'c',
        description: 'Language translations for target markets',
        requirement: 'Labels and IFU shall be provided in the official language(s) of the Member State where the device is made available (MDR Art. 10(11)).',
        guidance: 'Include translations for all target market languages. Confirm linguistic validation process for critical safety information.',
        helpText: 'Each EU Member State requires labels and IFU in its official language(s). Linguistic validation ensures translations are accurate — especially for safety-critical warnings and instructions.',
      },
      {
        letter: 'd',
        description: 'Packaging and shipping markings',
        requirement: 'Outer packaging and shipping containers shall include required identification and handling information.',
        guidance: 'Document packaging specifications, transport markings, and any special handling or storage symbols required.',
        helpText: 'Packaging must protect the device during transport and include mandatory markings (UDI, storage conditions, handling symbols). Consider accelerated ageing validation for packaging integrity.',
      },
    ],
  },
  {
    section: 'TF-3',
    title: 'Design & Manufacturing Information',
    description: 'Drawings, process descriptions, and site information per MDR Annex II §3.',
    sectionGroup: 2,
    sectionGroupName: 'Technical Documentation',
    type: 'evidence',
    subItems: [
      {
        letter: 'a',
        description: 'Design and manufacturing process descriptions',
        requirement: 'Information to allow an adequate understanding of the design stages and the manufacturing of the device (MDR Annex II §3.1).',
        guidance: 'Provide process flow diagrams, key manufacturing steps, in-process controls, and process validation records.',
        helpText: 'Manufacturing process descriptions show auditors you understand and control how your device is made. Include process flow diagrams, critical process parameters, and in-process controls.',
      },
      {
        letter: 'b',
        description: 'Manufacturing site information',
        requirement: 'Type and extent of manufacturing, including outsourced processes and critical subcontractors (MDR Annex II §3.2).',
        guidance: 'List all manufacturing sites, their addresses, scope of activities, and any applicable ISO 13485 certificates.',
        helpText: 'Every manufacturing site must be identified and its scope documented. Notified Bodies audit manufacturing sites — ensure all locations (including subcontractors) are declared.',
      },
      {
        letter: 'c',
        description: 'Qualified suppliers and subcontractors',
        requirement: 'Information on qualified suppliers and subcontractors including their qualification status.',
        guidance: 'Provide a supplier list with qualification status, critical component designation, and supplier audit schedule.',
        helpText: 'Under ISO 13485, you must qualify suppliers of critical components and services. Maintain an approved supplier list with qualification evidence and audit records.',
      },
      {
        letter: 'd',
        description: 'Design drawings and specifications',
        requirement: 'Complete sets of design drawings, component specifications, and sub-assembly specifications.',
        guidance: 'Include mechanical drawings, PCB layouts (if applicable), material specifications, and tolerance requirements.',
        helpText: 'Design drawings define what the device is. Include all mechanical drawings, electrical schematics, software architecture diagrams, and material specifications with revision control.',
      },
      {
        letter: 'e',
        description: 'Bill of materials (raw materials and components)',
        requirement: 'Complete bill of materials identifying all raw materials and components used in manufacturing.',
        guidance: 'Provide the BOM with part numbers, suppliers, material specifications, and identification of critical components and patient-contacting materials.',
        helpText: 'The BOM must identify all materials, especially patient-contacting ones that trigger biocompatibility assessment. Flag critical components and track supplier qualification status.',
      },
    ],
  },
  {
    section: 'TF-4',
    title: 'General Safety & Performance Requirements',
    description: 'GSPR checklist demonstrating conformity with Annex I per MDR Annex II §4.',
    sectionGroup: 2,
    sectionGroupName: 'Technical Documentation',
    type: 'evidence',
    subItems: [
      {
        letter: 'a',
        description: 'GSPR checklist (Annex I)',
        requirement: 'Demonstration of conformity with the applicable GSPRs set out in Annex I, including justification for any not applied (MDR Annex II §4).',
        guidance: 'Complete the GSPR checklist addressing each requirement of Annex I Chapters I–III. For each GSPR, state whether it applies, the method used to demonstrate conformity, and the reference to supporting evidence.',
        helpText: 'GSPRs (General Safety and Performance Requirements) are the core safety requirements in MDR Annex I. Your GSPR checklist is the master cross-reference linking every requirement to your supporting evidence.',
      },
      {
        letter: 'b',
        description: 'Applicable harmonised standards list',
        requirement: 'List of harmonised standards applied in full or in part, and description of the solutions adopted for those not covered by harmonised standards.',
        guidance: 'Provide a table listing each applied standard with its version, scope of application, and whether applied in full or part.',
        helpText: 'Harmonised standards provide a "presumption of conformity" with GSPRs. List each standard you apply, its version, and whether applied fully or partially — partial application requires justification.',
      },
      {
        letter: 'c',
        description: 'Common specifications applied',
        requirement: 'Identification of any Common Specifications (CS) applied and justification if CS are not followed.',
        guidance: 'List any applicable CS and state whether they have been followed. If deviated from, provide rationale and alternative solutions.',
        helpText: 'Common Specifications are mandatory unless you can justify equivalent safety/performance via alternative means. Unlike harmonised standards, deviation from CS requires explicit justification.',
      },
      {
        letter: 'd',
        description: 'Cross-references to supporting evidence',
        requirement: 'Cross-references from each GSPR to the relevant documentation providing evidence of conformity.',
        guidance: 'Ensure the GSPR checklist has clear cross-references (by document ID or section) to test reports, risk analysis, clinical evaluation, and other supporting documents.',
        helpText: 'The GSPR checklist must trace each requirement to specific evidence (test reports, clinical data, risk analysis). This traceability is a key audit focus — every claim needs documented proof.',
      },
    ],
  },
  {
    section: 'TF-5',
    title: 'Benefit-Risk Analysis & Risk Management',
    description: 'Risk management file and benefit-risk analysis per MDR Annex II §5.',
    sectionGroup: 2,
    sectionGroupName: 'Technical Documentation',
    type: 'evidence',
    subItems: [
      {
        letter: 'a',
        description: 'Risk management plan (ISO 14971)',
        requirement: 'The risk management plan in accordance with ISO 14971 including scope, responsibilities, and risk acceptability criteria (MDR Annex II §5).',
        guidance: 'Document the planned risk management activities, risk acceptability matrix, and criteria for the overall residual risk assessment.',
        helpText: 'The risk management plan defines your approach before analysis begins. It sets severity/probability scales, acceptability criteria, and assigns responsibilities. This is the foundation of your risk file.',
      },
      {
        letter: 'b',
        description: 'Hazard identification and risk estimation',
        requirement: 'Systematic identification of hazards and hazardous situations, and estimation of associated risks.',
        guidance: 'Use FMEA, FTA, or HAZOP techniques. Document each identified hazard with its cause, harm, severity, and probability.',
        helpText: 'Use structured techniques (FMEA, FTA, HAZOP) to systematically identify hazards. Consider normal use, foreseeable misuse, and failure scenarios. Each hazard needs severity and probability estimation.',
      },
      {
        letter: 'c',
        description: 'Risk evaluation and risk control measures',
        requirement: 'Risk evaluation against acceptability criteria and implementation of risk control measures.',
        guidance: 'For each unacceptable risk, document the risk control measure, implementation evidence, and verification of effectiveness.',
        helpText: 'Apply the ISO 14971 hierarchy: eliminate hazard → protective measures → information for safety. Document verification that each control measure works and doesn\'t introduce new risks.',
      },
      {
        letter: 'd',
        description: 'Overall residual risk evaluation',
        requirement: 'Evaluation of the overall residual risk after all risk control measures are implemented.',
        guidance: 'Provide a summary assessment of whether the overall residual risk is acceptable, considering the cumulative effect of all residual risks.',
        helpText: 'Even if individual residual risks are acceptable, their cumulative effect might not be. This holistic assessment considers all residual risks together against the device\'s clinical benefits.',
      },
      {
        letter: 'e',
        description: 'Benefit-risk determination',
        requirement: 'The benefit-risk analysis shall demonstrate that the residual risks are acceptable when weighed against the benefits (MDR Art. 2(24)).',
        guidance: 'Document the clinical benefits, the residual risks, and the rationale for why the benefit-risk ratio is favourable for the intended patient population.',
        helpText: 'MDR requires explicit benefit-risk analysis. Link clinical benefits (from your CER) against residual risks. For higher-risk devices, this analysis must be more rigorous and detailed.',
      },
      {
        letter: 'f',
        description: 'Risk management report',
        requirement: 'A risk management report summarising the results of the risk management process.',
        guidance: 'The report shall confirm that the risk management plan was executed, all identified risks are controlled, and the overall residual risk is acceptable.',
        helpText: 'The risk management report is the final sign-off document. It confirms that all planned activities were completed, all risks are controlled, and overall residual risk is acceptable.',
      },
    ],
  },
  {
    section: 'TF-6',
    title: 'Product Verification & Validation',
    description: 'Pre-clinical data, biocompatibility, software validation, and CER per MDR Annex II §6.',
    sectionGroup: 2,
    sectionGroupName: 'Technical Documentation',
    type: 'evidence',
    subItems: [
      {
        letter: 'a',
        description: 'Pre-clinical studies (bench testing)',
        requirement: 'Results of pre-clinical testing including laboratory tests, simulated use tests, and engineering evaluations (MDR Annex II §6.1).',
        guidance: 'Include test protocols, acceptance criteria, test results, and conclusions for all bench/laboratory testing performed.',
        helpText: 'Pre-clinical bench testing verifies device performance without patients. Include all test protocols, acceptance criteria, and results. Tests should trace back to your design input requirements.',
      },
      {
        letter: 'b',
        description: 'Biocompatibility evaluation (ISO 10993)',
        requirement: 'Biocompatibility evaluation per ISO 10993-1 for all patient-contacting materials (MDR Annex II §6.1).',
        guidance: 'Provide the biological evaluation plan, material characterisation, and test reports (or justification for not testing) per the ISO 10993 series.',
        helpText: 'ISO 10993-1 requires biological evaluation of all patient-contacting materials. Start with material characterisation — you may be able to justify reduced testing based on established material history.',
      },
      {
        letter: 'c',
        description: 'Electrical safety and EMC testing',
        requirement: 'Electrical safety and electromagnetic compatibility test results for electro-medical devices (IEC 60601-1, IEC 60601-1-2).',
        guidance: 'Include test reports from accredited labs demonstrating compliance with applicable electrical safety and EMC standards.',
        helpText: 'Electrical medical devices must comply with IEC 60601-1 (safety) and IEC 60601-1-2 (EMC). Testing must be performed by accredited laboratories. Include all applicable collateral and particular standards.',
      },
      {
        letter: 'd',
        description: 'Software verification and validation (IEC 62304)',
        requirement: 'Software lifecycle documentation including verification and validation per IEC 62304 (MDR Annex II §6.1).',
        guidance: 'Provide software classification, architecture, unit/integration/system test results, and validation against user needs.',
        helpText: 'IEC 62304 defines software lifecycle requirements based on safety class (A, B, C). Higher classes require more rigorous documentation. Include software architecture, SOUP list, and all V&V test results.',
      },
      {
        letter: 'e',
        description: 'Sterilisation validation',
        requirement: 'Sterilisation validation per appropriate standards (e.g., ISO 11135, ISO 11137) for devices supplied sterile.',
        guidance: 'Include validation protocols, results, parametric release criteria, and ongoing sterility assurance documentation.',
        helpText: 'Devices supplied sterile need validated sterilisation processes. The validation standard depends on the method (EtO → ISO 11135, radiation → ISO 11137, moist heat → ISO 17665).',
      },
      {
        letter: 'f',
        description: 'Shelf-life / transport studies',
        requirement: 'Accelerated and/or real-time ageing studies and transport simulation testing.',
        guidance: 'Document packaging validation, ageing protocols, environmental conditioning, and test results demonstrating that the device maintains safety and performance throughout its shelf life.',
        helpText: 'Shelf-life studies prove your device remains safe and effective until its expiry date. Accelerated ageing (ASTM F1980) gives early results, but real-time ageing data is ultimately required.',
      },
      {
        letter: 'g',
        description: 'Clinical evaluation report (CER)',
        requirement: 'Clinical evaluation and its documentation including the clinical evaluation report and clinical evaluation plan (MDR Annex II §6.1(b)).',
        guidance: 'The CER shall be based on a systematic literature review, equivalent device analysis, and/or clinical investigation data per MEDDEV 2.7/1 rev. 4 methodology.',
        helpText: 'The CER synthesises all clinical evidence to confirm safety and performance. Follow MEDDEV 2.7/1 rev. 4 methodology. It must be updated at least annually and after significant PMS findings.',
      },
    ],
  },

  // Group 3: Supporting Evidence
  {
    section: 'TF-7',
    title: 'Risk Management',
    description: 'FMEA, risk/benefit analysis per MDR Annex I & ISO 14971.',
    sectionGroup: 3,
    sectionGroupName: 'Supporting Evidence',
    type: 'evidence',
    subItems: [
      {
        letter: 'a',
        description: 'FMEA / fault tree analysis',
        requirement: 'Systematic risk analysis using recognised techniques such as FMEA, FTA, or HAZOP (ISO 14971 §5).',
        guidance: 'Provide the completed FMEA/FTA documents with all identified failure modes, causes, effects, severity, occurrence, and detection ratings.',
        helpText: 'FMEA (Failure Mode and Effects Analysis) systematically examines potential failures. Each failure mode gets severity, occurrence, and detection scores. High-risk items need documented risk controls.',
      },
      {
        letter: 'b',
        description: 'Risk/benefit analysis summary',
        requirement: 'Summary of the benefit-risk analysis demonstrating acceptability of residual risks (MDR Annex I §1–8).',
        guidance: 'Cross-reference the risk management file (TF-5) and provide a concise summary of the overall benefit-risk determination.',
        helpText: 'This summary ties together your risk management and clinical evaluation. It must demonstrate that residual risks are outweighed by clinical benefits for the intended patient population.',
      },
      {
        letter: 'c',
        description: 'Production and post-production risk monitoring',
        requirement: 'Procedures for monitoring risks during production and post-production phases (ISO 14971 §10).',
        guidance: 'Document how production quality data, complaint data, and vigilance information feed back into the risk management process.',
        helpText: 'Risk management doesn\'t end at market launch. You must monitor production data, complaints, and incidents to detect new or changed risks and update your risk file accordingly.',
      },
      {
        letter: 'd',
        description: 'Risk management file completeness review',
        requirement: 'Review of the risk management file for completeness and consistency (ISO 14971 §9).',
        guidance: 'Provide evidence that the risk management file has been reviewed by qualified personnel and that all planned activities have been completed.',
        helpText: 'The completeness review is a formal sign-off confirming every planned risk activity was completed. It should be performed by qualified personnel independent of the risk analysis team.',
      },
    ],
  },
  {
    section: 'TF-8',
    title: 'Clinical',
    description: 'CER, literature search, PMCF evaluation per MDR Annex XIV.',
    sectionGroup: 3,
    sectionGroupName: 'Supporting Evidence',
    type: 'evidence',
    subItems: [
      {
        letter: 'a',
        description: 'Clinical evaluation plan',
        requirement: 'A clinical evaluation plan defining the scope, methodology, and data sources for the clinical evaluation (MDR Annex XIV Part A).',
        guidance: 'Define the clinical evaluation scope, literature search strategy, equivalence criteria (if applicable), and the appraisal/analysis methodology.',
        helpText: 'The clinical evaluation plan is your roadmap. It defines what evidence you need, where to find it, and how to analyse it. It must be written before the CER and approved by qualified personnel.',
      },
      {
        letter: 'b',
        description: 'Literature search protocol and results',
        requirement: 'Systematic literature search covering clinical safety and performance data (MDR Annex XIV Part A §1(a)).',
        guidance: 'Document search databases, keywords, inclusion/exclusion criteria, screening results, and the complete set of appraised publications.',
        helpText: 'A systematic literature search must be reproducible and documented. Include databases searched (PubMed, Embase), search terms, date range, and PRISMA-style screening flow chart.',
      },
      {
        letter: 'c',
        description: 'Clinical evaluation report (CER)',
        requirement: 'Clinical evaluation report documenting the clinical evidence analysis and conclusions (MDR Art. 61, Annex XIV).',
        guidance: 'The CER shall synthesise all clinical data, address GSPRs, evaluate benefit-risk, and identify any gaps requiring PMCF.',
        helpText: 'The CER is one of the most critical documents in your technical file. It must be written or reviewed by a clinically qualified evaluator and updated at least annually (more often for Class III/implantables).',
      },
      {
        letter: 'd',
        description: 'Equivalence assessment (if applicable)',
        requirement: 'Demonstration of equivalence to another device based on clinical, technical, and biological characteristics (MDR Annex XIV Part A §3).',
        guidance: 'Provide a detailed comparison table covering clinical, technical, and biological equivalence. For Class III and implantables, contract/access to equivalent device data is required.',
        helpText: 'Claiming equivalence under MDR is much stricter than under the Directives. You must demonstrate clinical, technical, AND biological equivalence. For Class III/implantables, you typically need a contract with the equivalent device manufacturer.',
      },
      {
        letter: 'e',
        description: 'PMCF plan',
        requirement: 'A PMCF plan specifying methods and procedures for proactively collecting clinical data post-market (MDR Annex XIV Part B).',
        guidance: 'Define the PMCF objectives, methods (surveys, registries, studies), endpoints, sample size rationale, and analysis plan.',
        helpText: 'PMCF (Post-Market Clinical Follow-up) proactively collects clinical data after market launch. It\'s mandatory for all devices — the scope and methods scale with risk class.',
      },
      {
        letter: 'f',
        description: 'PMCF evaluation report',
        requirement: 'A PMCF evaluation report summarising the results and conclusions of PMCF activities (MDR Annex XIV Part B).',
        guidance: 'Present the PMCF data collected, analyse safety and performance trends, and state whether findings impact the benefit-risk assessment or require CER updates.',
        helpText: 'The PMCF evaluation report analyses collected post-market clinical data. Findings feed back into your CER and risk management file. If safety signals emerge, immediate action may be needed.',
      },
    ],
  },
  {
    section: 'TF-9',
    title: 'Post-Market',
    description: 'PMS Plan, PMCF Plan, PSUR, and trend reporting per MDR Annex III.',
    sectionGroup: 3,
    sectionGroupName: 'Supporting Evidence',
    type: 'evidence',
    subItems: [
      {
        letter: 'a',
        description: 'Post-Market Surveillance plan',
        requirement: 'A PMS plan proportionate to the risk class, covering systematic procedures to collect and evaluate PMS data (MDR Art. 84, Annex III).',
        guidance: 'Define data sources (complaints, vigilance, literature, registries), methods of data collection, analysis intervals, and responsibilities.',
        helpText: 'The PMS plan is your strategy for monitoring device safety and performance after market launch. It must be proportionate to risk class and cover all data sources systematically.',
      },
      {
        letter: 'b',
        description: 'PMCF plan (cross-reference)',
        requirement: 'The PMS plan shall reference the PMCF plan as part of the broader PMS strategy (MDR Annex III §1.1(b)).',
        guidance: 'Cross-reference the PMCF plan from TF-8(e). Ensure consistency between PMS and PMCF objectives and timelines.',
        helpText: 'Your PMCF plan (clinical follow-up) is a subset of the broader PMS plan. Ensure both are aligned and cross-referenced — auditors check for consistency between these documents.',
      },
      {
        letter: 'c',
        description: 'Periodic Safety Update Report (PSUR)',
        requirement: 'A PSUR summarising PMS data analysis, benefit-risk conclusions, and sales volume for Class IIa, IIb, and III devices (MDR Art. 86).',
        guidance: 'Include PMS data summary, complaints analysis, vigilance events, trend analysis, and conclusion on whether the benefit-risk remains acceptable. Update at least annually for higher-class devices.',
        helpText: 'PSURs are mandatory for Class IIa (every 2 years), IIb and III (annually). They compile PMS data, analyse trends, and confirm that the benefit-risk ratio remains favourable. Class I devices produce a PMS report instead.',
      },
      {
        letter: 'd',
        description: 'Vigilance and incident reporting procedures',
        requirement: 'Procedures for reporting serious incidents and field safety corrective actions to competent authorities (MDR Art. 87–89).',
        guidance: 'Document the vigilance process, responsible persons, reporting timelines, MedDev/IMDRF forms used, and escalation criteria.',
        helpText: 'Vigilance reporting has strict timelines: serious incidents must be reported within 15 days (or 2 days for imminent risk). Have clear procedures and trained personnel ready before market launch.',
      },
      {
        letter: 'e',
        description: 'Trend reporting and field safety corrective actions',
        requirement: 'Procedures for trend reporting of incidents and systematic analysis triggering corrective actions (MDR Art. 88).',
        guidance: 'Define trend analysis methodology, thresholds for reporting, and how trend findings feed into CAPA and risk management updates.',
        helpText: 'Even if individual incidents don\'t meet serious incident criteria, a statistically significant increase in frequency can trigger trend reporting obligations. Define your analysis methodology and thresholds.',
      },
    ],
  },
];

export const TECHNICAL_FILE_GROUPS: GenericSectionGroup[] = [
  { id: 1, name: 'Administrative' },
  { id: 2, name: 'Technical Documentation' },
  { id: 3, name: 'Supporting Evidence' },
];
