/**
 * DiGA Fast-Track (BfArM §139e SGB V & DiGAV) — Clause-Specific Form Field Definitions
 * Step-by-step guided structure for the 56 DiGA listing-readiness clauses.
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const DIGA_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  'DiGA-1.1': {
    clauseTitle: 'DiGA-1.1 — Confirm Medical-Device Status & Risk Class',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_1_1',
        stepLabel: "Confirm Medical-Device Status & Risk Class",
        requirementText: "Per DiGAV §1 and SGB V §139e, a DiGA must be a CE-marked medical device of Class I, IIa or (under DigiG) IIb. Demonstrate the qualification and the risk class.",
        fields: [
          { id: 'qualification_rationale', label: "Medical-device qualification rationale", type: 'richtext', required: true, helpText: "Explain why the product meets the medical-device definition under MDR Art. 2(1) — intended medical purpose, mode of action, target indication." },
          { id: 'mdr_class', label: "MDR risk class", type: 'select', required: true, options: [{ value: "Class I", label: "Class I" }, { value: "Class IIa", label: "Class IIa" }, { value: "Class IIb (DigiG)", label: "Class IIb (DigiG)" }], helpText: "Select the device risk class. DiGA accepts Class I, IIa, and (under DigiG) IIb only." },
          { id: 'ce_certificate_ref', label: "CE certificate / DoC", type: 'doc_reference', required: true, helpText: "Link the valid CE certificate (Class IIa+) or Declaration of Conformity (Class I)." },
        ],
      },
    ],
  },

  'DiGA-1.2': {
    clauseTitle: 'DiGA-1.2 — Digital Main Function',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_1_2',
        stepLabel: "Digital Main Function",
        requirementText: "DiGAV §1(1) — The main function of the product must be essentially based on digital technologies. Hardware-only products do not qualify.",
        fields: [
          { id: 'digital_function_description', label: "Digital main function description", type: 'richtext', required: true, helpText: "Describe how the medical purpose is achieved primarily through digital technologies (algorithms, software-driven features, data processing)." },
          { id: 'hw_sw_ratio', label: "Software vs. hardware contribution", type: 'richtext', helpText: "Explain why the digital portion is the primary driver of the medical benefit." },
        ],
      },
    ],
  },

  'DiGA-1.3': {
    clauseTitle: 'DiGA-1.3 — Patient (or Patient + HCP) Use',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_1_3',
        stepLabel: "Patient (or Patient + HCP) Use",
        requirementText: "DiGAV §1(1) — The DiGA must be used by the patient, or jointly by patient and HCP. HCP-only software (e.g. CDSS) does not qualify.",
        fields: [
          { id: 'user_model', label: "User model", type: 'select', required: true, options: [{ value: "Patient only", label: "Patient only" }, { value: "Patient and HCP jointly", label: "Patient and HCP jointly" }, { value: "HCP only (NOT eligible)", label: "HCP only (NOT eligible)" }], helpText: "Who operates the DiGA?" },
          { id: 'use_scenario', label: "Use scenario description", type: 'richtext', required: true, helpText: "Describe the typical patient interaction and any HCP touchpoints." },
        ],
      },
    ],
  },

  'DiGA-1.4': {
    clauseTitle: 'DiGA-1.4 — Eligible Indication',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_1_4',
        stepLabel: "Eligible Indication",
        requirementText: "SGB V §33a — Indication must be detection, monitoring, treatment or alleviation of disease, or compensation of injury / disability. Pure prevention/lifestyle does not qualify.",
        fields: [
          { id: 'indication_category', label: "Indication category", type: 'select', required: true, options: [{ value: "Detection", label: "Detection" }, { value: "Monitoring", label: "Monitoring" }, { value: "Treatment", label: "Treatment" }, { value: "Alleviation", label: "Alleviation" }, { value: "Compensation of injury", label: "Compensation of injury" }, { value: "Compensation of disability", label: "Compensation of disability" }], helpText: "Pick the eligible category that best describes the DiGA." },
          { id: 'icd10_codes', label: "ICD-10-GM codes covered", type: 'text', required: true, helpText: "List the ICD-10-GM codes the DiGA addresses." },
          { id: 'indication_justification', label: "Indication justification", type: 'richtext', required: true, helpText: "Explain how the DiGA addresses this indication and reference clinical/scientific evidence." },
        ],
      },
    ],
  },

  'DiGA-1.5': {
    clauseTitle: 'DiGA-1.5 — Hardware-Coupling Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_1_5',
        stepLabel: "Hardware-Coupling Requirements",
        requirementText: "DiGAV §1(2) — If hardware is bundled (sensors, wearables), demonstrate hardware-coupling rules are met (medical purpose driven by software, hardware necessary).",
        fields: [
          { id: 'hardware_bundled', label: "Hardware bundled?", type: 'select', required: true, options: [{ value: "No", label: "No" }, { value: "Yes — sensors/wearables", label: "Yes — sensors/wearables" }, { value: "Yes — other", label: "Yes — other" }], helpText: "Is hardware bundled with the DiGA?" },
          { id: 'hardware_justification', label: "Hardware coupling justification", type: 'richtext', helpText: "If hardware is bundled, explain why it is necessary and how the medical purpose remains software-driven." },
          { id: 'hardware_evidence_ref', label: "Hardware coupling evidence", type: 'doc_reference', helpText: "Link the design rationale or technical file section addressing hardware coupling." },
        ],
      },
    ],
  },

  'DiGA-1.6': {
    clauseTitle: 'DiGA-1.6 — Service-Coupling Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_1_6',
        stepLabel: "Service-Coupling Requirements",
        requirementText: "DiGAV §1(3) — If services (coaching, telemedicine) are bundled, demonstrate service-coupling rules are met.",
        fields: [
          { id: 'services_bundled', label: "Services bundled?", type: 'select', required: true, options: [{ value: "No", label: "No" }, { value: "Yes — coaching", label: "Yes — coaching" }, { value: "Yes — telemedicine", label: "Yes — telemedicine" }, { value: "Yes — other", label: "Yes — other" }], helpText: "Are services bundled with the DiGA?" },
          { id: 'services_justification', label: "Service coupling justification", type: 'richtext', helpText: "If services are bundled, explain their role and how digital function remains primary." },
        ],
      },
    ],
  },

  'DiGA-2.1': {
    clauseTitle: 'DiGA-2.1 — Manufacturer Master Data & EU AR',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_2_1',
        stepLabel: "Manufacturer Master Data & EU AR",
        requirementText: "DiGAV §3, §20 — Provide manufacturer master data and EU Authorised Representative (if non-EU manufacturer).",
        fields: [
          { id: 'manufacturer_name', label: "Manufacturer legal name", type: 'text', required: true, helpText: "Legal name as registered." },
          { id: 'manufacturer_address', label: "Manufacturer address", type: 'text', required: true, helpText: "Full registered address." },
          { id: 'eu_ar', label: "EU Authorised Representative", type: 'text', helpText: "Name and address of EU AR (if applicable)." },
          { id: 'basic_udi_di', label: "Basic UDI-DI", type: 'text', required: true, helpText: "Basic UDI-DI assigned to the device." },
        ],
      },
    ],
  },

  'DiGA-2.2': {
    clauseTitle: 'DiGA-2.2 — Product Identifiers',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_2_2',
        stepLabel: "Product Identifiers",
        requirementText: "DiGAV §20 — Provide product identifiers: UDI-DI, version, supported platforms, supported languages.",
        fields: [
          { id: 'product_trade_name', label: "Product / trade name", type: 'text', required: true, helpText: "As shown to users in app stores." },
          { id: 'udi_di', label: "UDI-DI", type: 'text', required: true, helpText: "Production UDI-DI." },
          { id: 'version', label: "Current software version", type: 'text', required: true, helpText: "SemVer or BfArM-aligned version string." },
          { id: 'platforms', label: "Supported platforms", type: 'text', required: true, helpText: "iOS, Android, Web — include minimum OS versions." },
          { id: 'languages', label: "Supported languages", type: 'text', required: true, helpText: "UI languages supported (German required)." },
        ],
      },
    ],
  },

  'DiGA-2.3': {
    clauseTitle: 'DiGA-2.3 — Intended Purpose & ICD-10-GM',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_2_3',
        stepLabel: "Intended Purpose & ICD-10-GM",
        requirementText: "DiGAV §20 — Specify intended purpose, target patient group and ICD-10-GM indication codes.",
        fields: [
          { id: 'intended_purpose', label: "Intended purpose", type: 'richtext', required: true, helpText: "Statement of intended purpose for BfArM listing." },
          { id: 'patient_population', label: "Target patient population", type: 'richtext', required: true, helpText: "Demographics, comorbidities, prior treatment." },
          { id: 'icd10_codes', label: "ICD-10-GM indication codes", type: 'text', required: true, helpText: "All applicable ICD-10-GM codes." },
        ],
      },
    ],
  },

  'DiGA-2.4': {
    clauseTitle: 'DiGA-2.4 — Contraindications, Side Effects, Warnings',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_2_4',
        stepLabel: "Contraindications, Side Effects, Warnings",
        requirementText: "DiGAV §20 — List contraindications, side effects and warnings.",
        fields: [
          { id: 'contraindications', label: "Contraindications", type: 'richtext', required: true, helpText: "When the DiGA must not be used." },
          { id: 'side_effects', label: "Side effects", type: 'richtext', required: true, helpText: "Known and foreseeable side effects." },
          { id: 'warnings', label: "Warnings & precautions", type: 'richtext', required: true, helpText: "User warnings shown in app and IFU." },
        ],
      },
    ],
  },

  'DiGA-2.5': {
    clauseTitle: 'DiGA-2.5 — HCP Involvement Model',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_2_5',
        stepLabel: "HCP Involvement Model",
        requirementText: "DiGAV §20 — Describe healthcare provider involvement model.",
        fields: [
          { id: 'hcp_model', label: "HCP involvement", type: 'select', required: true, options: [{ value: "Without HCP", label: "Without HCP" }, { value: "With HCP — recommended", label: "With HCP — recommended" }, { value: "With HCP — required", label: "With HCP — required" }], helpText: "Choose the HCP involvement model." },
          { id: 'hcp_workflow', label: "HCP workflow description", type: 'richtext', helpText: "Describe what the HCP does (prescribe, monitor, adjust)." },
        ],
      },
    ],
  },

  'DiGA-2.6': {
    clauseTitle: 'DiGA-2.6 — Application Route',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_2_6',
        stepLabel: "Application Route",
        requirementText: "SGB V §139e(2)/(4) — Choose final listing or provisional listing with evaluation concept.",
        fields: [
          { id: 'application_route', label: "Application route", type: 'select', required: true, options: [{ value: "Final listing (§139e(2))", label: "Final listing (§139e(2))" }, { value: "Provisional listing (§139e(4))", label: "Provisional listing (§139e(4))" }], helpText: "Final or provisional listing." },
          { id: 'evaluation_concept_ref', label: "Evaluation concept (provisional only)", type: 'doc_reference', helpText: "Required for provisional listing — link evaluation concept." },
        ],
      },
    ],
  },

  'DiGA-2.7': {
    clauseTitle: 'DiGA-2.7 — Annex 1 Self-Declarations',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_2_7',
        stepLabel: "Annex 1 Self-Declarations",
        requirementText: "DiGAV Annex 1 — Complete all manufacturer self-declarations in Annex 1 DiGAV.",
        fields: [
          { id: 'annex1_status', label: "Annex 1 declarations status", type: 'select', required: true, options: [{ value: "Not started", label: "Not started" }, { value: "In progress", label: "In progress" }, { value: "Complete", label: "Complete" }], helpText: "Have all Annex 1 self-declarations been completed and signed?" },
          { id: 'annex1_doc', label: "Signed Annex 1 declarations", type: 'doc_reference', required: true, helpText: "Link the signed declarations bundle." },
        ],
      },
    ],
  },

  'DiGA-3.1': {
    clauseTitle: 'DiGA-3.1 — CE Certificate Validity',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_3_1',
        stepLabel: "CE Certificate Validity",
        requirementText: "DiGAV §3, MDR — Maintain a current and valid CE certificate (or DoC for Class I).",
        fields: [
          { id: 'ce_validity', label: "CE validity status", type: 'select', required: true, options: [{ value: "Valid", label: "Valid" }, { value: "Expiring soon", label: "Expiring soon" }, { value: "Expired", label: "Expired" }], helpText: "Current certificate state." },
          { id: 'ce_expiry', label: "CE expiry date", type: 'text', required: true, helpText: "Format YYYY-MM-DD." },
          { id: 'ce_doc_ref', label: "CE certificate document", type: 'doc_reference', required: true, helpText: "Link the certificate / DoC." },
        ],
      },
    ],
  },

  'DiGA-3.2': {
    clauseTitle: 'DiGA-3.2 — Risk Management — Digital Hazards',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_3_2',
        stepLabel: "Risk Management — Digital Hazards",
        requirementText: "ISO 14971 — Risk management file must cover cybersecurity, data, and digital-specific hazards.",
        fields: [
          { id: 'digital_hazards', label: "Digital hazards covered", type: 'richtext', required: true, helpText: "List digital-specific hazards (cyber, data integrity, algorithm bias, connectivity loss)." },
          { id: 'rmf_ref', label: "Risk Management File", type: 'doc_reference', required: true, helpText: "Link the RMF." },
        ],
      },
    ],
  },

  'DiGA-3.3': {
    clauseTitle: 'DiGA-3.3 — Clinical Evaluation Coverage',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_3_3',
        stepLabel: "Clinical Evaluation Coverage",
        requirementText: "MDR Annex XIV — Clinical evaluation report current and addresses the DiGA indication.",
        fields: [
          { id: 'cer_summary', label: "CER summary for DiGA indication", type: 'richtext', required: true, helpText: "Summarise CER conclusions specifically for the DiGA indication." },
          { id: 'cer_ref', label: "Clinical Evaluation Report", type: 'doc_reference', required: true, helpText: "Link the CER." },
        ],
      },
    ],
  },

  'DiGA-3.4': {
    clauseTitle: 'DiGA-3.4 — Usability for German Target Users',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_3_4',
        stepLabel: "Usability for German Target Users",
        requirementText: "IEC 62366-1 — Usability engineering file demonstrates safe use in German with target users.",
        fields: [
          { id: 'uof_summary', label: "Usability validation summary", type: 'richtext', required: true, helpText: "Summarise summative evaluation with German users." },
          { id: 'uef_ref', label: "Usability Engineering File", type: 'doc_reference', required: true, helpText: "Link the UEF." },
        ],
      },
    ],
  },

  'DiGA-3.5': {
    clauseTitle: 'DiGA-3.5 — Software Lifecycle Artefacts',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_3_5',
        stepLabel: "Software Lifecycle Artefacts",
        requirementText: "IEC 62304 — Software lifecycle artefacts present, including SOUP/OTS list and SBOM.",
        fields: [
          { id: 'sw_safety_class', label: "IEC 62304 software safety class", type: 'select', required: true, options: [{ value: "Class A", label: "Class A" }, { value: "Class B", label: "Class B" }, { value: "Class C", label: "Class C" }], helpText: "Software safety classification." },
          { id: 'soup_list_ref', label: "SOUP / OTS list", type: 'doc_reference', required: true, helpText: "Link the SOUP/OTS register." },
          { id: 'sbom_ref', label: "SBOM", type: 'doc_reference', required: true, helpText: "Link the Software Bill of Materials." },
        ],
      },
    ],
  },

  'DiGA-3.6': {
    clauseTitle: 'DiGA-3.6 — PMS — Digital Signals',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_3_6',
        stepLabel: "PMS — Digital Signals",
        requirementText: "MDR Art 83 — PMS plan includes DiGA-specific signals: app store reviews, digital usage telemetry.",
        fields: [
          { id: 'pms_signals', label: "Digital PMS signals tracked", type: 'richtext', required: true, helpText: "List monitored digital signals (store reviews, telemetry, support tickets)." },
          { id: 'pms_plan_ref', label: "PMS plan", type: 'doc_reference', required: true, helpText: "Link the PMS plan." },
        ],
      },
    ],
  },

  'DiGA-4.1': {
    clauseTitle: 'DiGA-4.1 — Permitted Processing Purposes',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_4_1',
        stepLabel: "Permitted Processing Purposes",
        requirementText: "DiGAV §4(2), GDPR — Each personal data processing activity must have a permitted purpose under §4 DiGAV.",
        fields: [
          { id: 'processing_purposes', label: "Processing purposes mapped to §4", type: 'richtext', required: true, helpText: "List each processing activity and the §4 DiGAV permitted purpose." },
          { id: 'lawful_basis', label: "GDPR lawful basis", type: 'richtext', required: true, helpText: "Lawful basis (Art 6) and special category basis (Art 9) per activity." },
        ],
      },
    ],
  },

  'DiGA-4.2': {
    clauseTitle: 'DiGA-4.2 — No Advertising / No Insurer Pricing Use',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_4_2',
        stepLabel: "No Advertising / No Insurer Pricing Use",
        requirementText: "SGB V §139e(10) — No advertising and no insurer-pricing use of DiGA-collected data.",
        fields: [
          { id: 'use_restriction_attestation', label: "Attestation", type: 'select', required: true, options: [{ value: "Confirmed", label: "Confirmed" }, { value: "Not confirmed", label: "Not confirmed" }], helpText: "Confirm DiGA data is not used for advertising or insurer pricing." },
          { id: 'controls_description', label: "Technical & organisational controls", type: 'richtext', required: true, helpText: "Describe controls preventing such uses." },
        ],
      },
    ],
  },

  'DiGA-4.3': {
    clauseTitle: 'DiGA-4.3 — Data-Processing Locations',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_4_3',
        stepLabel: "Data-Processing Locations",
        requirementText: "DiGAV §4, GDPR Ch. V — All processing performed in EU/EEA, adequacy countries, or BfArM-listed third countries only.",
        fields: [
          { id: 'processing_locations', label: "Processing locations", type: 'richtext', required: true, helpText: "List all locations (incl. sub-processors) and country categories (EU/EEA / adequacy / BfArM-listed)." },
          { id: 'transfer_safeguards', label: "Transfer safeguards", type: 'richtext', helpText: "SCCs, BCRs, supplementary measures where applicable." },
        ],
      },
    ],
  },

  'DiGA-4.4': {
    clauseTitle: 'DiGA-4.4 — DPIA',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_4_4',
        stepLabel: "DPIA",
        requirementText: "GDPR Art 35 — DPIA performed and documented.",
        fields: [
          { id: 'dpia_summary', label: "DPIA summary", type: 'richtext', required: true, helpText: "Summarise DPIA scope, risks identified, and mitigations." },
          { id: 'dpia_ref', label: "DPIA document", type: 'doc_reference', required: true, helpText: "Link the DPIA." },
        ],
      },
    ],
  },

  'DiGA-4.5': {
    clauseTitle: 'DiGA-4.5 — ROPA Coverage',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_4_5',
        stepLabel: "ROPA Coverage",
        requirementText: "GDPR Art 30 — Records of Processing Activities (ROPA) cover the DiGA.",
        fields: [
          { id: 'ropa_status', label: "ROPA status", type: 'select', required: true, options: [{ value: "Complete", label: "Complete" }, { value: "Partial", label: "Partial" }, { value: "Missing", label: "Missing" }], helpText: "Does the ROPA cover all DiGA processing?" },
          { id: 'ropa_ref', label: "ROPA document", type: 'doc_reference', required: true, helpText: "Link the ROPA." },
        ],
      },
    ],
  },

  'DiGA-4.6': {
    clauseTitle: 'DiGA-4.6 — Data Subject Rights',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_4_6',
        stepLabel: "Data Subject Rights",
        requirementText: "GDPR Art 12-22 — Workflows implemented for export, rectification, erasure and access requests.",
        fields: [
          { id: 'dsr_workflows', label: "Implemented workflows", type: 'richtext', required: true, helpText: "Describe each implemented data subject rights workflow." },
          { id: 'dsr_evidence_ref', label: "Workflow evidence", type: 'doc_reference', helpText: "Link runbooks or screenshots." },
        ],
      },
    ],
  },

  'DiGA-4.7': {
    clauseTitle: 'DiGA-4.7 — Controller / Processor Agreements',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_4_7',
        stepLabel: "Controller / Processor Agreements",
        requirementText: "GDPR Art 26/28 — Joint-controller and processor agreements signed with all relevant parties.",
        fields: [
          { id: 'agreements_list', label: "Agreements register", type: 'richtext', required: true, helpText: "List counterparties and agreement types (DPA, JCA)." },
          { id: 'agreements_ref', label: "Agreements bundle", type: 'doc_reference', required: true, helpText: "Link the executed agreements." },
        ],
      },
    ],
  },

  'DiGA-4.8': {
    clauseTitle: 'DiGA-4.8 — Pseudonymisation / Anonymisation',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_4_8',
        stepLabel: "Pseudonymisation / Anonymisation",
        requirementText: "DiGAV §4 — Pseudonymisation / anonymisation strategy for analytics and statistics.",
        fields: [
          { id: 'strategy_description', label: "Strategy description", type: 'richtext', required: true, helpText: "Describe the techniques applied and where." },
          { id: 'strategy_ref', label: "Strategy document", type: 'doc_reference', helpText: "Link the policy / technical specification." },
        ],
      },
    ],
  },

  'DiGA-5.1': {
    clauseTitle: 'DiGA-5.1 — ISMS Coverage',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_5_1',
        stepLabel: "ISMS Coverage",
        requirementText: "DiGAV §5, ISO 27001 — ISMS in place whose scope explicitly covers the DiGA.",
        fields: [
          { id: 'isms_status', label: "ISMS status", type: 'select', required: true, options: [{ value: "Certified ISO 27001", label: "Certified ISO 27001" }, { value: "Implemented (uncertified)", label: "Implemented (uncertified)" }, { value: "Planned", label: "Planned" }], helpText: "ISMS state." },
          { id: 'isms_scope', label: "ISMS scope statement", type: 'richtext', required: true, helpText: "Cite the scope statement that covers the DiGA." },
          { id: 'isms_ref', label: "ISMS / SoA", type: 'doc_reference', required: true, helpText: "Link the Statement of Applicability or certificate." },
        ],
      },
    ],
  },

  'DiGA-5.2': {
    clauseTitle: 'DiGA-5.2 — Security-as-a-Process',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_5_2',
        stepLabel: "Security-as-a-Process",
        requirementText: "BSI — Documented security-as-a-process: vulnerability mgmt, patching, monitoring, review cycles.",
        fields: [
          { id: 'vuln_mgmt', label: "Vulnerability management", type: 'richtext', required: true, helpText: "Describe scanning, triage, SLA." },
          { id: 'patching', label: "Patching cadence", type: 'richtext', required: true, helpText: "Patch management cadence and emergency procedure." },
          { id: 'monitoring', label: "Security monitoring", type: 'richtext', required: true, helpText: "Logging, SIEM/alerting, on-call." },
        ],
      },
    ],
  },

  'DiGA-5.3': {
    clauseTitle: 'DiGA-5.3 — BSI Grundschutz Building Blocks',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_5_3',
        stepLabel: "BSI Grundschutz Building Blocks",
        requirementText: "BSI Grundschutz — Applicable BSI Grundschutz building blocks selected and implemented.",
        fields: [
          { id: 'blocks_selected', label: "Selected building blocks", type: 'richtext', required: true, helpText: "List applicable Grundschutz blocks (e.g. APP.3, NET.3, SYS.1)." },
          { id: 'grundschutz_ref', label: "Implementation evidence", type: 'doc_reference', helpText: "Link mapping/evidence document." },
        ],
      },
    ],
  },

  'DiGA-5.4': {
    clauseTitle: 'DiGA-5.4 — BSI TR-03161 Conformity',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_5_4',
        stepLabel: "BSI TR-03161 Conformity",
        requirementText: "BSI TR-03161 — Conformity to BSI TR-03161 demonstrated.",
        fields: [
          { id: 'tr03161_status', label: "TR-03161 conformity", type: 'select', required: true, options: [{ value: "Confirmed by accredited body", label: "Confirmed by accredited body" }, { value: "Self-attested", label: "Self-attested" }, { value: "Pending", label: "Pending" }], helpText: "Conformity status." },
          { id: 'tr03161_ref', label: "TR-03161 attestation", type: 'doc_reference', required: true, helpText: "Link the conformity attestation." },
        ],
      },
    ],
  },

  'DiGA-5.5': {
    clauseTitle: 'DiGA-5.5 — Penetration Test',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_5_5',
        stepLabel: "Penetration Test",
        requirementText: "DiGAV §5 — Penetration test conducted by a qualified independent party within scope.",
        fields: [
          { id: 'pentest_date', label: "Last pentest date", type: 'text', required: true, helpText: "Format YYYY-MM-DD." },
          { id: 'pentest_provider', label: "Independent provider", type: 'text', required: true, helpText: "Name of testing party." },
          { id: 'pentest_ref', label: "Pentest report", type: 'doc_reference', required: true, helpText: "Link the report." },
        ],
      },
    ],
  },

  'DiGA-5.6': {
    clauseTitle: 'DiGA-5.6 — Increased Protection Needs',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_5_6',
        stepLabel: "Increased Protection Needs",
        requirementText: "DiGAV §5 — Increased protection-needs assessment performed; additional controls in place where applicable.",
        fields: [
          { id: 'protection_needs', label: "Protection-needs result", type: 'select', required: true, options: [{ value: "Normal", label: "Normal" }, { value: "High", label: "High" }, { value: "Very high", label: "Very high" }], helpText: "Outcome of protection-needs assessment." },
          { id: 'additional_controls', label: "Additional controls", type: 'richtext', helpText: "Describe additional controls if High/Very High." },
          { id: 'assessment_ref', label: "Assessment document", type: 'doc_reference', required: true, helpText: "Link the assessment." },
        ],
      },
    ],
  },

  'DiGA-5.7': {
    clauseTitle: 'DiGA-5.7 — Incident Response & Breach Notification',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_5_7',
        stepLabel: "Incident Response & Breach Notification",
        requirementText: "GDPR Art 33-34 — Incident response and breach-notification process implemented and tested.",
        fields: [
          { id: 'ir_plan', label: "IR plan summary", type: 'richtext', required: true, helpText: "Roles, severity scale, comms tree." },
          { id: 'breach_72h', label: "72-hour notification capability", type: 'select', required: true, options: [{ value: "Yes", label: "Yes" }, { value: "Partial", label: "Partial" }, { value: "No", label: "No" }], helpText: "Can the company notify within 72h?" },
          { id: 'ir_test', label: "Last IR drill", type: 'text', helpText: "Date of last tabletop / drill." },
          { id: 'ir_ref', label: "IR plan document", type: 'doc_reference', required: true, helpText: "Link the plan." },
        ],
      },
    ],
  },

  'DiGA-6.1': {
    clauseTitle: 'DiGA-6.1 — Interop Standards Used',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_6_1',
        stepLabel: "Interop Standards Used",
        requirementText: "DiGAV §6 — Standards from the interop directory used: FHIR, LOINC, SNOMED CT, ICD-10-GM where applicable.",
        fields: [
          { id: 'standards_used', label: "Standards used", type: 'richtext', required: true, helpText: "List standards used and where." },
          { id: 'mapping_ref', label: "Standards mapping doc", type: 'doc_reference', helpText: "Link the mapping document." },
        ],
      },
    ],
  },

  'DiGA-6.2': {
    clauseTitle: 'DiGA-6.2 — §6 Cascade Justification',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_6_2',
        stepLabel: "§6 Cascade Justification",
        requirementText: "DiGAV §6 — Cascade of §6 DiGAV applied with documented justifications for any deviation.",
        fields: [
          { id: 'cascade_application', label: "Cascade application", type: 'richtext', required: true, helpText: "For each domain, cite chosen standard or justify deviation." },
        ],
      },
    ],
  },

  'DiGA-6.3': {
    clauseTitle: 'DiGA-6.3 — Patient Data Export',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_6_3',
        stepLabel: "Patient Data Export",
        requirementText: "DiGAV §6 — Patient data export available in a structured, open format.",
        fields: [
          { id: 'export_format', label: "Export format", type: 'select', required: true, options: [{ value: "FHIR", label: "FHIR" }, { value: "HL7", label: "HL7" }, { value: "CDA", label: "CDA" }, { value: "JSON", label: "JSON" }, { value: "CSV", label: "CSV" }, { value: "Other", label: "Other" }], helpText: "Choose primary export format." },
          { id: 'export_workflow', label: "Export workflow", type: 'richtext', required: true, helpText: "How does the user trigger an export?" },
        ],
      },
    ],
  },

  'DiGA-6.4': {
    clauseTitle: 'DiGA-6.4 — Semantic & Syntactic Interoperability',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_6_4',
        stepLabel: "Semantic & Syntactic Interoperability",
        requirementText: "DiGAV §6 — Semantic and syntactic interoperability documented.",
        fields: [
          { id: 'semantic_interop', label: "Semantic interoperability", type: 'richtext', required: true, helpText: "Code systems used (LOINC, SNOMED CT)." },
          { id: 'syntactic_interop', label: "Syntactic interoperability", type: 'richtext', required: true, helpText: "Wire formats and schemas." },
        ],
      },
    ],
  },

  'DiGA-6.5': {
    clauseTitle: 'DiGA-6.5 — Open APIs & AuthN',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_6_5',
        stepLabel: "Open APIs & AuthN",
        requirementText: "DiGAV §6 — Open APIs and authentication standards (OAuth2, OIDC) used where APIs are exposed.",
        fields: [
          { id: 'exposes_api', label: "API exposed?", type: 'select', required: true, options: [{ value: "No", label: "No" }, { value: "Yes — partner only", label: "Yes — partner only" }, { value: "Yes — public", label: "Yes — public" }], helpText: "Does the DiGA expose APIs?" },
          { id: 'auth_standards', label: "AuthN standards", type: 'richtext', helpText: "OAuth2, OIDC, scopes, MFA." },
          { id: 'api_doc_ref', label: "API documentation", type: 'doc_reference', helpText: "Link the API spec." },
        ],
      },
    ],
  },

  'DiGA-7.1': {
    clauseTitle: 'DiGA-7.1 — Robustness',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_7_1',
        stepLabel: "Robustness",
        requirementText: "DiGAV Annex 1 §2 — Robustness: error handling, offline behaviour, recovery and integrity tested.",
        fields: [
          { id: 'robustness_summary', label: "Robustness measures", type: 'richtext', required: true, helpText: "Error handling, offline mode, data integrity." },
          { id: 'test_evidence_ref', label: "Test evidence", type: 'doc_reference', helpText: "Link test results." },
        ],
      },
    ],
  },

  'DiGA-7.2': {
    clauseTitle: 'DiGA-7.2 — Consumer Protection',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_7_2',
        stepLabel: "Consumer Protection",
        requirementText: "DiGAV Annex 1 §2 — Consumer protection: transparent T&Cs, no dark patterns, fair pricing and cancellation.",
        fields: [
          { id: 'consumer_protection_summary', label: "Consumer protection summary", type: 'richtext', required: true, helpText: "T&Cs accessibility, no dark patterns, cancellation flow." },
          { id: 'tnc_ref', label: "Terms & Conditions", type: 'doc_reference', required: true, helpText: "Link current T&Cs." },
        ],
      },
    ],
  },

  'DiGA-7.3': {
    clauseTitle: 'DiGA-7.3 — Accessibility (BITV / WCAG 2.1 AA)',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_7_3',
        stepLabel: "Accessibility (BITV / WCAG 2.1 AA)",
        requirementText: "BITV / WCAG 2.1 AA — Ease of use: accessibility per BITV and WCAG 2.1 AA, German language UI.",
        fields: [
          { id: 'a11y_conformance', label: "Accessibility conformance", type: 'select', required: true, options: [{ value: "A", label: "A" }, { value: "AA", label: "AA" }, { value: "AAA", label: "AAA" }, { value: "Not assessed", label: "Not assessed" }], helpText: "WCAG 2.1 conformance level." },
          { id: 'a11y_report_ref', label: "Accessibility report", type: 'doc_reference', helpText: "Link the audit report." },
          { id: 'german_ui', label: "German UI confirmed", type: 'select', required: true, options: [{ value: "Yes", label: "Yes" }, { value: "Partial", label: "Partial" }, { value: "No", label: "No" }], helpText: "German UI present?" },
        ],
      },
    ],
  },

  'DiGA-7.4': {
    clauseTitle: 'DiGA-7.4 — HCP Support Materials',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_7_4',
        stepLabel: "HCP Support Materials",
        requirementText: "DiGAV Annex 1 §2 — Healthcare provider support materials available (HCP guide, prescribing info).",
        fields: [
          { id: 'hcp_materials', label: "HCP materials list", type: 'richtext', required: true, helpText: "List HCP guide, prescribing info, training." },
          { id: 'hcp_materials_ref', label: "HCP materials bundle", type: 'doc_reference', required: true, helpText: "Link the materials." },
        ],
      },
    ],
  },

  'DiGA-7.5': {
    clauseTitle: 'DiGA-7.5 — Quality of Medical Content',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_7_5',
        stepLabel: "Quality of Medical Content",
        requirementText: "DiGAV Annex 1 §2 — Quality of medical content: cited sources, currency, peer review.",
        fields: [
          { id: 'content_governance', label: "Content governance", type: 'richtext', required: true, helpText: "Process for sourcing, peer review and content currency." },
          { id: 'content_sources_ref', label: "Source register", type: 'doc_reference', helpText: "Link the sources/citations register." },
        ],
      },
    ],
  },

  'DiGA-7.6': {
    clauseTitle: 'DiGA-7.6 — Patient Safety In-App',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_7_6',
        stepLabel: "Patient Safety In-App",
        requirementText: "DiGAV Annex 1 §2 — Patient safety: red-flag handling, escalation paths and emergency contacts in app.",
        fields: [
          { id: 'red_flag_handling', label: "Red-flag handling", type: 'richtext', required: true, helpText: "In-app handling of red-flag symptoms / escalation." },
          { id: 'emergency_contacts', label: "Emergency contacts", type: 'richtext', required: true, helpText: "Emergency contacts shown in app." },
        ],
      },
    ],
  },

  'DiGA-8.1': {
    clauseTitle: 'DiGA-8.1 — Type of Positive Care Effect',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_8_1',
        stepLabel: "Type of Positive Care Effect",
        requirementText: "SGB V §139e(2), DiGAV §8 — Type of positive care effect chosen (medical benefit and/or pSVV).",
        fields: [
          { id: 'effect_type', label: "Type chosen", type: 'select', required: true, options: [{ value: "Medical benefit", label: "Medical benefit" }, { value: "pSVV (patient-relevant structural & procedural improvement)", label: "pSVV (patient-relevant structural & procedural improvement)" }, { value: "Both", label: "Both" }], helpText: "Type of positive care effect." },
          { id: 'effect_rationale', label: "Rationale", type: 'richtext', required: true, helpText: "Justify the chosen effect type for the DiGA." },
        ],
      },
    ],
  },

  'DiGA-8.2': {
    clauseTitle: 'DiGA-8.2 — Patient Group Definition',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_8_2',
        stepLabel: "Patient Group Definition",
        requirementText: "DiGAV §10 — Patient group precisely defined (diagnosis, comorbidities, age, prior care).",
        fields: [
          { id: 'patient_group_definition', label: "Patient group definition", type: 'richtext', required: true, helpText: "Diagnosis, comorbidities, age range, prior care." },
        ],
      },
    ],
  },

  'DiGA-8.3': {
    clauseTitle: 'DiGA-8.3 — Endpoints',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_8_3',
        stepLabel: "Endpoints",
        requirementText: "DiGAV §11 — Endpoints defined and patient-relevant.",
        fields: [
          { id: 'primary_endpoint', label: "Primary endpoint", type: 'richtext', required: true, helpText: "Primary endpoint and rationale." },
          { id: 'secondary_endpoints', label: "Secondary endpoints", type: 'richtext', helpText: "Secondary endpoints." },
        ],
      },
    ],
  },

  'DiGA-8.4': {
    clauseTitle: 'DiGA-8.4 — Comparative Study in Germany',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_8_4',
        stepLabel: "Comparative Study in Germany",
        requirementText: "DiGAV §10 — Comparative study, conducted in Germany (or justified deviation).",
        fields: [
          { id: 'study_design', label: "Study design", type: 'richtext', required: true, helpText: "Comparator, randomisation, blinding." },
          { id: 'study_location', label: "Study location", type: 'select', required: true, options: [{ value: "Germany", label: "Germany" }, { value: "EU (with justification)", label: "EU (with justification)" }, { value: "Outside EU (with justification)", label: "Outside EU (with justification)" }], helpText: "Study location." },
          { id: 'study_protocol_ref', label: "Study protocol", type: 'doc_reference', required: true, helpText: "Link the protocol." },
        ],
      },
    ],
  },

  'DiGA-8.5': {
    clauseTitle: 'DiGA-8.5 — Public Pre-Registration',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_8_5',
        stepLabel: "Public Pre-Registration",
        requirementText: "DiGAV §10 — Study registered in a public registry before enrolment starts.",
        fields: [
          { id: 'registry', label: "Registry", type: 'select', required: true, options: [{ value: "DRKS", label: "DRKS" }, { value: "ClinicalTrials.gov", label: "ClinicalTrials.gov" }, { value: "EU CTR", label: "EU CTR" }, { value: "ISRCTN", label: "ISRCTN" }, { value: "Other", label: "Other" }], helpText: "Trial registry used." },
          { id: 'registry_id', label: "Registry ID", type: 'text', required: true, helpText: "Trial registration ID." },
          { id: 'registry_date', label: "Registration date", type: 'text', required: true, helpText: "Format YYYY-MM-DD." },
        ],
      },
    ],
  },

  'DiGA-8.6': {
    clauseTitle: 'DiGA-8.6 — Statistical Analysis Plan',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_8_6',
        stepLabel: "Statistical Analysis Plan",
        requirementText: "DiGAV §10 — Statistical analysis plan and sample size justification documented.",
        fields: [
          { id: 'sap_summary', label: "SAP summary", type: 'richtext', required: true, helpText: "Hypotheses, models, sample size justification." },
          { id: 'sap_ref', label: "SAP document", type: 'doc_reference', required: true, helpText: "Link the SAP." },
        ],
      },
    ],
  },

  'DiGA-8.7': {
    clauseTitle: 'DiGA-8.7 — CONSORT Study Report',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_8_7',
        stepLabel: "CONSORT Study Report",
        requirementText: "CONSORT — Full study report published per international standards.",
        fields: [
          { id: 'publication_status', label: "Publication status", type: 'select', required: true, options: [{ value: "Published", label: "Published" }, { value: "Submitted", label: "Submitted" }, { value: "Drafted", label: "Drafted" }, { value: "Not started", label: "Not started" }], helpText: "Publication status." },
          { id: 'publication_ref', label: "Publication reference", type: 'text', helpText: "DOI / URL." },
          { id: 'study_report_ref', label: "Study report", type: 'doc_reference', required: true, helpText: "Link the full study report." },
        ],
      },
    ],
  },

  'DiGA-8.8': {
    clauseTitle: 'DiGA-8.8 — Provisional Listing — Evaluation Concept',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_8_8',
        stepLabel: "Provisional Listing — Evaluation Concept",
        requirementText: "SGB V §139e(4) — For provisional listing: evaluation concept and plausibility justification submitted.",
        fields: [
          { id: 'plausibility_justification', label: "Plausibility justification", type: 'richtext', required: true, helpText: "Justify plausible positive care effect." },
          { id: 'eval_concept_ref', label: "Evaluation concept", type: 'doc_reference', required: true, helpText: "Link the evaluation concept." },
        ],
      },
    ],
  },

  'DiGA-9.1': {
    clauseTitle: 'DiGA-9.1 — Significant-Change Notification',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_9_1',
        stepLabel: "Significant-Change Notification",
        requirementText: "DiGAV §16 — Process to classify and notify significant changes to BfArM.",
        fields: [
          { id: 'change_process', label: "Change classification process", type: 'richtext', required: true, helpText: "How significance is judged and how BfArM is notified." },
          { id: 'change_log_ref', label: "Change log", type: 'doc_reference', helpText: "Link the controlled change log." },
        ],
      },
    ],
  },

  'DiGA-9.2': {
    clauseTitle: 'DiGA-9.2 — Annual Further-Development Plan',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_9_2',
        stepLabel: "Annual Further-Development Plan",
        requirementText: "DiGAV §17 — Annual mandatory further-development plan in place.",
        fields: [
          { id: 'further_dev_plan', label: "Further-development plan summary", type: 'richtext', required: true, helpText: "Themes, milestones, owner." },
          { id: 'further_dev_ref', label: "Plan document", type: 'doc_reference', required: true, helpText: "Link the current annual plan." },
        ],
      },
    ],
  },

  'DiGA-9.3': {
    clauseTitle: 'DiGA-9.3 — PMS Reporting Cycle',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_9_3',
        stepLabel: "PMS Reporting Cycle",
        requirementText: "MDR / DiGAV — PMS reporting cycle aligned with BfArM expectations and PSUR.",
        fields: [
          { id: 'reporting_cycle', label: "Reporting cycle", type: 'richtext', required: true, helpText: "Cadence and recipients (BfArM, NB)." },
          { id: 'psur_ref', label: "Latest PSUR / PMS report", type: 'doc_reference', required: true, helpText: "Link the latest report." },
        ],
      },
    ],
  },

  'DiGA-9.4': {
    clauseTitle: 'DiGA-9.4 — De-Listing Risk Register',
    evidenceRequired: true,
    steps: [
      {
        id: 'diga_9_4',
        stepLabel: "De-Listing Risk Register",
        requirementText: "DiGAV §19 — De-listing risk register maintained, with mitigations.",
        fields: [
          { id: 'top_risks', label: "Top de-listing risks", type: 'richtext', required: true, helpText: "List top risks and mitigations." },
          { id: 'risk_register_ref', label: "Risk register", type: 'doc_reference', required: true, helpText: "Link the de-listing risk register." },
        ],
      },
    ],
  },

};