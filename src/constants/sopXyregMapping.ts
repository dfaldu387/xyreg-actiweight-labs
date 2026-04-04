/**
 * Xyreg SOP/Form/List Module Mapping
 * 
 * Master reference for all 51 SOPs, 19 Forms, and 8 Lists with their
 * Xyreg module mappings, priority flags, and AI draft prompts.
 */

export interface XyregSopMapping {
  sopNumber: string;
  name: string;
  xyregModule: string;
  isCorePriority: boolean;
  /** QMS Map node ID this SOP maps to (if any) */
  qmsNodeId?: string;
  /** AI prompt sections for Document Studio draft generation */
  aiDraftSections?: string[];
}

export interface XyregFormListMapping {
  docNumber: string;
  name: string;
  documentType: 'Form' | 'List';
  xyregModule: string;
  /** Whether the module handles this digitally (no template needed) */
  isModuleManaged: boolean;
  /** Navigation path in Xyreg to access this */
  navigationPath?: string;
}

/**
 * All 51 Xyreg-native SOPs
 */
export const XYREG_SOPS: XyregSopMapping[] = [
  // QMS Foundation (SOP-001 to SOP-006)
  { sopNumber: 'SOP-001', name: 'Quality Management System', xyregModule: 'QMS Framework', isCorePriority: true, qmsNodeId: 'mgmt-resp' },
  { sopNumber: 'SOP-002', name: 'Document Control', xyregModule: 'Document Control', isCorePriority: true },
  { sopNumber: 'SOP-003', name: 'Record Control', xyregModule: 'Document Control', isCorePriority: true },
  { sopNumber: 'SOP-004', name: 'Management Review', xyregModule: 'Management Review', isCorePriority: true, qmsNodeId: 'mgmt-resp' },
  { sopNumber: 'SOP-005', name: 'Internal Audits', xyregModule: 'Audit Management', isCorePriority: true },
  { sopNumber: 'SOP-006', name: 'Training and Competence', xyregModule: 'Training Management', isCorePriority: true, qmsNodeId: 'resource-strategy' },

  // Core Technical (SOP-007 to SOP-018)
  { sopNumber: 'SOP-007', name: 'Risk Management', xyregModule: 'Risk Management', isCorePriority: true, qmsNodeId: 'risk-mgmt' },
  { sopNumber: 'SOP-008', name: 'Design and Development', xyregModule: 'Design Controls', isCorePriority: true, qmsNodeId: 'design-dev' },
  { sopNumber: 'SOP-009', name: 'Supplier Management', xyregModule: 'Supplier Management', isCorePriority: true, qmsNodeId: 'supplier-selection' },
  { sopNumber: 'SOP-010', name: 'Production and Process Controls', xyregModule: 'Production Monitoring', isCorePriority: true, qmsNodeId: 'production-monitoring' },
  { sopNumber: 'SOP-011', name: 'Control of Nonconforming Product', xyregModule: 'NCR Workflow', isCorePriority: true },
  { sopNumber: 'SOP-012', name: 'Corrective and Preventive Action (CAPA)', xyregModule: 'CAPA Module', isCorePriority: true, qmsNodeId: 'capa-loop' },
  { sopNumber: 'SOP-013', name: 'Complaint Handling', xyregModule: 'Complaints Module', isCorePriority: true, qmsNodeId: 'pms' },
  { sopNumber: 'SOP-014', name: 'Post-Market Surveillance (PMS)', xyregModule: 'PMS Module', isCorePriority: true, qmsNodeId: 'device-pms' },
  { sopNumber: 'SOP-015', name: 'Clinical Evaluation', xyregModule: 'Clinical Module', isCorePriority: true, qmsNodeId: 'vv-testing' },
  { sopNumber: 'SOP-016', name: 'Labeling and Packaging Control', xyregModule: 'Labeling Module', isCorePriority: true },
  { sopNumber: 'SOP-017', name: 'Change Control', xyregModule: 'Change Control', isCorePriority: true },
  { sopNumber: 'SOP-018', name: 'Control of Monitoring and Measuring Equipment', xyregModule: 'Calibration Management', isCorePriority: true, qmsNodeId: 'infra-training' },

  // Extended SOPs (SOP-019 to SOP-051)
  { sopNumber: 'SOP-019', name: 'Cybersecurity Management', xyregModule: 'Cybersecurity', isCorePriority: false },
  { sopNumber: 'SOP-020', name: 'Statistical Techniques', xyregModule: 'Quality Operations', isCorePriority: false },
  { sopNumber: 'SOP-021', name: 'Purchasing Control', xyregModule: 'Supplier Management', isCorePriority: false },
  { sopNumber: 'SOP-022', name: 'Vigilance and Field Safety', xyregModule: 'Vigilance Module', isCorePriority: true },
  { sopNumber: 'SOP-023', name: 'Device Service and Maintenance', xyregModule: 'Device Operations', isCorePriority: false },
  { sopNumber: 'SOP-024', name: 'Environmental Monitoring', xyregModule: 'Quality Operations', isCorePriority: false },
  { sopNumber: 'SOP-025', name: 'Sterilization Process Control', xyregModule: 'Quality Operations', isCorePriority: false },
  { sopNumber: 'SOP-026', name: 'Biocompatibility Evaluation', xyregModule: 'Quality Operations', isCorePriority: false },
  { sopNumber: 'SOP-027', name: 'Usability Engineering', xyregModule: 'Design Controls', isCorePriority: false },
  { sopNumber: 'SOP-028', name: 'Software Development Lifecycle (SDLC)', xyregModule: 'Design Controls', isCorePriority: false },
  { sopNumber: 'SOP-029', name: 'Electrical Safety and EMC', xyregModule: 'Quality Operations', isCorePriority: false },
  { sopNumber: 'SOP-030', name: 'Process Validation', xyregModule: 'Quality Operations', isCorePriority: false, qmsNodeId: 'process-validation' },
  { sopNumber: 'SOP-031', name: 'Verification and Validation', xyregModule: 'Design Controls', isCorePriority: false, qmsNodeId: 'vv-testing' },
  { sopNumber: 'SOP-032', name: 'Product Identification and Traceability', xyregModule: 'UDI Module', isCorePriority: false },
  { sopNumber: 'SOP-033', name: 'Preservation of Product', xyregModule: 'Quality Operations', isCorePriority: false },
  { sopNumber: 'SOP-034', name: 'Regulatory Submission Management', xyregModule: 'Regulatory Intelligence', isCorePriority: true, qmsNodeId: 'reg-planning' },
  { sopNumber: 'SOP-035', name: 'UDI Management', xyregModule: 'UDI Module', isCorePriority: false },
  { sopNumber: 'SOP-036', name: 'Technical Documentation Management', xyregModule: 'Document Control', isCorePriority: false },
  { sopNumber: 'SOP-037', name: 'Post-Market Clinical Follow-up (PMCF)', xyregModule: 'Clinical Module', isCorePriority: false },
  { sopNumber: 'SOP-038', name: 'Periodic Safety Update Report (PSUR)', xyregModule: 'PMS Module', isCorePriority: false },
  { sopNumber: 'SOP-039', name: 'Bill of Materials (BOM) Management', xyregModule: 'BOM Module', isCorePriority: false },
  { sopNumber: 'SOP-040', name: 'Shelf Life and Stability Testing', xyregModule: 'Quality Operations', isCorePriority: false },
  { sopNumber: 'SOP-041', name: 'Cleaning and Disinfection', xyregModule: 'Quality Operations', isCorePriority: false },
  { sopNumber: 'SOP-042', name: 'Customer Communication and Feedback', xyregModule: 'PMS Module', isCorePriority: false },
  { sopNumber: 'SOP-043', name: 'Outsourced Process Control', xyregModule: 'Supplier Management', isCorePriority: false },
  { sopNumber: 'SOP-044', name: 'Product Recall and Advisory Notice', xyregModule: 'Vigilance Module', isCorePriority: false },
  { sopNumber: 'SOP-045', name: 'EUDAMED Registration', xyregModule: 'Regulatory Intelligence', isCorePriority: false },
  { sopNumber: 'SOP-046', name: 'Data Integrity', xyregModule: 'QMS Framework', isCorePriority: false },
  { sopNumber: 'SOP-047', name: 'Combination Product Management', xyregModule: 'Regulatory Intelligence', isCorePriority: false },
  { sopNumber: 'SOP-048', name: 'In Vitro Diagnostic (IVD) Specific Procedures', xyregModule: 'Regulatory Intelligence', isCorePriority: false },
  { sopNumber: 'SOP-049', name: 'Human Factors Engineering', xyregModule: 'Design Controls', isCorePriority: false },
  { sopNumber: 'SOP-050', name: 'Continual Improvement', xyregModule: 'QMS Framework', isCorePriority: false },
  { sopNumber: 'SOP-051', name: 'Quality Agreement Management', xyregModule: 'Supplier Management', isCorePriority: false },
];

/**
 * Forms and Lists with module mapping
 */
export const XYREG_FORMS_AND_LISTS: XyregFormListMapping[] = [
  // Forms
  { docNumber: 'FORM-001-A', name: 'Document Change Order (DCO)', documentType: 'Form', xyregModule: 'Document Control', isModuleManaged: true, navigationPath: 'Settings > Document Control' },
  { docNumber: 'FORM-003-A', name: 'Management Review Meeting Minutes', documentType: 'Form', xyregModule: 'Management Review', isModuleManaged: false },
  { docNumber: 'FORM-004-B', name: 'Internal Audit Plan', documentType: 'Form', xyregModule: 'Audit Management', isModuleManaged: true, navigationPath: 'Quality Operations > Audits' },
  { docNumber: 'FORM-004-C', name: 'Internal Audit Report', documentType: 'Form', xyregModule: 'Audit Management', isModuleManaged: true, navigationPath: 'Quality Operations > Audits' },
  { docNumber: 'FORM-005-B', name: 'Training Roster', documentType: 'Form', xyregModule: 'Training Management', isModuleManaged: true, navigationPath: 'Settings > Training' },
  { docNumber: 'FORM-006-B', name: 'Design Review Meeting Minutes', documentType: 'Form', xyregModule: 'Design Controls', isModuleManaged: false },
  { docNumber: 'FORM-009-A', name: 'Supplier Quality Questionnaire', documentType: 'Form', xyregModule: 'Supplier Management', isModuleManaged: true, navigationPath: 'Quality Operations > Suppliers' },
  { docNumber: 'FORM-009-B', name: 'Supplier Evaluation Report', documentType: 'Form', xyregModule: 'Supplier Management', isModuleManaged: true, navigationPath: 'Quality Operations > Suppliers' },
  { docNumber: 'FORM-011-A', name: 'Nonconformance Report (NCR)', documentType: 'Form', xyregModule: 'NCR Workflow', isModuleManaged: true, navigationPath: 'Quality Operations > NCRs' },
  { docNumber: 'FORM-012-A', name: 'CAPA Request Form', documentType: 'Form', xyregModule: 'CAPA Module', isModuleManaged: true, navigationPath: 'Quality Operations > CAPA' },
  { docNumber: 'FORM-012-C', name: 'CAPA Record', documentType: 'Form', xyregModule: 'CAPA Module', isModuleManaged: true, navigationPath: 'Quality Operations > CAPA' },
  { docNumber: 'FORM-013-B', name: 'Complaint File', documentType: 'Form', xyregModule: 'Complaints Module', isModuleManaged: true, navigationPath: 'Quality Operations > Complaints' },
  { docNumber: 'FORM-013-C', name: 'Health Hazard Evaluation (HHE)', documentType: 'Form', xyregModule: 'Complaints Module', isModuleManaged: true, navigationPath: 'Quality Operations > Complaints' },
  { docNumber: 'FORM-016-A', name: 'Labeling Approval Form', documentType: 'Form', xyregModule: 'Labeling Module', isModuleManaged: false },
  { docNumber: 'FORM-017-A', name: 'Change Control Request (CCR)', documentType: 'Form', xyregModule: 'Change Control', isModuleManaged: true, navigationPath: 'Change Control' },
  { docNumber: 'FORM-018-B', name: 'Calibration Record', documentType: 'Form', xyregModule: 'Calibration Management', isModuleManaged: false },
  { docNumber: 'FORM-021-A', name: 'Incoming Inspection Record', documentType: 'Form', xyregModule: 'Quality Operations', isModuleManaged: false },
  { docNumber: 'FORM-022-A', name: 'Reportability Assessment Form', documentType: 'Form', xyregModule: 'Vigilance Module', isModuleManaged: true, navigationPath: 'Quality Operations > Complaints' },
  { docNumber: 'FORM-023-A', name: 'Service Report', documentType: 'Form', xyregModule: 'Device Operations', isModuleManaged: false },

  // Lists
  { docNumber: 'LIST-001-B', name: 'Master Document List (MDL)', documentType: 'List', xyregModule: 'Document Control', isModuleManaged: true, navigationPath: 'Settings > Document Control' },
  { docNumber: 'LIST-002-A', name: 'Record Retention Schedule', documentType: 'List', xyregModule: 'Document Control', isModuleManaged: false },
  { docNumber: 'LIST-004-A', name: 'Internal Audit Schedule', documentType: 'List', xyregModule: 'Audit Management', isModuleManaged: true, navigationPath: 'Quality Operations > Audits' },
  { docNumber: 'LIST-005-A', name: 'Training Matrix', documentType: 'List', xyregModule: 'Training Management', isModuleManaged: true, navigationPath: 'Settings > Training' },
  { docNumber: 'LIST-009-C', name: 'Approved Supplier List (ASL)', documentType: 'List', xyregModule: 'Supplier Management', isModuleManaged: true, navigationPath: 'Quality Operations > Suppliers' },
  { docNumber: 'LIST-012-B', name: 'CAPA Log', documentType: 'List', xyregModule: 'CAPA Module', isModuleManaged: true, navigationPath: 'Quality Operations > CAPA' },
  { docNumber: 'LIST-013-A', name: 'Complaint Log', documentType: 'List', xyregModule: 'Complaints Module', isModuleManaged: true, navigationPath: 'Quality Operations > Complaints' },
  { docNumber: 'LIST-018-A', name: 'Master Equipment List', documentType: 'List', xyregModule: 'Calibration Management', isModuleManaged: false },
];

/**
 * Get the 20 core priority SOPs that auto-seed into new companies
 */
export const CORE_PRIORITY_SOPS = XYREG_SOPS.filter(s => s.isCorePriority);

/**
 * Get the Xyreg module name for a given SOP number
 */
export function getXyregModuleForSop(sopNumber: string): string | undefined {
  return XYREG_SOPS.find(s => s.sopNumber === sopNumber)?.xyregModule;
}

/**
 * Get the Xyreg module for a given form/list document number
 */
export function getXyregModuleForFormList(docNumber: string): XyregFormListMapping | undefined {
  return XYREG_FORMS_AND_LISTS.find(f => f.docNumber === docNumber);
}
