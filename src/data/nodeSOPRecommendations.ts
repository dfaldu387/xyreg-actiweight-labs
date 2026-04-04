/**
 * Static SOP-to-QMS Node Mapping
 * 
 * Defines which SOPs are required for each QMS process node,
 * based on ISO 13485:2016 requirements and QMSR alignment.
 */

export type SOPTrack = 'ENG' | 'REG' | 'BUS';

export interface SOPRecommendation {
  sopNumber: string;      // e.g., "SOP-003"
  sopName: string;        // e.g., "Management Review"
  description: string;    // Brief description of the SOP's purpose
  track: SOPTrack;
}

/**
 * SOP recommendations mapped to QMS node IDs
 * 
 * Foundation Track (Company Level):
 * - mgmt-resp: Management Responsibility
 * - resource-strategy: Resource Strategy
 * - infra-env: Infrastructure & Environment
 * 
 * Feedback Track (Company Level):
 * - pms: Post-Market Surveillance
 * - capa-loop: CAPA Loop
 * 
 * Device Engine (Device Level) - Rungs 2-4:
 * - device-engine: Combined device processes
 */
export const NODE_SOP_RECOMMENDATIONS: Record<string, SOPRecommendation[]> = {
  // ============================================
  // FOUNDATION TRACK (Rung 1 - Company Level)
  // ============================================
  
  'mgmt-resp': [
    {
      sopNumber: 'SOP-003',
      sopName: 'Management Review',
      description: 'Management responsibility and periodic review procedures per ISO 13485 5.6',
      track: 'BUS',
    },
    {
      sopNumber: 'SOP-015',
      sopName: 'Risk Management',
      description: 'Primary framework for top management risk oversight per ISO 14971',
      track: 'REG',
    },
  ],

  'resource-strategy': [
    {
      sopNumber: 'SOP-004',
      sopName: 'Personnel and Training',
      description: 'Human resources, competency management and training records per ISO 13485 6.2',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-016',
      sopName: 'Supplier Evaluation and Control',
      description: 'Resource procurement and supplier qualification per ISO 13485 7.4',
      track: 'BUS',
    },
  ],

  'infra-training': [
    {
      sopNumber: 'SOP-017',
      sopName: 'Production and Service Provision',
      description: 'Equipment maintenance and environment controls per ISO 13485 6.3-6.4',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-018',
      sopName: 'Process Validation',
      description: 'Environmental and utility validation procedures per ISO 13485 7.5.6',
      track: 'ENG',
    },
  ],

  // ============================================
  // DEVICE ENGINE (Rungs 2-4 - Device Level)
  // ============================================

  'reg-planning': [
    {
      sopNumber: 'SOP-013',
      sopName: 'General Safety and Performance Requirements',
      description: 'GSPR documentation and regulatory pathway planning',
      track: 'REG',
    },
  ],

  'design-inputs': [
    {
      sopNumber: 'SOP-005',
      sopName: 'Design and Development Planning',
      description: 'Design planning and project management per ISO 13485 7.3.1',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-006',
      sopName: 'Design Inputs',
      description: 'Requirements capture and design input documentation per ISO 13485 7.3.3',
      track: 'ENG',
    },
  ],

  'supplier-selection': [
    {
      sopNumber: 'SOP-016',
      sopName: 'Supplier Evaluation and Control',
      description: 'Supplier qualification and selection per ISO 13485 7.4.1',
      track: 'BUS',
    },
  ],

  'risk-mgmt': [
    {
      sopNumber: 'SOP-015',
      sopName: 'Risk Management',
      description: 'Risk analysis and control per ISO 14971',
      track: 'REG',
    },
  ],

  'design-dev': [
    {
      sopNumber: 'SOP-007',
      sopName: 'Design Outputs',
      description: 'Design output documentation per ISO 13485 7.3.4',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-008',
      sopName: 'Design Review',
      description: 'Design review procedures per ISO 13485 7.3.5',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-011',
      sopName: 'Design Changes',
      description: 'Design change control per ISO 13485 7.3.9',
      track: 'ENG',
    },
  ],

  'supplier-controls': [
    {
      sopNumber: 'SOP-016',
      sopName: 'Supplier Evaluation and Control',
      description: 'Ongoing supplier monitoring and control per ISO 13485 7.4.3',
      track: 'BUS',
    },
  ],

  'vv-testing': [
    {
      sopNumber: 'SOP-009',
      sopName: 'Design Verification and Validation',
      description: 'V&V testing procedures per ISO 13485 7.3.6-7.3.7',
      track: 'ENG',
    },
  ],

  'process-validation': [
    {
      sopNumber: 'SOP-018',
      sopName: 'Process Validation',
      description: 'Production process validation per ISO 13485 7.5.6',
      track: 'ENG',
    },
  ],

  'production-monitoring': [
    {
      sopNumber: 'SOP-010',
      sopName: 'Design Transfer',
      description: 'Design transfer to production per ISO 13485 7.3.8',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-012',
      sopName: 'Design History File / Technical Documentation',
      description: 'DHF/DMR documentation per ISO 13485 7.3.10',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-019',
      sopName: 'Identification, Traceability, and UDI',
      description: 'Product identification and traceability per ISO 13485 7.5.8',
      track: 'REG',
    },
    {
      sopNumber: 'SOP-020',
      sopName: 'Labeling and Packaging Controls',
      description: 'Labeling requirements per ISO 13485 7.5.1',
      track: 'REG',
    },
  ],

  // ============================================
  // FEEDBACK TRACK (Rung 5 - Company Level)
  // ============================================

  'pms': [
    {
      sopNumber: 'SOP-014',
      sopName: 'Clinical Evaluation',
      description: 'Clinical evaluation and PMCF link per ISO 13485 8.2.1',
      track: 'REG',
    },
    {
      sopNumber: 'SOP-022',
      sopName: 'Post-Market Surveillance',
      description: 'PMS data collection and analysis per ISO 13485 8.2.1-8.2.3',
      track: 'REG',
    },
  ],

  'capa-loop': [
    {
      sopNumber: 'SOP-021',
      sopName: 'Complaints and Vigilance',
      description: 'Customer feedback and vigilance reporting per ISO 13485 8.2.2',
      track: 'REG',
    },
    {
      sopNumber: 'SOP-028',
      sopName: 'Corrective and Preventive Action',
      description: 'CAPA procedures per ISO 13485 8.5.2-8.5.3',
      track: 'REG',
    },
  ],
};

/**
 * Get the expected SOP count for a node
 */
export function getExpectedSOPCount(nodeId: string): number {
  return NODE_SOP_RECOMMENDATIONS[nodeId]?.length ?? 0;
}

/**
 * Get track badge styles
 */
export const TRACK_BADGE_STYLES: Record<SOPTrack, { bg: string; text: string }> = {
  ENG: { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  REG: { bg: 'bg-purple-50', text: 'text-purple-700' },
  BUS: { bg: 'bg-amber-50', text: 'text-amber-700' },
};
