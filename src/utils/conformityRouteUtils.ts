import { normalizeRiskClass } from './normalizeRiskClass';

export interface ConformityRoute {
  value: string;
  label: string;
  forClasses: string[];
}

export const CONFORMITY_ROUTES: ConformityRoute[] = [
  { value: 'Self-Declaration (Annex IV)', label: 'Self-Declaration (Annex IV)', forClasses: ['I'] },
  { value: 'Annex IX (QMS + TD)', label: 'Annex IX (QMS + Technical Documentation)', forClasses: ['Is', 'Im', 'Ir', 'IIa', 'IIb', 'III'] },
  { value: 'Annex X (Type Examination)', label: 'Annex X (Type Examination)', forClasses: ['IIb', 'III'] },
  { value: 'Annex XI Part A (Production QA)', label: 'Annex XI Part A (Production QA)', forClasses: ['IIa', 'IIb'] },
  { value: 'Annex XI Part B (Product Verification)', label: 'Annex XI Part B (Product Verification)', forClasses: ['IIa'] },
  { value: 'Annex XIII (Custom-made)', label: 'Annex XIII (Custom-made Devices)', forClasses: ['I', 'Is', 'Im', 'Ir', 'IIa', 'IIb', 'III'] },
];

/**
 * Get the suggested conformity assessment route based on device risk class
 */
export function getSuggestedConformityRoute(riskClass: string | undefined | null): string | null {
  if (!riskClass) return null;
  
  const normalized = normalizeRiskClass(riskClass);
  if (!normalized) return null;
  
  // EU MDR conformity assessment route mapping
  switch (normalized) {
    case 'I':
      return 'Self-Declaration (Annex IV)';
    case 'Is':
    case 'Im':
    case 'Ir':
      // Class I with sterile/measuring/reusable surgical requires NB involvement
      return 'Annex IX (QMS + TD)';
    case 'IIa':
      return 'Annex IX (QMS + TD)';
    case 'IIb':
      return 'Annex IX (QMS + TD)';
    case 'III':
      return 'Annex IX (QMS + TD)';
    default:
      return null;
  }
}

export const CONFORMITY_ROUTE_DESCRIPTIONS: Record<string, string> = {
  'Self-Declaration (Annex IV)': 'For Class I devices. Manufacturer declares conformity without Notified Body involvement (EU Declaration of Conformity per Annex IV).',
  'Annex IX (QMS + TD)': 'Full Quality Management System and Technical Documentation assessment. Most common for Class IIa and above.',
  'Annex X (Type Examination)': 'Assessment of a representative sample/prototype. Often combined with Annex XI.',
  'Annex XI Part A (Production QA)': 'Quality assurance focusing on production processes.',
  'Annex XI Part B (Product Verification)': 'Examination and testing of every product or batch.',
  'Annex XIII (Custom-made)': 'Specific route for custom-made devices.',
};

/**
 * Get the detailed help content for conformity routes
 */
export function getConformityRouteHelpContent(): string {
  return `The Conformity Assessment Route determines the regulatory pathway for demonstrating CE mark compliance under EU MDR.

• Self-Declaration (Annex IV): Class I devices only (no Notified Body)
• Annex IX: Full QMS + Technical Documentation (most common for IIa+)
• Annex X: Type Examination of representative sample
• Annex XI Part A: Production quality assurance
• Annex XI Part B: Product verification per batch
• Annex XIII: For custom-made devices only`;
}
