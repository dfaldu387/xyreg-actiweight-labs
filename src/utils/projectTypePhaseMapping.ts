/**
 * Mapping between project types and their expected lifecycle phases
 */

export const PROJECT_TYPE_TO_PHASE_MAP: Record<string, string> = {
  // New Product
  'Feasibility Study': 'Concept',
  'New Model Development (NPD)': 'Design Planning',
  'Technology Development / Research': 'Concept',
  
  // Product Upgrade
  'Product Improvement / Feature Enhancement': 'Design Output',
  'Component or Material Change': 'Validation',
  'Labeling or Packaging Change': 'Design Transfer',
  'Software Update / Patch Release': 'Design Transfer',
  'Cybersecurity Enhancement': 'Verification',
  'CAPA Implementation': 'Post-Market Surveillance',
  'Compliance Remediation / Recertification': 'Technical Documentation',
  'Regulatory Submission (New Market)': 'Regulatory Submission',
  'Manufacturing Process Change': 'Design Transfer',
  'Production Site Transfer': 'Design Transfer',
  
  // Line Extension
  'Line Extension': 'Design Planning',
  
  // Legacy Product
  'Legacy Product': 'Post-Market Surveillance'
};

/**
 * Get the expected phase name based on project types
 */
export function getExpectedPhaseForProjectTypes(projectTypes: string[]): string {
  if (!projectTypes || projectTypes.length === 0) {
    return 'Not Determined';
  }
  
  // Use the first project type to determine expected phase
  const primaryProjectType = projectTypes[0];
  return PROJECT_TYPE_TO_PHASE_MAP[primaryProjectType] || 'Not Determined';
}

/**
 * Clean phase name by removing position prefix like "(01) "
 */
export function cleanPhaseName(phaseName: string): string {
  return phaseName.replace(/^\(\d+\)\s*/, '');
}
