/**
 * Static SOP-to-QMS Node Mapping
 * 
 * Defines which SOPs are required for each QMS process node,
 * based on ISO 13485:2016 requirements and QMSR alignment.
 */

export type SOPTrack = 'ENG' | 'REG' | 'BUS';

export interface SOPRecommendation {
  sopNumber: string;      // e.g., "SOP-003"
  /**
   * One-line note explaining *why this SOP belongs to this node* (clause/regulatory
   * rationale). Stable across companies — kept in code on purpose.
   * The SOP's actual *title* is resolved at runtime from the company's live
   * document registry (and falls back to the canonical Xyreg SOP library).
   */
  clauseDescription: string;
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
  // RUNG 1 — Company Foundation
  // ============================================

  'mgmt-resp': [
    { sopNumber: 'SOP-001', clauseDescription: 'QMS scope, activation & top-management commitment (ISO 13485 §4.1 / §5.1)', track: 'BUS' },
    { sopNumber: 'SOP-002', clauseDescription: 'Document & records control — evidence of management commitment (ISO 13485 §4.2)', track: 'BUS' },
    { sopNumber: 'SOP-003', clauseDescription: 'Management review (ISO 13485 §5.6)', track: 'BUS' },
    { sopNumber: 'SOP-050', clauseDescription: 'Internal audit programme — input to management review (ISO 13485 §8.2.4)', track: 'BUS' },
  ],

  'resource-strategy': [
    { sopNumber: 'SOP-004', clauseDescription: 'Human resources, competency & training (ISO 13485 §6.2)', track: 'ENG' },
  ],

  'design-control': [
    {
      sopNumber: 'SOP-005',
      clauseDescription: 'Design & development planning (ISO 13485 §7.3.2)',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-006',
      clauseDescription: 'Design inputs (ISO 13485 §7.3.3)',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-007',
      clauseDescription: 'Design outputs (ISO 13485 §7.3.4)',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-008',
      clauseDescription: 'Design review (ISO 13485 §7.3.5)',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-009',
      clauseDescription: 'Design verification & validation (ISO 13485 §7.3.6–7.3.7)',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-010',
      clauseDescription: 'Design transfer (ISO 13485 §7.3.8) — manufacturing scope',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-011',
      clauseDescription: 'Design change control (ISO 13485 §7.3.9)',
      track: 'ENG',
    },
    {
      sopNumber: 'SOP-012',
      clauseDescription: 'Design History File / Technical Documentation (ISO 13485 §7.3.10)',
      track: 'ENG',
    },
  ],

  'infra-training': [
    { sopNumber: 'SOP-023', clauseDescription: 'Infrastructure & work environment (ISO 13485 §6.3–6.4)', track: 'BUS' },
    { sopNumber: 'SOP-024', clauseDescription: 'Equipment maintenance & calibration (ISO 13485 §6.3)', track: 'ENG' },
    { sopNumber: 'SOP-025', clauseDescription: 'Monitoring & measuring equipment control (ISO 13485 §7.6)', track: 'ENG' },
  ],

  // ============================================
  // RUNGS 2–4 — Device Engine
  // ============================================

  'reg-planning': [
    { sopNumber: 'SOP-013', clauseDescription: 'GSPR documentation & regulatory pathway planning (EU MDR Annex I)', track: 'REG' },
    { sopNumber: 'SOP-034', clauseDescription: 'Regulatory submissions process management', track: 'REG' },
    { sopNumber: 'SOP-035', clauseDescription: 'Technical File / Design Dossier management', track: 'REG' },
    { sopNumber: 'SOP-036', clauseDescription: 'Classification & conformity assessment (EU MDR / IVDR / UK / CH)', track: 'REG' },
  ],

  'design-inputs': [
    { sopNumber: 'SOP-005', clauseDescription: 'Design planning & project management (ISO 13485 §7.3.2)', track: 'ENG' },
    { sopNumber: 'SOP-006', clauseDescription: 'Requirements capture & design input documentation (ISO 13485 §7.3.3)', track: 'ENG' },
  ],

  'supplier-selection': [
    { sopNumber: 'SOP-016', clauseDescription: 'Supplier evaluation & qualification (ISO 13485 §7.4.1)', track: 'BUS' },
    { sopNumber: 'SOP-030', clauseDescription: 'Purchasing controls (ISO 13485 §7.4.1)', track: 'BUS' },
  ],

  'risk-mgmt': [
    { sopNumber: 'SOP-015', clauseDescription: 'Risk analysis & control (ISO 14971)', track: 'REG' },
  ],

  'design-dev': [
    { sopNumber: 'SOP-007', clauseDescription: 'Design output documentation (ISO 13485 §7.3.4)', track: 'ENG' },
    { sopNumber: 'SOP-008', clauseDescription: 'Design review procedures (ISO 13485 §7.3.5)', track: 'ENG' },
    { sopNumber: 'SOP-011', clauseDescription: 'Design change control (ISO 13485 §7.3.9)', track: 'ENG' },
  ],

  'supplier-controls': [
    { sopNumber: 'SOP-016', clauseDescription: 'Ongoing supplier monitoring & re-evaluation (ISO 13485 §7.4.3)', track: 'BUS' },
    { sopNumber: 'SOP-030', clauseDescription: 'Purchasing information & verification (ISO 13485 §7.4.2)', track: 'BUS' },
    { sopNumber: 'SOP-043', clauseDescription: 'Incoming inspection of purchased product (ISO 13485 §7.4.3)', track: 'BUS' },
  ],

  'vv-testing': [
    { sopNumber: 'SOP-009', clauseDescription: 'Design verification & validation (ISO 13485 §7.3.6–7.3.7)', track: 'ENG' },
    { sopNumber: 'SOP-014', clauseDescription: 'Clinical evaluation supporting validation (EU MDR clinical pathway)', track: 'REG' },
  ],

  'process-validation': [
    { sopNumber: 'SOP-018', clauseDescription: 'Production process validation (ISO 13485 §7.5.6)', track: 'ENG' },
    { sopNumber: 'SOP-017', clauseDescription: 'Production & service provision controls (ISO 13485 §7.5.1)', track: 'ENG' },
  ],

  'production-monitoring': [
    { sopNumber: 'SOP-010', clauseDescription: 'Design transfer to production (ISO 13485 §7.3.8)', track: 'ENG' },
    { sopNumber: 'SOP-019', clauseDescription: 'Product identification & traceability / UDI (ISO 13485 §7.5.8)', track: 'REG' },
    { sopNumber: 'SOP-020', clauseDescription: 'Labelling & packaging controls (ISO 13485 §7.5.1)', track: 'REG' },
    { sopNumber: 'SOP-031', clauseDescription: 'Configuration management', track: 'BUS' },
    { sopNumber: 'SOP-033', clauseDescription: 'Product preservation & storage (ISO 13485 §7.5.11)', track: 'BUS' },
    { sopNumber: 'SOP-051', clauseDescription: 'Device History Record / batch records (ISO 13485 §7.5.1)', track: 'ENG' },
  ],

  // ============================================
  // RUNG 5 — Company Feedback
  // ============================================

  'pms': [
    { sopNumber: 'SOP-022', clauseDescription: 'PMS plan, data collection & analysis (ISO 13485 §8.2.1)', track: 'REG' },
    { sopNumber: 'SOP-021', clauseDescription: 'Customer feedback & complaint handling (ISO 13485 §8.2.2)', track: 'REG' },
    { sopNumber: 'SOP-042', clauseDescription: 'Trend analysis & signal detection (ISO 13485 §8.4)', track: 'REG' },
    { sopNumber: 'SOP-014', clauseDescription: 'Clinical evaluation refresh (EU MDR clinical pathway)', track: 'REG' },
    { sopNumber: 'SOP-044', clauseDescription: 'Periodic Safety Update Report — PSUR (EU MDR Class IIa+)', track: 'REG' },
    { sopNumber: 'SOP-048', clauseDescription: 'Post-Market Clinical Follow-up — PMCF (EU MDR clinical pathway)', track: 'REG' },
  ],

  'capa-loop': [
    { sopNumber: 'SOP-028', clauseDescription: 'CAPA procedures (ISO 13485 §8.5.2–8.5.3)', track: 'REG' },
    { sopNumber: 'SOP-032', clauseDescription: 'Nonconforming product control (ISO 13485 §8.3)', track: 'BUS' },
    { sopNumber: 'SOP-037', clauseDescription: 'Field Safety Corrective Action (FSCA)', track: 'REG' },
    { sopNumber: 'SOP-038', clauseDescription: 'Vigilance reporting to competent authorities', track: 'REG' },
  ],

  // ============================================
  // RUNG 5 — Device Feedback (mirrors company, scoped per device)
  // ============================================

  'device-pms': [
    { sopNumber: 'SOP-022', clauseDescription: 'PMS plan, data collection & analysis (ISO 13485 §8.2.1)', track: 'REG' },
    { sopNumber: 'SOP-021', clauseDescription: 'Customer feedback & complaint handling (ISO 13485 §8.2.2)', track: 'REG' },
    { sopNumber: 'SOP-042', clauseDescription: 'Trend analysis & signal detection (ISO 13485 §8.4)', track: 'REG' },
    { sopNumber: 'SOP-014', clauseDescription: 'Clinical evaluation refresh (EU MDR clinical pathway)', track: 'REG' },
    { sopNumber: 'SOP-044', clauseDescription: 'Periodic Safety Update Report — PSUR (EU MDR Class IIa+)', track: 'REG' },
    { sopNumber: 'SOP-048', clauseDescription: 'Post-Market Clinical Follow-up — PMCF (EU MDR clinical pathway)', track: 'REG' },
  ],

  'device-capa': [
    { sopNumber: 'SOP-028', clauseDescription: 'CAPA procedures (ISO 13485 §8.5.2–8.5.3)', track: 'REG' },
    { sopNumber: 'SOP-032', clauseDescription: 'Nonconforming product control (ISO 13485 §8.3)', track: 'BUS' },
    { sopNumber: 'SOP-037', clauseDescription: 'Field Safety Corrective Action (FSCA)', track: 'REG' },
    { sopNumber: 'SOP-038', clauseDescription: 'Vigilance reporting to competent authorities', track: 'REG' },
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
