import { GapChecklistItem } from "@/types/gapAnalysisTemplate";

export interface ComprehensiveMdrItem extends GapChecklistItem {
  questionNumber?: string;
  clauseDescription?: string;
  evidenceMethod?: string;
  auditGuidance?: string;
  priority?: 'low' | 'medium' | 'high';
  keyStandards?: string[];
  excludesIf?: string;
  automaticNaReason?: string;
  isAutoExcluded?: boolean;
  gsprClause: string;
  requirementSummary: string;
  section: string; // Required to match GapChecklistItem
  subsection?: string;
}

export interface MdrClauseGroup {
  clauseId: string;
  summary: string;
  chapter: string;
  section?: string;
  subsection?: string;
  priority: 'high' | 'medium' | 'low';
  items: ComprehensiveMdrItem[];
}

export const comprehensiveMdrAnnexI: MdrClauseGroup[] = [
  // ========== CHAPTER I - GENERAL REQUIREMENTS ==========
  {
    clauseId: "1",
    summary: "Devices must be safe, effective, suitable for their intended purpose, and have an acceptable benefit-risk ratio.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-1",
        clause: "1",
        section: "General Requirements",
        gsprClause: "1",
        requirementSummary: "Devices must be safe, effective, suitable for their intended purpose, and have an acceptable benefit-risk ratio.",
        requirement: "Review the final RMF and CER to confirm the overall benefit-risk conclusion is positive.",
        description: "Devices must be safe, effective, suitable for their intended purpose, and have an acceptable benefit-risk ratio.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the final RMF and CER to confirm the overall benefit-risk conclusion is positive.",
        keyStandards: ["ISO 14971", "MEDDEV 2.7/1 rev 4"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "2",
    summary: "Reducing risk \"as far as possible\" means doing so without negatively impacting the benefit-risk ratio.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-2",
        clause: "2",
        section: "General Requirements",
        gsprClause: "2",
        requirementSummary: "Reducing risk \"as far as possible\" means doing so without negatively impacting the benefit-risk ratio.",
        requirement: "Review the risk control option analysis and benefit-risk analysis within the RMF.",
        description: "Reducing risk \"as far as possible\" means doing so without negatively impacting the benefit-risk ratio.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the risk control option analysis and benefit-risk analysis within the RMF.",
        keyStandards: ["ISO 14971"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "3",
    summary: "A risk management system must be established, implemented, and maintained as a continuous iterative process.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-3",
        clause: "3",
        section: "General Requirements",
        gsprClause: "3",
        requirementSummary: "A risk management system must be established, implemented, and maintained as a continuous iterative process.",
        requirement: "Review the Risk Management Procedure and Risk Management Plan.",
        description: "A risk management system must be established, implemented, and maintained as a continuous iterative process.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the Risk Management Procedure and Risk Management Plan.",
        keyStandards: ["ISO 14971", "ISO 13485"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "3(a)",
    summary: "Establish and document a risk management plan for each device.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-3a",
        clause: "3(a)",
        section: "General Requirements",
        gsprClause: "3(a)",
        requirementSummary: "Establish and document a risk management plan for each device.",
        requirement: "Review the device-specific Risk Management Plan to confirm it is complete and approved.",
        description: "Establish and document a risk management plan for each device.",
        category: "documentation",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the device-specific Risk Management Plan to confirm it is complete and approved.",
        keyStandards: ["ISO 14971"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "3(b)",
    summary: "Identify and analyse the known and foreseeable hazards associated with each device.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-3b",
        clause: "3(b)",
        section: "General Requirements",
        gsprClause: "3(b)",
        requirementSummary: "Identify and analyse the known and foreseeable hazards associated with each device.",
        requirement: "Review the hazard analysis (e.g., FMEA, PHA) within the RMF.",
        description: "Identify and analyse the known and foreseeable hazards associated with each device.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the hazard analysis (e.g., FMEA, PHA) within the RMF.",
        keyStandards: ["ISO 14971"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "3(c)",
    summary: "Estimate and evaluate the risks associated with intended use and reasonably foreseeable misuse.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS", 
    priority: "high",
    items: [
      {
        id: "gspr-3c",
        clause: "3(c)",
        section: "General Requirements",
        gsprClause: "3(c)",
        requirementSummary: "Estimate and evaluate the risks associated with intended use and reasonably foreseeable misuse.",
        requirement: "Review the risk evaluation matrices and records within the RMF.",
        description: "Estimate and evaluate the risks associated with intended use and reasonably foreseeable misuse.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the risk evaluation matrices and records within the RMF.",
        keyStandards: ["ISO 14971"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "3(d)",
    summary: "Eliminate or control risks in accordance with the requirements of Section 4.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-3d",
        clause: "3(d)",
        section: "General Requirements",
        gsprClause: "3(d)",
        requirementSummary: "Eliminate or control risks in accordance with the requirements of Section 4.",
        requirement: "Review the risk control measures and their verification of effectiveness within the RMF.",
        description: "Eliminate or control risks in accordance with the requirements of Section 4.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the risk control measures and their verification of effectiveness within the RMF.",
        keyStandards: ["ISO 14971"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "3(e)",
    summary: "Evaluate the impact of production and post-market surveillance (PMS) information on risks.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-3e",
        clause: "3(e)",
        section: "General Requirements",
        gsprClause: "3(e)",
        requirementSummary: "Evaluate the impact of production and post-market surveillance (PMS) information on risks.",
        requirement: "Review the procedure linking the PMS system to the risk management system. Examine records of PMS data being used to update the RMF.",
        description: "Evaluate the impact of production and post-market surveillance (PMS) information on risks.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the procedure linking the PMS system to the risk management system. Examine records of PMS data being used to update the RMF.",
        keyStandards: ["ISO 14971", "ISO 13485"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "3(f)",
    summary: "If necessary based on PMS data, amend risk control measures.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-3f",
        clause: "3(f)",
        section: "General Requirements",
        gsprClause: "3(f)",
        requirementSummary: "If necessary based on PMS data, amend risk control measures.",
        requirement: "Review updated versions of the RMF to confirm that PMS data has led to changes in risk controls where required.",
        description: "If necessary based on PMS data, amend risk control measures.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review updated versions of the RMF to confirm that PMS data has led to changes in risk controls where required.",
        keyStandards: ["ISO 14971"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "4",
    summary: "Risk control measures must conform to safety principles, and residual risk must be acceptable.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-4",
        clause: "4",
        section: "General Requirements",
        gsprClause: "4",
        requirementSummary: "Risk control measures must conform to safety principles, and residual risk must be acceptable.",
        requirement: "Examine the RMF to confirm residual risk is judged acceptable.",
        description: "Risk control measures must conform to safety principles, and residual risk must be acceptable.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Examine the RMF to confirm residual risk is judged acceptable.",
        keyStandards: ["ISO 14971"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "4(a)",
    summary: "Eliminate or reduce risks as far as possible through safe design and manufacture.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-4a",
        clause: "4(a)",
        section: "General Requirements",
        gsprClause: "4(a)",
        requirementSummary: "Eliminate or reduce risks as far as possible through safe design and manufacture.",
        requirement: "Examine the RMF for evidence that design controls were the first priority for mitigation.",
        description: "Eliminate or reduce risks as far as possible through safe design and manufacture.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Examine the RMF for evidence that design controls were the first priority for mitigation.",
        keyStandards: ["ISO 14971"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "4(b)",
    summary: "Take adequate protection measures, including alarms if necessary, in relation to risks that cannot be eliminated.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-4b",
        clause: "4(b)",
        section: "General Requirements",
        gsprClause: "4(b)",
        requirementSummary: "Take adequate protection measures, including alarms if necessary, in relation to risks that cannot be eliminated.",
        requirement: "Examine the RMF for protective measures (e.g., shielding, alarms) for risks not eliminated by design.",
        description: "Take adequate protection measures, including alarms if necessary, in relation to risks that cannot be eliminated.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Examine the RMF for protective measures (e.g., shielding, alarms) for risks not eliminated by design.",
        keyStandards: ["ISO 14971"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "4(c)",
    summary: "Provide information for safety (warnings/precautions/contra-indications) and, where appropriate, training to users.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-4c",
        clause: "4(c)",
        section: "General Requirements",
        gsprClause: "4(c)",
        requirementSummary: "Provide information for safety (warnings/precautions/contra-indications) and, where appropriate, training to users.",
        requirement: "Review the IFU and labeling to ensure safety information is provided for non-eliminated risks.",
        description: "Provide information for safety (warnings/precautions/contra-indications) and, where appropriate, training to users.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the IFU and labeling to ensure safety information is provided for non-eliminated risks.",
        keyStandards: ["ISO 14971"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "4 (cont.)",
    summary: "Users must be informed of any residual risks.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-4-cont",
        clause: "4 (cont.)",
        section: "General Requirements",
        gsprClause: "4 (cont.)",
        requirementSummary: "Users must be informed of any residual risks.",
        requirement: "Review the IFU and labeling to ensure all significant residual risks are communicated.",
        description: "Users must be informed of any residual risks.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the IFU and labeling to ensure all significant residual risks are communicated.",
        keyStandards: ["ISO 14971"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "5(a)",
    summary: "Reduce use-error risks related to ergonomic features and the use environment (design for patient safety).",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-5a",
        clause: "5(a)",
        section: "General Requirements",
        gsprClause: "5(a)",
        requirementSummary: "Reduce use-error risks related to ergonomic features and the use environment (design for patient safety).",
        requirement: "Review the Usability Engineering File for records of formative and summative validation that considered ergonomics.",
        description: "Reduce use-error risks related to ergonomic features and the use environment (design for patient safety).",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the Usability Engineering File for records of formative and summative validation that considered ergonomics.",
        keyStandards: ["IEC 62366-1"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "5(b)",
    summary: "Consider the technical knowledge, education, training, use environment, and medical/physical conditions of intended users.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-5b",
        clause: "5(b)",
        section: "General Requirements",
        gsprClause: "5(b)",
        requirementSummary: "Consider the technical knowledge, education, training, use environment, and medical/physical conditions of intended users.",
        requirement: "Review the user profiles and analysis within the Usability Engineering File.",
        description: "Consider the technical knowledge, education, training, use environment, and medical/physical conditions of intended users.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the user profiles and analysis within the Usability Engineering File.",
        keyStandards: ["IEC 62366-1"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "6",
    summary: "Device characteristics and performance must not be compromised during its intended lifetime.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-6",
        clause: "6",
        section: "General Requirements",
        gsprClause: "6",
        requirementSummary: "Device characteristics and performance must not be compromised during its intended lifetime.",
        requirement: "Review V&V test reports (e.g., accelerated aging, material degradation) that support the claimed lifetime.",
        description: "Device characteristics and performance must not be compromised during its intended lifetime.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review V&V test reports (e.g., accelerated aging, material degradation) that support the claimed lifetime.",
        keyStandards: ["N/A"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "7",
    summary: "Device characteristics and performance must not be adversely affected by transport and storage conditions.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-7",
        clause: "7",
        section: "General Requirements",
        gsprClause: "7",
        requirementSummary: "Device characteristics and performance must not be adversely affected by transport and storage conditions.",
        requirement: "Review packaging and shipping validation test reports (e.g., drop, vibration, temperature tests).",
        description: "Device characteristics and performance must not be adversely affected by transport and storage conditions.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review packaging and shipping validation test reports (e.g., drop, vibration, temperature tests).",
        keyStandards: ["ISTA standards"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "8",
    summary: "All known and foreseeable risks and side-effects must be minimized and acceptable against the benefits.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "high",
    items: [
      {
        id: "gspr-8",
        clause: "8",
        section: "General Requirements",
        gsprClause: "8",
        requirementSummary: "All known and foreseeable risks and side-effects must be minimized and acceptable against the benefits.",
        requirement: "Review the final conclusions of the RMF and the CER.",
        description: "All known and foreseeable risks and side-effects must be minimized and acceptable against the benefits.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the final conclusions of the RMF and the CER.",
        keyStandards: ["ISO 14971", "MEDDEV 2.7/1 rev 4"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "9",
    summary: "For Annex XVI products (no medical purpose), the device must present no more than the maximum acceptable risk.",
    chapter: "CHAPTER I - GENERAL REQUIREMENTS",
    priority: "medium",
    items: [
      {
        id: "gspr-9",
        clause: "9",
        section: "General Requirements",
        gsprClause: "9",
        requirementSummary: "For Annex XVI products (no medical purpose), the device must present no more than the maximum acceptable risk.",
        requirement: "Review the product-specific RMF to confirm risks are evaluated against non-medical benefit.",
        description: "For Annex XVI products (no medical purpose), the device must present no more than the maximum acceptable risk.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER I - GENERAL REQUIREMENTS",
        evidenceMethod: "Review the product-specific RMF to confirm risks are evaluated against non-medical benefit.",
        keyStandards: ["ISO 14971"],
        excludesIf: "Device is not an Annex XVI product.",
        priority: "medium"
      }
    ]
  },

  // ========== CHAPTER II - DESIGN AND MANUFACTURE ==========
  {
    clauseId: "10.1",
    summary: "Devices must be designed and manufactured to remove or minimize the risk of infection and microbial contamination.",
    chapter: "CHAPTER II - DESIGN AND MANUFACTURE",
    section: "10 - Chemical, physical and biological properties",
    priority: "high",
    items: [
      {
        id: "gspr-10.1",
        clause: "10.1",
        gsprClause: "10.1",
        requirementSummary: "Devices must be designed and manufactured to remove or minimize the risk of infection and microbial contamination.",
        requirement: "Review biocompatibility testing, sterilization validation, and packaging integrity testing.",
        description: "Devices must be designed and manufactured to remove or minimize the risk of infection and microbial contamination.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER II - DESIGN AND MANUFACTURE",
        section: "10 - Chemical, physical and biological properties",
        evidenceMethod: "Review biocompatibility testing, sterilization validation, and packaging integrity testing.",
        keyStandards: ["ISO 10993 series", "ISO 11135", "ISO 11137"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "10.2",
    summary: "Devices must be designed to minimize the risk from substances or particles that may be released from the device.",
    chapter: "CHAPTER II - DESIGN AND MANUFACTURE",
    section: "10 - Chemical, physical and biological properties",
    priority: "high",
    items: [
      {
        id: "gspr-10.2",
        clause: "10.2",
        gsprClause: "10.2",
        requirementSummary: "Devices must be designed to minimize the risk from substances or particles that may be released from the device.",
        requirement: "Review extractables and leachables testing, particulate matter testing, and material characterization.",
        description: "Devices must be designed to minimize the risk from substances or particles that may be released from the device.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER II - DESIGN AND MANUFACTURE",
        section: "10 - Chemical, physical and biological properties",
        evidenceMethod: "Review extractables and leachables testing, particulate matter testing, and material characterization.",
        keyStandards: ["ISO 10993-12", "ISO 10993-18", "USP <788>"],
        excludesIf: "Never excluded.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "10.3",
    summary: "Devices must be designed and manufactured to reduce risks posed by substances or particles that may enter the device.",
    chapter: "CHAPTER II - DESIGN AND MANUFACTURE",
    section: "10 - Chemical, physical and biological properties",
    priority: "high",
    items: [
      {
        id: "gspr-10.3",
        clause: "10.3",
        gsprClause: "10.3",
        requirementSummary: "Devices must be designed and manufactured to reduce risks posed by substances or particles that may enter the device.",
        requirement: "Review ingress protection testing, filtration validation, and contamination control measures.",
        description: "Devices must be designed and manufactured to reduce risks posed by substances or particles that may enter the device.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER II - DESIGN AND MANUFACTURE",
        section: "10 - Chemical, physical and biological properties",
        evidenceMethod: "Review ingress protection testing, filtration validation, and contamination control measures.",
        keyStandards: ["IEC 60529", "ISO 14644"],
        excludesIf: "Device is not susceptible to ingress contamination.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "10.4",
    summary: "Devices must be compatible with substances and materials they may encounter during normal use.",
    chapter: "CHAPTER II - DESIGN AND MANUFACTURE",
    section: "10 - Chemical, physical and biological properties",
    priority: "high",
    items: [
      {
        id: "gspr-10.4",
        clause: "10.4",
        gsprClause: "10.4",
        requirementSummary: "Devices must be compatible with substances and materials they may encounter during normal use.",
        requirement: "Review compatibility testing with intended substances (drugs, cleaning agents, etc.).",
        description: "Devices must be compatible with substances and materials they may encounter during normal use.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER II - DESIGN AND MANUFACTURE",
        section: "10 - Chemical, physical and biological properties",
        evidenceMethod: "Review compatibility testing with intended substances (drugs, cleaning agents, etc.).",
        keyStandards: ["ISO 10993-5", "ASTM standards"],
        excludesIf: "Device does not contact other substances during use.",
        priority: "high"
      }
    ]
  },
  {
    clauseId: "10.5",
    summary: "Devices must be designed and manufactured to reduce the risks posed by the unintentional ingress of substances into the device.",
    chapter: "CHAPTER II - DESIGN AND MANUFACTURE",
    section: "10 - Chemical, physical and biological properties",
    priority: "medium",
    items: [
      {
        id: "gspr-10.5",
        clause: "10.5",
        gsprClause: "10.5",
        requirementSummary: "Devices must be designed and manufactured to reduce the risks posed by the unintentional ingress of substances into the device.",
        requirement: "Review sealing validation, ingress protection testing, and design controls for contamination prevention.",
        description: "Devices must be designed and manufactured to reduce the risks posed by the unintentional ingress of substances into the device.",
        category: "verification",
        framework: "MDR",
        chapter: "CHAPTER II - DESIGN AND MANUFACTURE",
        section: "10 - Chemical, physical and biological properties",
        evidenceMethod: "Review sealing validation, ingress protection testing, and design controls for contamination prevention.",
        keyStandards: ["IEC 60529"],
        excludesIf: "Device design prevents unintentional ingress by nature.",
        priority: "medium"
      }
    ]
  }
];

// Export function to get total count
export const getTotalRequirementsCount = (): number => {
  return comprehensiveMdrAnnexI.reduce((total, group) => total + group.items.length, 0);
};

// Export function to get requirements by chapter
export const getRequirementsByChapter = (chapter: string): MdrClauseGroup[] => {
  return comprehensiveMdrAnnexI.filter(group => group.chapter === chapter);
};

// Export all chapter names
export const getAllChapters = (): string[] => {
  return [...new Set(comprehensiveMdrAnnexI.map(group => group.chapter))];
};
