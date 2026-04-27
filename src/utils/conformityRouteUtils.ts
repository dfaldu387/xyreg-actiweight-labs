import { normalizeRiskClass } from './normalizeRiskClass';

export interface ConformityRoute {
  value: string;
  label: string;
  forClasses: string[];
}

export const CONFORMITY_ROUTES: ConformityRoute[] = [
  { value: 'Self-Declaration (Annex II + III)', label: 'Conformity Assessment based on Annex II and Annex III (Self-Declaration, Class I)', forClasses: ['I'] },
  { value: 'Self-Declaration (Annex IV)', label: 'Self-Declaration (Annex IV — DoC template, legacy)', forClasses: ['I'] },
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
      return 'Self-Declaration (Annex II + III)';
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
  'Self-Declaration (Annex II + III)': 'Class I devices (non-sterile, non-measuring, non-reusable surgical). Manufacturer demonstrates conformity per Annex II (Technical Documentation) and Annex III (PMS Technical Documentation), then issues an EU Declaration of Conformity. No Notified Body involvement.',
  'Self-Declaration (Annex IV)': 'Legacy label. Annex IV defines the EU Declaration of Conformity template — the assessment itself is based on Annex II + III. Use the Annex II + III option for new records.',
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

• Conformity Assessment based on Annex II + III: Class I devices (self-declaration, no Notified Body). Annex II = Technical Documentation, Annex III = PMS Technical Documentation. Manufacturer issues an EU Declaration of Conformity.
• Annex IX: Full QMS + Technical Documentation (most common for IIa+)
• Annex X: Type Examination of representative sample
• Annex XI Part A: Production quality assurance
• Annex XI Part B: Product verification per batch
• Annex XIII: For custom-made devices only`;
}
