/**
 * Helix OS Node Configuration
 * 
 * Defines the 5-rung, 3-track architecture for the QMS Process Control Map.
 * Separates Company-Level Foundation (Rungs 1 & 5) from Device-Level Execution (Rungs 2-4).
 */

import type { RBRDocumentPrefix } from '@/types/riskBasedRationale';

export type HelixTrack = 'regulatory' | 'engineering' | 'management';
export type HelixLevel = 'company' | 'device';
export type HelixRung = 1 | 2 | 3 | 4 | 5;
export type HelixNodeStatus = 'dormant' | 'active' | 'validated' | 'critical';

export interface HelixNodeConfig {
  id: string;
  label: string;
  shortLabel: string;
  rung: HelixRung;
  level: HelixLevel;
  track: HelixTrack;
  qmsrClause: string;
  isoClause: string; // ISO 13485:2016 reference (mirrors QMSR)
  nestedRBR?: RBRDocumentPrefix;
  nestedRBRLabel?: string;
  table?: string;
  conditionalOn?: 'hasSoftware' | 'hasImplantable';
  description: string;
}

/**
 * Track colors for visual consistency - Light mode optimized
 */
export const TRACK_COLORS = {
  regulatory: {
    primary: 'hsl(280, 70%, 50%)',
    glow: 'hsl(280, 70%, 60%)',
    bg: 'hsl(280, 50%, 95%)',
    border: 'hsl(280, 60%, 70%)',
    text: 'hsl(280, 70%, 35%)',
    label: 'REG',
  },
  engineering: {
    primary: 'hsl(185, 80%, 40%)',
    glow: 'hsl(185, 80%, 50%)',
    bg: 'hsl(185, 50%, 95%)',
    border: 'hsl(185, 60%, 65%)',
    text: 'hsl(185, 80%, 30%)',
    label: 'ENG',
  },
  management: {
    primary: 'hsl(35, 92%, 45%)',
    glow: 'hsl(35, 92%, 55%)',
    bg: 'hsl(35, 50%, 95%)',
    border: 'hsl(35, 70%, 65%)',
    text: 'hsl(35, 85%, 30%)',
    label: 'BUS (MGMT)',
  },
} as const;

/**
 * Status colors for node pulse indicators
 */
export const STATUS_COLORS = {
  dormant: {
    primary: 'hsl(215, 20%, 40%)',
    glow: 'hsl(215, 20%, 50%)',
    bg: 'hsl(215, 20%, 20%)',
    text: 'hsl(215, 20%, 60%)',
  },
  active: {
    primary: 'hsl(45, 96%, 53%)',
    glow: 'hsl(45, 96%, 63%)',
    bg: 'hsl(45, 50%, 15%)',
    text: 'hsl(45, 90%, 70%)',
  },
  validated: {
    primary: 'hsl(142, 60%, 45%)',
    glow: 'hsl(142, 60%, 55%)',
    bg: 'hsl(142, 40%, 15%)',
    text: 'hsl(142, 60%, 65%)',
  },
  critical: {
    primary: 'hsl(0, 84%, 60%)',
    glow: 'hsl(0, 84%, 70%)',
    bg: 'hsl(0, 50%, 15%)',
    text: 'hsl(0, 80%, 70%)',
  },
} as const;

/**
 * The 14 QMSR nodes organized by rung and track
 * 
 * Rung 1 & 5: Company Level (Foundation & Feedback)
 * Rung 2, 3, 4: Device Level (The Engine)
 */
export const HELIX_NODE_CONFIGS: HelixNodeConfig[] = [
  // ============ RUNG 1: Company Foundation ============
  {
    id: 'mgmt-resp',
    label: 'Management Responsibility',
    shortLabel: 'Mgmt',
    rung: 1,
    level: 'company',
    track: 'regulatory',
    qmsrClause: '5.1-5.6',
    isoClause: '5.1-5.6',
    description: 'Quality policy, objectives, and management commitment to the QMS.',
  },
  {
    id: 'resource-strategy',
    label: 'Resource Strategy',
    shortLabel: 'Resources',
    rung: 1,
    level: 'company',
    track: 'engineering',
    qmsrClause: '6.1-6.4',
    isoClause: '6.1-6.4',
    nestedRBR: 'RBR-TRN',
    nestedRBRLabel: 'Training Effectiveness',
    table: null,
    description: 'Provision of resources, competence, and work environment.',
  },
  {
    id: 'infra-training',
    label: 'Infrastructure & Environment',
    shortLabel: 'Infra',
    rung: 1,
    level: 'company',
    track: 'management',
    qmsrClause: '6.3-6.4',
    isoClause: '6.3-6.4',
    description: 'Infrastructure (buildings, equipment, IT systems) and work environment controls.',
  },
  {
    id: 'design-control',
    label: 'Design Control',
    shortLabel: 'Design',
    rung: 1,
    level: 'company',
    track: 'engineering',
    qmsrClause: '7.3',
    isoClause: '7.3',
    description: 'Master design & development control framework — planning, inputs, outputs, reviews, V&V, transfer, and changes (enterprise-level procedures; per-device records live in the Device Engine).',
  },

  // ============ RUNG 2: Device Upstream ============
  {
    id: 'reg-planning',
    label: 'Regulatory Planning',
    shortLabel: 'Reg Plan',
    rung: 2,
    level: 'device',
    track: 'regulatory',
    qmsrClause: '4.2.3, 7.1',
    isoClause: '4.2.3, 7.1',
    nestedRBR: 'RBR-REG',
    nestedRBRLabel: 'Pathway Selection',
    table: null,
    description: 'Regulatory pathway selection and submission planning.',
  },
  {
    id: 'design-inputs',
    label: 'Design Inputs',
    shortLabel: 'Inputs',
    rung: 2,
    level: 'device',
    track: 'engineering',
    qmsrClause: '7.3.2-7.3.3',
    isoClause: '7.3.2-7.3.3',
    description: 'Design input requirements derived from user needs and intended use.',
  },
  {
    id: 'supplier-selection',
    label: 'Supplier Selection',
    shortLabel: 'Suppliers',
    rung: 2,
    level: 'device',
    track: 'management',
    qmsrClause: '7.4.1',
    isoClause: '7.4.1',
    nestedRBR: 'RBR-SUP',
    nestedRBRLabel: 'Supplier Criticality',
    table: 'supplier_criticality_rationales',
    description: 'Supplier evaluation, selection, and qualification.',
  },

  // ============ RUNG 3: Device Execution ============
  {
    id: 'risk-mgmt',
    label: 'Risk Management',
    shortLabel: 'Risk',
    rung: 3,
    level: 'device',
    track: 'regulatory',
    qmsrClause: '7.1, 7.3.3',
    isoClause: '7.1, 7.3.3',
    description: 'Risk analysis, evaluation, and control per ISO 14971.',
  },
  {
    id: 'design-dev',
    label: 'Design & Development',
    shortLabel: 'D&D',
    rung: 3,
    level: 'device',
    track: 'engineering',
    qmsrClause: '7.3.4-7.3.5',
    isoClause: '7.3.4-7.3.5',
    nestedRBR: 'RBR-DCH',
    nestedRBRLabel: 'Design Change',
    table: 'design_change_rationales',
    description: 'Design output, review, and transfer activities.',
  },
  {
    id: 'supplier-controls',
    label: 'Supplier Controls',
    shortLabel: 'Controls',
    rung: 3,
    level: 'device',
    track: 'management',
    qmsrClause: '7.4.2-7.4.3',
    isoClause: '7.4.2-7.4.3',
    description: 'Purchasing information, verification, and supplier monitoring.',
  },

  // ============ RUNG 4: Device Verification ============
  {
    id: 'vv-testing',
    label: 'Verification & Validation',
    shortLabel: 'V&V',
    rung: 4,
    level: 'device',
    track: 'regulatory',
    qmsrClause: '7.3.6-7.3.7',
    isoClause: '7.3.6-7.3.7',
    nestedRBR: 'RBR-SAM',
    nestedRBRLabel: 'Statistical Rationale',
    table: 'sample_size_rationales',
    description: 'Design verification and validation, including clinical evaluation.',
  },
  {
    id: 'process-validation',
    label: 'Process Validation',
    shortLabel: 'PV',
    rung: 4,
    level: 'device',
    track: 'engineering',
    qmsrClause: '7.5.6',
    isoClause: '7.5.6',
    nestedRBR: 'RBR-ENG',
    nestedRBRLabel: 'Validation Approach',
    table: 'process_validation_rationales',
    description: 'Validation of production and service provision processes.',
  },
  {
    id: 'production-monitoring',
    label: 'Production & Monitoring',
    shortLabel: 'Prod',
    rung: 4,
    level: 'device',
    track: 'management',
    qmsrClause: '7.5.1-7.5.5',
    isoClause: '7.5.1-7.5.5',
    description: 'Production controls, identification, traceability, and monitoring.',
  },

  // ============ RUNG 5: Company Feedback ============
  {
    id: 'pms',
    label: 'Post-Market Surveillance',
    shortLabel: 'PMS',
    rung: 5,
    level: 'company',
    track: 'regulatory',
    qmsrClause: '8.2.1-8.2.3',
    isoClause: '8.2.1-8.2.3',
    nestedRBR: 'RBR-CLE',
    nestedRBRLabel: 'Clinical Evaluation',
    table: null,
    description: 'Feedback, complaint handling, and post-market clinical follow-up.',
  },
  {
    id: 'capa-loop',
    label: 'CAPA Loop',
    shortLabel: 'CAPA',
    rung: 5,
    level: 'company',
    track: 'engineering',
    qmsrClause: '8.5.2-8.5.3',
    isoClause: '8.5.2-8.5.3',
    nestedRBR: 'RBR-CAP',
    nestedRBRLabel: 'CAPA Priority',
    table: 'capa_priority_rationales',
    description: 'Corrective and preventive action system (company-wide).',
  },

  // ============ RUNG 5: Device Feedback (mirrors company but scoped to product) ============
  {
    id: 'device-pms',
    label: 'Device PMS',
    shortLabel: 'PMS',
    rung: 5,
    level: 'device',
    track: 'regulatory',
    qmsrClause: '8.2.1-8.2.3',
    isoClause: '8.2.1-8.2.3',
    description: 'Product-specific post-market surveillance and vigilance.',
  },
  {
    id: 'device-capa',
    label: 'Device CAPA',
    shortLabel: 'CAPA',
    rung: 5,
    level: 'device',
    track: 'engineering',
    qmsrClause: '8.5.2-8.5.3',
    isoClause: '8.5.2-8.5.3',
    nestedRBR: 'RBR-CAP',
    nestedRBRLabel: 'CAPA Priority',
    table: 'capa_priority_rationales',
    description: 'Product-specific corrective and preventive actions.',
  },
];

/**
 * Get nodes by rung
 */
export function getNodesByRung(rung: HelixRung): HelixNodeConfig[] {
  return HELIX_NODE_CONFIGS.filter(node => node.rung === rung);
}

/**
 * Get nodes by track
 */
export function getNodesByTrack(track: HelixTrack): HelixNodeConfig[] {
  return HELIX_NODE_CONFIGS.filter(node => node.track === track);
}

/**
 * Get nodes by level (company or device)
 */
export function getNodesByLevel(level: HelixLevel): HelixNodeConfig[] {
  return HELIX_NODE_CONFIGS.filter(node => node.level === level);
}

/**
 * Rung metadata for display
 */
export const RUNG_METADATA = {
  1: { label: 'Foundation', level: 'company' as HelixLevel, description: 'Company-level QMS infrastructure' },
  2: { label: 'Upstream', level: 'device' as HelixLevel, description: 'Device planning and inputs' },
  3: { label: 'Execution', level: 'device' as HelixLevel, description: 'Design and development activities' },
  4: { label: 'Verification', level: 'device' as HelixLevel, description: 'Testing and validation' },
  5: { label: 'Feedback', level: 'company' as HelixLevel, description: 'Post-market and improvement' },
} as const;

/**
 * Define rung connections (vertical lines between tracks)
 */
export const RUNG_CONNECTIONS = [
  { rung: 1, from: 'mgmt-resp', to: 'resource-strategy' },
  { rung: 1, from: 'resource-strategy', to: 'infra-training' },
  { rung: 2, from: 'reg-planning', to: 'design-inputs' },
  { rung: 2, from: 'design-inputs', to: 'supplier-selection' },
  { rung: 3, from: 'risk-mgmt', to: 'design-dev' },
  { rung: 3, from: 'design-dev', to: 'supplier-controls' },
  { rung: 4, from: 'vv-testing', to: 'process-validation' },
  { rung: 4, from: 'process-validation', to: 'production-monitoring' },
  { rung: 5, from: 'pms', to: 'capa-loop' },
  // Device-level Rung 5 vertical connection
  { rung: 5, from: 'device-pms', to: 'device-capa' },
] as const;

/**
 * Define horizontal flow connections (along tracks)
 */
export const TRACK_FLOW_CONNECTIONS = [
  // Regulatory track flow (company level)
  { from: 'mgmt-resp', to: 'reg-planning', track: 'regulatory' as HelixTrack },
  { from: 'reg-planning', to: 'risk-mgmt', track: 'regulatory' as HelixTrack },
  { from: 'risk-mgmt', to: 'vv-testing', track: 'regulatory' as HelixTrack },
  { from: 'vv-testing', to: 'pms', track: 'regulatory' as HelixTrack },
  // Engineering track flow (company level)
  { from: 'resource-strategy', to: 'design-inputs', track: 'engineering' as HelixTrack },
  { from: 'design-inputs', to: 'design-dev', track: 'engineering' as HelixTrack },
  { from: 'design-dev', to: 'process-validation', track: 'engineering' as HelixTrack },
  { from: 'process-validation', to: 'capa-loop', track: 'engineering' as HelixTrack },
  // Management track flow (company level)
  { from: 'infra-training', to: 'supplier-selection', track: 'management' as HelixTrack },
  { from: 'supplier-selection', to: 'supplier-controls', track: 'management' as HelixTrack },
  { from: 'supplier-controls', to: 'production-monitoring', track: 'management' as HelixTrack },
  // Device-level Rung 5 connections (from Rung 4 to device feedback)
  { from: 'vv-testing', to: 'device-pms', track: 'regulatory' as HelixTrack },
  { from: 'process-validation', to: 'device-capa', track: 'engineering' as HelixTrack },
] as const;
