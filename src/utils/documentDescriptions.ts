
import { DatabasePhaseService } from "@/services/databasePhaseService";
import { EnhancedPhaseService } from "@/services/enhancedPhaseService";

export interface DocumentDescription {
  name: string;
  description: string;
  type: string;
  phase?: string;
  markets?: string[];
  deviceClasses?: string[];
}

/**
 * Database-driven document descriptions - replaces static lifecycle phases
 */

/**
 * Get document descriptions from database templates
 */
export async function getDocumentDescriptions(companyId: string): Promise<Record<string, DocumentDescription>> {
  try {
    const phases = await EnhancedPhaseService.getCompanyPhases(companyId);
    const descriptions: Record<string, DocumentDescription> = {};

    for (const phase of phases) {
      for (const doc of phase.recommended_docs) {
        if (!descriptions[doc.name]) {
          descriptions[doc.name] = {
            name: doc.name,
            description: getStandardDescription(doc.name),
            type: doc.type,
            phase: phase.name,
            markets: [],
            deviceClasses: []
          };
        }
      }
    }

    return descriptions;
  } catch (error) {
    console.error('Error getting document descriptions:', error);
    return {};
  }
}

/**
 * Get description for a specific document
 */
export async function getDocumentDescription(companyId: string, documentName: string): Promise<DocumentDescription | null> {
  try {
    const descriptions = await getDocumentDescriptions(companyId);
    return descriptions[documentName] || null;
  } catch (error) {
    console.error('Error getting document description:', error);
    return null;
  }
}

/**
 * Standard document descriptions mapping
 */
function getStandardDescription(documentName: string): string {
  const descriptions: Record<string, string> = {
    // Quality Management
    "Quality Management Plan": "Plan detailing overall quality management strategy and processes.",
    "Internal Audit Reports": "Reports documenting the findings of internal quality system audits.",
    "Management Review Minutes": "Records documenting management reviews of the quality system.",
    "Periodic Audit / Review Schedule": "Schedule documenting periodic internal and external audits.",
    "Traceability Matrices (Req → Design → Verif → Valid → Risk)": "Documentation demonstrating traceability across requirements, design, verification, validation, and risk management.",
    
    // Design & Development
    "Design & Development Plan": "Device development processes, resources, timelines.",
    "Verification Test Reports (functional, EMC, biocomp., sterility, SW)": "Documentation of results from various verification tests.",
    "Biocompatibility Requirements": "Biocompatibility testing and evaluation.",
    "Calibration Certificates for Test Equipment": "Calibration documentation for test equipment.",
    "Design Review Records": "Documentation of formal design reviews to ensure compliance and effectiveness.",
    "EMC Requirements (IEC 60601-1-2)": "Documentation ensuring compliance with electromagnetic compatibility standards.",
    "Environmental & Sterilization Specs": "Specifications and procedures for environmental testing and sterilization.",
    "Packaging Design Drawings": "Technical drawings of packaging components.",
    "Packaging Validation Reports": "Reports documenting validation of packaging processes.",
    "Pre-Clinical / Pre-Study Protocols": "Protocols for pre-clinical testing to assess device performance and safety.",
    "Process Validation Protocols & Reports (sterility, shelf-life)": "Documentation of validation protocols and results for sterility and shelf-life.",
    "Risk Control Implementation Records": "Documentation detailing implementation of risk control measures.",
    "Software Architecture & Code Documentation": "Documentation detailing the software architecture and source code.",
    "Software Lifecycle Documentation (IEC 62304)": "Comprehensive documentation of the software development lifecycle.",
    "Software Validation Reports (IQ/OQ/PQ)": "Reports documenting software validation activities and outcomes.",
    "Sterilization & Shelf-Life Validation Summaries": "Reports summarizing validation of sterilization processes and product shelf-life.",
    "Test Method Development Plan": "Plan outlining methods for developing test procedures.",
    "Test Method Validation Reports": "Reports documenting validation of testing methods.",
    "Traceability Matrix (Inputs → Outputs → Controls)": "Documentation showing the traceability of design inputs, outputs, and risk controls.",
    "Updated Hazard Log / FMEA with Controls": "Updated documentation of identified hazards, risks, and implemented controls.",
    "Updated Traceability Matrix w/ Verification Links": "Document linking design inputs and outputs directly to verification activities.",
    "Verification Master Plan": "Plan outlining the strategy and procedures for verification activities.",
    "Verification Protocols & Acceptance Criteria": "Detailed procedures and criteria for verifying design and performance specifications.",
    
    // Regulatory Documentation
    "CE Technical File & EU Declaration of Conformity": "EU market entry technical and conformity documentation.",
    "Technical File / Design Dossier / Device Master Record": "Comprehensive compilation of documentation required for regulatory submissions and production.",
    "510(k) Submission / PMA Package": "FDA market submission documentation.",
    "ANVISA Registro": "Brazilian regulatory approval documentation.",
    "ARTG Inclusion": "Australian market regulatory documentation.",
    "CDSCO Device Registration": "Documentation for Indian regulatory approval.",
    "CN Registration Certificate application": "Regulatory documentation for China market approval.",
    "KR Marketing Authorization": "Regulatory documentation required for device approval in the South Korean market.",
    "Medical Device License (MDL) application": "Regulatory submission documentation required for Canadian market approval.",
    "Shonin / Ninsho dossier": "Regulatory submission documentation required for device approval in Japan.",
    
    // Concept & Feasibility
    "Business Case / Project Charter": "Project rationale, objectives, business justification.",
    "Concept Brief": "Defines initial concept, intended use, key features, target market, and regulatory strategy.",
    "Risk Management Report": "Comprehensive summary of identified risks and controls.",
    "User Needs Overview": "Consolidated user requirements.",
    "Early Competitive Landscape Summary": "Market competitor analysis and positioning.",
    "Draft Risk Management Plan": "Preliminary document outlining approach to managing risks.",
    "Feasibility Study Report (with risk inputs)": "Documentation assessing device feasibility with an emphasis on initial risk assessment.",
    "High-Level Architecture / Concept Diagram": "Visual diagrams outlining the device's overall system architecture and components.",
    "Initial Hazard Log / FMEA Entries": "Early documentation of identified hazards and failure modes for risk management.",
    "Intellectual Property (IP) Review": "Evaluation of intellectual property considerations and protection strategies.",
    "Preliminary Hazard Analysis (PHA)": "Early-stage analysis identifying potential hazards and their impacts.",
    "Preliminary Market Analysis": "Early assessment of market potential, size, and dynamics.",
    "Regulatory Strategy Outline": "Document outlining the regulatory approval strategy and pathways.",
    "Resource & Budget Feasibility Study": "Analysis of resource requirements and budget considerations.",
    
    // Design Validation & Transfer
    "Detailed CAD Drawings & BOM": "Technical drawings and Bill of Materials detailing device specifications.",
    "Device History File (DHF) Index": "Index documenting all development records maintained for regulatory compliance.",
    "Labeling & IFU Final": "Final versions of labels and Instructions for Use for the device.",
    "Supplier Qualification Records": "Documentation verifying qualifications and compliance of suppliers.",
    "Design Validation Reports (simulated & actual use)": "Reports documenting validation tests under real and simulated conditions.",
    "Electrical Schematics & PCB Layouts": "Detailed documentation of electrical designs and printed circuit board layouts.",
    "Executive Sign-Off on Risk Acceptance": "Formal approval from management accepting residual risks identified.",
    "Final Design Review Minutes": "Formal records documenting final design review and approval.",
    "Human Factors Use-Specifications": "Documentation detailing user interface requirements and usability considerations.",
    "Installation, Operation & Servicing Instructions Drafts": "Preliminary user manuals for installation, operation, and servicing of the device.",
    "Labeling Drafts & UDI Assignments": "Preliminary labeling and UDI documentation drafts.",
    "Manufacturing Process Flowcharts & Work Instructions": "Documentation detailing manufacturing processes and procedures.",
    "Project Schedule / Gantt Chart": "Detailed timeline for device development and launch milestones.",
    "Regulatory & Standards Mapping Matrix": "Matrix aligning product features and documentation with relevant standards and regulations.",
    "Regulatory Submission Roadmap": "Timeline and strategy outlining regulatory submission milestones.",
    "Risk Management Plan (Final)": "Comprehensive plan outlining risk management strategies and processes.",
    "Risk/Benefit Analysis & Residual Risk Summary": "Analysis comparing device risks against clinical benefits.",
    "Software Requirements Specification (SRS)": "Document outlining detailed software requirements.",
    "Stakeholder Requirements Specification": "Documentation detailing requirements from stakeholders.",
    "Supplier / Contract Manufacturer Agreements": "Formal agreements defining responsibilities and requirements with suppliers.",
    "Supplier Selection & Qualification Plan": "Plan detailing processes for selecting and qualifying suppliers.",
    "Usability Engineering File (UEF)": "Documentation detailing usability assessments, user interface design, and risk management related to user interactions.",
    "Use Environment & Maintenance Profiles": "Documentation outlining intended device usage environments and required maintenance activities.",
    "User Needs Specification (UNS)": "Detailed specification of user needs and intended use requirements.",
    "Validation Master Plan (Design, Clinical, Usability)": "Comprehensive plan detailing all validation activities for design, clinical, and usability aspects.",
    
    // Post-Market Surveillance
    "CAPA Procedure (Post-Market)": "Procedures for managing corrective and preventive actions.",
    "CAPA Records & Effectiveness Checks": "Documentation of CAPA actions and effectiveness.",
    "Clinical Evaluation Plan & Protocols": "Clinical evaluation strategy and methods.",
    "Clinical Investigation / Trial Protocols & CRFs": "Clinical trial documentation.",
    "Field Safety Corrective Action (FSCA) Reports": "Reports documenting corrective actions taken in response to identified safety issues post-market.",
    "Periodic Safety Update Reports (PSUR/PBRER)": "Reports summarizing ongoing safety surveillance data.",
    "Post-Market Clinical Follow-Up (PMCF) Plan": "Plan outlining post-market clinical data collection methods.",
    "Post-Market Risk Reassessment Updates": "Updates to risk assessments based on post-market data.",
    "Post-Market Surveillance (PMS) Plan": "Strategy and procedures for ongoing post-market device surveillance.",
    "Vigilance & Adverse Event Reporting Procedure": "Defined procedures for reporting vigilance and adverse events.",
    "Vigilance Reports (MDR, MedWatch, etc.)": "Reports documenting adverse events and vigilance activities submitted to regulatory authorities.",

    // Default description
    default: "Product development documentation as part of the design control process"
  };

  return descriptions[documentName] || descriptions.default;
}

/**
 * Get documents by category
 */
export async function getDocumentsByCategory(companyId: string, category: string): Promise<DocumentDescription[]> {
  try {
    const descriptions = await getDocumentDescriptions(companyId);
    return Object.values(descriptions).filter(doc => doc.type.toLowerCase() === category.toLowerCase());
  } catch (error) {
    console.error('Error getting documents by category:', error);
    return [];
  }
}

/**
 * Search documents by name or description
 */
export async function searchDocuments(companyId: string, searchTerm: string): Promise<DocumentDescription[]> {
  try {
    const descriptions = await getDocumentDescriptions(companyId);
    const term = searchTerm.toLowerCase();
    
    return Object.values(descriptions).filter(doc => 
      doc.name.toLowerCase().includes(term) || 
      doc.description.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error searching documents:', error);
    return [];
  }
}
