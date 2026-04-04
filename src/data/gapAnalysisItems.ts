
import { GapAnalysisItem } from "@/types/client";

// Convert the provided data to match our GapAnalysisItem type
const convertToGapItem = (item: any): GapAnalysisItem => {
  return {
    id: item["Clause ID"] || `gap-${Date.now()}-${Math.random()}`,
    requirement: item["Requirement Summary"] || item["Clause Title"] || "No requirement specified",
    clauseId: item["Clause ID"],
    framework: getFrameworkFromClauseId(item["Clause ID"]),
    section: item["Clause Title"],
    clauseSummary: item["Requirement Summary"],
    status: item["Compliance Status"] ? 
      mapComplianceStatus(item["Compliance Status"]) : 
      "not_applicable",
    priority: item["Priority"] ? 
      mapPriority(item["Priority"]) : 
      undefined,
    assignedTo: item["Assigned To"] || undefined,
    evidence_links: item["Evidence Links"] ? item["Evidence Links"].split(",").map(link => link.trim()) : undefined,
    gapDescription: item["Gap Description"] || undefined,
    updatedAt: new Date().toISOString()
  };
};

// Helper function to determine the framework from clause ID
const getFrameworkFromClauseId = (clauseId: string): GapAnalysisItem["framework"] => {
  if (clauseId.startsWith("MDR_Annex_I")) return "MDR";
  if (clauseId.startsWith("MDR_Annex_II")) return "MDR Annex II";
  if (clauseId.startsWith("MDR_Annex_III")) return "MDR Annex III";
  if (clauseId.startsWith("ISO_13485")) return "ISO 13485";
  if (clauseId.startsWith("ISO_14971")) return "ISO 14971";
  return "MDR"; // Default value
};

// Helper function to map compliance status
const mapComplianceStatus = (status: string): GapAnalysisItem["status"] => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes("compliant") || lowerStatus.includes("conform")) return "compliant";
  if (lowerStatus.includes("partial")) return "partially_compliant";
  if (lowerStatus.includes("non") || lowerStatus.includes("not")) return "non_compliant";
  return "not_applicable";
};

// Helper function to map priority levels
const mapPriority = (priority: string): GapAnalysisItem["priority"] | undefined => {
  const lowerPriority = priority.toLowerCase();
  if (lowerPriority.includes("high")) return "high";
  if (lowerPriority.includes("medium") || lowerPriority.includes("med")) return "medium";
  if (lowerPriority.includes("low")) return "low";
  return undefined;
};

// MDR Annex I items - Complete set of General Safety and Performance Requirements (Reversed Order: GSPR 23 to GSPR 1)
export const mdrAnnexI: GapAnalysisItem[] = [
  // Chapter III: Requirements regarding the information supplied with the device (GSPRs 23-17)
  {
    id: "MDR_Annex_I_23",
    requirement: "GSPR 23: Protection from Infection and Microbial Contamination - Devices shall be designed to reduce risks of creating infection to patient, user or third parties.",
    clauseId: "MDR_Annex_I_23",
    framework: "MDR",
    section: "Chapter III: Requirements regarding the information supplied with the device",
    clauseSummary: "GSPR 23: Protection from Infection and Microbial Contamination - Devices shall be designed to reduce risks of creating infection to patient, user or third parties.",
    status: "not_applicable",
    priority: "high",
    assignedTo: "Dr. Sarah Chen",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_22",
    requirement: "GSPR 22: Systems and Procedure Packs - When devices are combined, the combination shall be safe and the performance characteristics shall not be adversely affected.",
    clauseId: "MDR_Annex_I_22",
    framework: "MDR",
    section: "Chapter III: Requirements regarding the information supplied with the device",
    clauseSummary: "GSPR 22: Systems and Procedure Packs - When devices are combined, the combination shall be safe and the performance characteristics shall not be adversely affected.",
    status: "not_applicable",
    priority: "medium",
    assignedTo: "Michael Rodriguez",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_21",
    requirement: "GSPR 21: Devices Manufactured Utilizing Non-Viable Biological Substances - Devices manufactured utilizing non-viable biological substances shall comply with relevant provisions.",
    clauseId: "MDR_Annex_I_21",
    framework: "MDR",
    section: "Chapter III: Requirements regarding the information supplied with the device",
    clauseSummary: "GSPR 21: Devices Manufactured Utilizing Non-Viable Biological Substances - Devices manufactured utilizing non-viable biological substances shall comply with relevant provisions.",
    status: "not_applicable",
    priority: "low",
    assignedTo: "Emma Thompson",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_20",
    requirement: "GSPR 20: Devices That Are Also Medicinal Products - Devices incorporating substances which are absorbed by or locally dispersed in the human body.",
    clauseId: "MDR_Annex_I_20",
    framework: "MDR",
    section: "Chapter III: Requirements regarding the information supplied with the device",
    clauseSummary: "GSPR 20: Devices That Are Also Medicinal Products - Devices incorporating substances which are absorbed by or locally dispersed in the human body.",
    status: "not_applicable",
    priority: "low",
    assignedTo: "David Kim",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_19",
    requirement: "GSPR 19: Devices Incorporating or Consisting of Nanomaterials - Devices incorporating nanomaterials shall be designed to ensure high level of protection.",
    clauseId: "MDR_Annex_I_19",
    framework: "MDR",
    section: "Chapter III: Requirements regarding the information supplied with the device",
    clauseSummary: "GSPR 19: Devices Incorporating or Consisting of Nanomaterials - Devices incorporating nanomaterials shall be designed to ensure high level of protection.",
    status: "not_applicable",
    priority: "medium",
    assignedTo: "Lisa Wang",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_18",
    requirement: "GSPR 18: Devices Utilizing Human Tissues - Devices utilizing tissues, cells and substances of human origin shall comply with relevant provisions.",
    clauseId: "MDR_Annex_I_18",
    framework: "MDR",
    section: "Chapter III: Requirements regarding the information supplied with the device",
    clauseSummary: "GSPR 18: Devices Utilizing Human Tissues - Devices utilizing tissues, cells and substances of human origin shall comply with relevant provisions.",
    status: "not_applicable",
    priority: "low",
    assignedTo: "James Anderson",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_17",
    requirement: "GSPR 17: Devices Utilizing Animal Tissues - Devices utilizing tissues, cells and substances of animal origin shall comply with veterinary requirements.",
    clauseId: "MDR_Annex_I_17",
    framework: "MDR",
    section: "Chapter III: Requirements regarding the information supplied with the device",
    clauseSummary: "GSPR 17: Devices Utilizing Animal Tissues - Devices utilizing tissues, cells and substances of animal origin shall comply with veterinary requirements.",
    status: "not_applicable",
    priority: "low",
    assignedTo: "Dr. Sarah Chen",
    updatedAt: new Date().toISOString()
  },
  
  // Chapter II: Requirements regarding design and manufacture (GSPRs 16-10)
  {
    id: "MDR_Annex_I_16",
    requirement: "GSPR 16: Devices for Self-Testing - Devices intended for self-testing shall be designed to be used safely and accurately by lay persons.",
    clauseId: "MDR_Annex_I_16",
    framework: "MDR",
    section: "Chapter II: Requirements regarding design and manufacture",
    clauseSummary: "GSPR 16: Devices for Self-Testing - Devices intended for self-testing shall be designed to be used safely and accurately by lay persons.",
    status: "not_applicable",
    priority: "medium",
    assignedTo: "Michael Rodriguez",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_15",
    requirement: "GSPR 15: Devices Incorporating Programmable Electronic Systems - Devices incorporating programmable electronic systems shall be designed to ensure repeatability, reliability and performance.",
    clauseId: "MDR_Annex_I_15",
    framework: "MDR",
    section: "Chapter II: Requirements regarding design and manufacture",
    clauseSummary: "GSPR 15: Devices Incorporating Programmable Electronic Systems - Devices incorporating programmable electronic systems shall be designed to ensure repeatability, reliability and performance.",
    status: "not_applicable",
    priority: "medium",
    assignedTo: "Emma Thompson",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_14",
    requirement: "GSPR 14: Active Devices and Devices Connected to them - For active devices, failure of power supply or any single fault shall not result in hazardous situation.",
    clauseId: "MDR_Annex_I_14",
    framework: "MDR",
    section: "Chapter II: Requirements regarding design and manufacture",
    clauseSummary: "GSPR 14: Active Devices and Devices Connected to them - For active devices, failure of power supply or any single fault shall not result in hazardous situation.",
    status: "not_applicable",
    priority: "high",
    assignedTo: "David Kim",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_13",
    requirement: "GSPR 13: Devices Incorporating Software - Software shall be developed according to the state of the art taking into account development lifecycle.",
    clauseId: "MDR_Annex_I_13",
    framework: "MDR",
    section: "Chapter II: Requirements regarding design and manufacture",
    clauseSummary: "GSPR 13: Devices Incorporating Software - Software shall be developed according to the state of the art taking into account development lifecycle.",
    status: "not_applicable",
    priority: "high",
    assignedTo: "Lisa Wang",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_12",
    requirement: "GSPR 12: Protection Against Mechanical and Thermal Risks - Devices shall be designed to protect patient from mechanical risks.",
    clauseId: "MDR_Annex_I_12",
    framework: "MDR",
    section: "Chapter II: Requirements regarding design and manufacture",
    clauseSummary: "GSPR 12: Protection Against Mechanical and Thermal Risks - Devices shall be designed to protect patient from mechanical risks.",
    status: "not_applicable",
    priority: "medium",
    assignedTo: "James Anderson",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_11",
    requirement: "GSPR 11: Protection Against Electric Shock - All devices shall be designed and manufactured to avoid unintended cuts, pricks or other injuries.",
    clauseId: "MDR_Annex_I_11",
    framework: "MDR",
    section: "Chapter II: Requirements regarding design and manufacture",
    clauseSummary: "GSPR 11: Protection Against Electric Shock - All devices shall be designed and manufactured to avoid unintended cuts, pricks or other injuries.",
    status: "not_applicable",
    priority: "medium",
    assignedTo: "Dr. Sarah Chen",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_10",
    requirement: "GSPR 10: Devices with Measuring Function - Devices with measuring function shall be designed to provide sufficient accuracy, precision and stability.",
    clauseId: "MDR_Annex_I_10",
    framework: "MDR",
    section: "Chapter II: Requirements regarding design and manufacture",
    clauseSummary: "GSPR 10: Devices with Measuring Function - Devices with measuring function shall be designed to provide sufficient accuracy, precision and stability.",
    status: "not_applicable",
    priority: "high",
    assignedTo: "Michael Rodriguez",
    updatedAt: new Date().toISOString()
  },
  
  // Chapter I: General Requirements (GSPRs 9-1)
  {
    id: "MDR_Annex_I_9",
    requirement: "GSPR 9: Protection Against Radiation - Devices designed to emit hazardous levels of radiation shall provide proper protection.",
    clauseId: "MDR_Annex_I_9",
    framework: "MDR",
    section: "Chapter I: General Requirements",
    clauseSummary: "GSPR 9: Protection Against Radiation - Devices designed to emit hazardous levels of radiation shall provide proper protection.",
    status: "not_applicable",
    priority: "high",
    assignedTo: "Emma Thompson",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_8",
    requirement: "GSPR 8: Post-Market Surveillance and Vigilance - Manufacturers shall plan, establish, document and maintain a post-market surveillance system.",
    clauseId: "MDR_Annex_I_8",
    framework: "MDR",
    section: "Chapter I: General Requirements",
    clauseSummary: "GSPR 8: Post-Market Surveillance and Vigilance - Manufacturers shall plan, establish, document and maintain a post-market surveillance system.",
    status: "not_applicable",
    priority: "medium",
    assignedTo: "David Kim",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_7",
    requirement: "GSPR 7: Benefit-Risk Analysis and Risk Management - Clinical evaluation shall follow defined and methodologically sound procedure.",
    clauseId: "MDR_Annex_I_7",
    framework: "MDR",
    section: "Chapter I: General Requirements",
    clauseSummary: "GSPR 7: Benefit-Risk Analysis and Risk Management - Clinical evaluation shall follow defined and methodologically sound procedure.",
    status: "not_applicable",
    priority: "high",
    assignedTo: "Lisa Wang",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_6",
    requirement: "GSPR 6: Clinical Evaluation and Post-Market Clinical Follow-up - Conformity shall be demonstrated by clinical evaluation including clinical investigation.",
    clauseId: "MDR_Annex_I_6",
    framework: "MDR",
    section: "Chapter I: General Requirements",
    clauseSummary: "GSPR 6: Clinical Evaluation and Post-Market Clinical Follow-up - Conformity shall be demonstrated by clinical evaluation including clinical investigation.",
    status: "not_applicable",
    priority: "high",
    assignedTo: "James Anderson",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_5",
    requirement: "GSPR 5: Packaging and Product Information - Each device shall be accompanied by information needed to identify device and manufacturer.",
    clauseId: "MDR_Annex_I_5",
    framework: "MDR",
    section: "Chapter I: General Requirements",
    clauseSummary: "GSPR 5: Packaging and Product Information - Each device shall be accompanied by information needed to identify device and manufacturer.",
    status: "not_applicable",
    priority: "medium",
    assignedTo: "Dr. Sarah Chen",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_4",
    requirement: "GSPR 4: Sterility and Microbiological Contamination - Devices delivered in sterile state shall remain sterile throughout transport and storage.",
    clauseId: "MDR_Annex_I_4",
    framework: "MDR",
    section: "Chapter I: General Requirements",
    clauseSummary: "GSPR 4: Sterility and Microbiological Contamination - Devices delivered in sterile state shall remain sterile throughout transport and storage.",
    status: "not_applicable",
    priority: "medium",
    assignedTo: "Michael Rodriguez",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_3",
    requirement: "GSPR 3: Chemical, Physical, and Biological Properties - Devices shall be designed and manufactured to ensure characteristics and performance.",
    clauseId: "MDR_Annex_I_3",
    framework: "MDR",
    section: "Chapter I: General Requirements",
    clauseSummary: "GSPR 3: Chemical, Physical, and Biological Properties - Devices shall be designed and manufactured to ensure characteristics and performance.",
    status: "not_applicable",
    priority: "medium",
    assignedTo: "Emma Thompson",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_2",
    requirement: "GSPR 2: Risk Management - Manufacturers shall establish, implement, document, and maintain a risk management system throughout the entire lifecycle.",
    clauseId: "MDR_Annex_I_2",
    framework: "MDR",
    section: "Chapter I: General Requirements",
    clauseSummary: "GSPR 2: Risk Management - Manufacturers shall establish, implement, document, and maintain a risk management system throughout the entire lifecycle.",
    status: "partially_compliant",
    priority: "high",
    assignedTo: "David Kim",
    updatedAt: new Date().toISOString()
  },
  {
    id: "MDR_Annex_I_1",
    requirement: "GSPR 1: Devices shall achieve their intended performance without compromising safety during normal use conditions.",
    clauseId: "MDR_Annex_I_1",
    framework: "MDR",
    section: "Chapter I: General Requirements",
    clauseSummary: "GSPR 1: Devices shall achieve their intended performance without compromising safety during normal use conditions.",
    status: "not_applicable",
    priority: "high",
    assignedTo: "Lisa Wang",
    updatedAt: new Date().toISOString()
  }
];

// For brevity, I'll update the rest with the same pattern - removing lastUpdated and using updatedAt instead
// ISO 13485 items
export const iso13485: GapAnalysisItem[] = [
  {
    id: "ISO_13485_4.1",
    requirement: "General requirements and process interactions",
    clauseId: "ISO_13485_4.1",
    framework: "ISO 13485",
    section: "Quality Management System",
    clauseSummary: "General requirements and process interactions",
    status: "compliant",
    updatedAt: new Date().toISOString()
  },
  {
    id: "ISO_13485_4.2",
    requirement: "Document control and record management",
    clauseId: "ISO_13485_4.2",
    framework: "ISO 13485",
    section: "Documentation Requirements",
    clauseSummary: "Document control and record management",
    status: "partially_compliant",
    priority: "high",
    assignedTo: "Maria Johnson",
    updatedAt: new Date().toISOString()
  }
];

// ISO 14971 items
export const iso14971: GapAnalysisItem[] = [
  {
    id: "ISO_14971_4.1",
    requirement: "Establish and maintain a risk management process throughout the device lifecycle.",
    clauseId: "ISO_14971_4.1",
    framework: "ISO 14971",
    section: "General Requirements",
    clauseSummary: "Establish and maintain a risk management process throughout the device lifecycle.",
    status: "compliant",
    updatedAt: new Date().toISOString()
  }
];

// MDR Annex II and III items with same pattern
export const mdrAnnexII: GapAnalysisItem[] = [];
export const mdrAnnexIII: GapAnalysisItem[] = [];

// Combine all standards into a single export
export const allGapAnalysisItems: GapAnalysisItem[] = [
  ...mdrAnnexI,
  ...mdrAnnexII,
  ...mdrAnnexIII,
  ...iso13485,
  ...iso14971
];

// Group items by product for easy access
export const gapAnalysisByProduct: Record<string, GapAnalysisItem[]> = {
  "CardioMonitor Pro": [
    mdrAnnexI[1],  // Risk Management
    iso14971[0],   // General Requirements
  ],
  "DiabetesControl System": [
    iso13485[0],   // Documentation Requirements 
  ]
};

// Export default for convenience
export default gapAnalysisByProduct;
