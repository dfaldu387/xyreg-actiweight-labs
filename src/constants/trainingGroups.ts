// SOP Group definitions for training module organization
// Maps SOP name prefixes to logical groups

export const SOP_GROUPS: Record<string, string[]> = {
  'Quality Core': ['SOP-001', 'SOP-002', 'SOP-003', 'SOP-004', 'SOP-005', 'SOP-006', 'SOP-011', 'SOP-012', 'SOP-017', 'SOP-050'],
  'Design & Development': ['SOP-008', 'SOP-019', 'SOP-027', 'SOP-028', 'SOP-029', 'SOP-031', 'SOP-049'],
  'Production & Supply': ['SOP-009', 'SOP-010', 'SOP-016', 'SOP-020', 'SOP-021', 'SOP-030', 'SOP-032', 'SOP-033', 'SOP-039', 'SOP-043', 'SOP-051'],
  'Post-Market & Vigilance': ['SOP-013', 'SOP-014', 'SOP-022', 'SOP-037', 'SOP-038', 'SOP-042', 'SOP-044'],
  'Risk & Clinical': ['SOP-007', 'SOP-015', 'SOP-026', 'SOP-040', 'SOP-047'],
  'Regulatory & Compliance': ['SOP-034', 'SOP-035', 'SOP-036', 'SOP-045', 'SOP-046', 'SOP-048'],
  'Facilities & Equipment': ['SOP-018', 'SOP-023', 'SOP-024', 'SOP-025', 'SOP-041'],
};

// Reverse lookup: SOP prefix -> group name
export function getGroupForSOP(sopName: string): string | null {
  const prefix = sopName.match(/^SOP-\d{3}/)?.[0];
  if (!prefix) return null;
  
  for (const [group, sops] of Object.entries(SOP_GROUPS)) {
    if (sops.includes(prefix)) return group;
  }
  return 'Other';
}

// Role-based training recommendations
// Maps role name patterns to recommended SOP groups
export const ROLE_TRAINING_RECOMMENDATIONS: Record<string, string[]> = {
  // Leadership & cross-functional
  'top management': ['Quality Core', 'Regulatory & Compliance'],
  'ceo': ['Quality Core', 'Regulatory & Compliance'],
  'managing director': ['Quality Core', 'Regulatory & Compliance'],
  // Quality
  'quality': ['Quality Core', 'Regulatory & Compliance', 'Post-Market & Vigilance'],
  'qa': ['Quality Core', 'Regulatory & Compliance', 'Post-Market & Vigilance'],
  'qms': ['Quality Core'],
  'capa': ['Quality Core', 'Post-Market & Vigilance'],
  'document': ['Quality Core'],
  'auditor': ['Quality Core', 'Regulatory & Compliance'],
  // Design & Engineering
  'engineering': ['Design & Development', 'Risk & Clinical'],
  'engineer': ['Design & Development', 'Risk & Clinical'],
  'design': ['Design & Development', 'Risk & Clinical'],
  'r&d': ['Design & Development', 'Risk & Clinical'],
  'software': ['Design & Development', 'Risk & Clinical'],
  'mechanical': ['Design & Development', 'Risk & Clinical'],
  'electronic': ['Design & Development', 'Risk & Clinical'],
  // Risk & Clinical
  'risk': ['Risk & Clinical', 'Design & Development'],
  'clinical': ['Risk & Clinical', 'Post-Market & Vigilance'],
  'usability': ['Risk & Clinical', 'Design & Development'],
  'human factors': ['Risk & Clinical', 'Design & Development'],
  'biocompatibility': ['Risk & Clinical'],
  // Production / Operations / Supply
  'production': ['Production & Supply', 'Facilities & Equipment'],
  'manufacturing': ['Production & Supply', 'Facilities & Equipment'],
  'operations': ['Production & Supply', 'Facilities & Equipment'],
  'operator': ['Production & Supply', 'Facilities & Equipment'],
  'supply chain': ['Production & Supply'],
  'procurement': ['Production & Supply'],
  'supplier': ['Production & Supply', 'Quality Core'],
  'warehouse': ['Production & Supply'],
  'logistics': ['Production & Supply'],
  // Facilities & Equipment
  'facilities': ['Facilities & Equipment'],
  'maintenance': ['Facilities & Equipment'],
  'calibration': ['Facilities & Equipment', 'Quality Core'],
  'metrology': ['Facilities & Equipment', 'Quality Core'],
  // Regulatory & Post-Market
  'regulatory': ['Regulatory & Compliance', 'Post-Market & Vigilance'],
  'reg affairs': ['Regulatory & Compliance', 'Post-Market & Vigilance'],
  'ra ': ['Regulatory & Compliance', 'Post-Market & Vigilance'],
  'pms': ['Post-Market & Vigilance', 'Risk & Clinical'],
  'post-market': ['Post-Market & Vigilance', 'Risk & Clinical'],
  'vigilance': ['Post-Market & Vigilance'],
  'complaint': ['Post-Market & Vigilance', 'Quality Core'],
  'customer service': ['Post-Market & Vigilance'],
  // Commercial / Service
  'service': ['Post-Market & Vigilance', 'Production & Supply'],
  'sales': ['Quality Core'],
  'marketing': ['Regulatory & Compliance', 'Quality Core'],
  // HR / Admin
  'hr': ['Quality Core'],
  'human resources': ['Quality Core'],
  'training': ['Quality Core'],
  'consultant': ['Quality Core', 'Regulatory & Compliance'],
};

/** Foundation set every role gets if no keyword matches. */
export const FALLBACK_RECOMMENDED_GROUPS: string[] = ['Quality Core'];

/** Functional area enum (user_company_access.functional_area) → SOP groups. */
export const FUNCTIONAL_AREA_RECOMMENDATIONS: Record<string, string[]> = {
  management_executive: ['Quality Core', 'Regulatory & Compliance'],
  quality_assurance: ['Quality Core', 'Regulatory & Compliance', 'Post-Market & Vigilance'],
  regulatory_affairs: ['Regulatory & Compliance', 'Post-Market & Vigilance', 'Quality Core'],
  clinical_affairs: ['Risk & Clinical', 'Post-Market & Vigilance', 'Quality Core'],
  research_development: ['Design & Development', 'Risk & Clinical', 'Quality Core'],
  manufacturing_operations: ['Production & Supply', 'Facilities & Equipment', 'Quality Core'],
  marketing_labeling: ['Regulatory & Compliance', 'Quality Core', 'Post-Market & Vigilance'],
  other_internal: ['Quality Core'],
};

/** External role enum (user_company_access.external_role) → SOP groups. */
export const EXTERNAL_ROLE_RECOMMENDATIONS: Record<string, string[]> = {
  consultant: ['Quality Core', 'Regulatory & Compliance'],
  auditor: ['Quality Core', 'Regulatory & Compliance'],
  contract_manufacturer: ['Production & Supply', 'Facilities & Equipment', 'Quality Core'],
  distributor: ['Post-Market & Vigilance', 'Quality Core'],
  key_opinion_leader: ['Risk & Clinical'],
  other_external: ['Quality Core'],
};

const FUNCTIONAL_AREA_LABELS: Record<string, string> = {
  management_executive: 'Management / Executive',
  quality_assurance: 'Quality Assurance',
  regulatory_affairs: 'Regulatory Affairs',
  clinical_affairs: 'Clinical Affairs',
  research_development: 'R&D / Engineering',
  manufacturing_operations: 'Manufacturing / Operations',
  marketing_labeling: 'Marketing / Labeling',
  other_internal: 'Internal (other)',
};

const EXTERNAL_ROLE_LABELS: Record<string, string> = {
  consultant: 'Consultant',
  auditor: 'Auditor',
  contract_manufacturer: 'Contract Manufacturer',
  distributor: 'Distributor',
  key_opinion_leader: 'Key Opinion Leader',
  other_external: 'External (other)',
};

export interface UserRoleSignals {
  functional_area?: string | null;
  external_role?: string | null;
  department?: string | null;
  title?: string | null;
  is_internal?: boolean;
}

/** Resolve recommended SOP groups for a person using all available role signals. */
export function getRecommendedGroupsForUser(user: UserRoleSignals): string[] {
  const groups = new Set<string>();
  if (user.functional_area && FUNCTIONAL_AREA_RECOMMENDATIONS[user.functional_area]) {
    FUNCTIONAL_AREA_RECOMMENDATIONS[user.functional_area].forEach(g => groups.add(g));
  }
  if (user.external_role && EXTERNAL_ROLE_RECOMMENDATIONS[user.external_role]) {
    EXTERNAL_ROLE_RECOMMENDATIONS[user.external_role].forEach(g => groups.add(g));
  }
  // Free-text department / title can refine further via the keyword matcher.
  for (const text of [user.department, user.title]) {
    if (!text) continue;
    const lower = text.toLowerCase();
    for (const [pattern, recommended] of Object.entries(ROLE_TRAINING_RECOMMENDATIONS)) {
      if (lower.includes(pattern)) recommended.forEach(g => groups.add(g));
    }
  }
  if (groups.size === 0) {
    FALLBACK_RECOMMENDED_GROUPS.forEach(g => groups.add(g));
  }
  return Array.from(groups);
}

/** Human label of the strongest role signal we have for a user. */
export function getInferredRoleLabel(user: UserRoleSignals): {
  label: string;
  needsDefinition: boolean;
} {
  const title = (user.title || '').trim();
  const dept = (user.department || '').trim();
  const isGenericDept = !dept || ['internal', 'external'].includes(dept.toLowerCase());

  if (user.is_internal !== false) {
    // Internal: prefer "<Functional area or Department> | <Job title>"
    const left = user.functional_area
      ? FUNCTIONAL_AREA_LABELS[user.functional_area] || null
      : (!isGenericDept ? dept : null);
    if (left && title) return { label: `${left} | ${title}`, needsDefinition: false };
    if (title) return { label: `Internal | ${title}`, needsDefinition: false };
    if (left) return { label: left, needsDefinition: true }; // missing job title
    return { label: 'Internal — role not defined', needsDefinition: true };
  }

  // External
  const ext = user.external_role ? EXTERNAL_ROLE_LABELS[user.external_role] : null;
  if (ext && title) return { label: `${ext} | ${title}`, needsDefinition: false };
  if (ext) return { label: ext, needsDefinition: false };
  if (title) return { label: `External | ${title}`, needsDefinition: false };
  return { label: 'External — role not defined', needsDefinition: true };
}

// Get recommended groups for a role name (fuzzy match)
export function getRecommendedGroupsForRole(roleName: string): string[] {
  const lower = roleName.toLowerCase();
  const groups = new Set<string>();
  
  for (const [pattern, recommendedGroups] of Object.entries(ROLE_TRAINING_RECOMMENDATIONS)) {
    if (lower.includes(pattern)) {
      recommendedGroups.forEach(g => groups.add(g));
    }
  }

  if (groups.size === 0) {
    FALLBACK_RECOMMENDED_GROUPS.forEach(g => groups.add(g));
  }
  return Array.from(groups);
}

// Check if a module is recommended for a role
export function isModuleRecommendedForRole(moduleName: string, roleName: string): boolean {
  const moduleGroup = getGroupForSOP(moduleName);
  if (!moduleGroup) return false;
  
  const recommendedGroups = getRecommendedGroupsForRole(roleName);
  return recommendedGroups.includes(moduleGroup);
}

// All group names in display order
export const GROUP_ORDER = [
  'Quality Core',
  'Design & Development',
  'Production & Supply',
  'Post-Market & Vigilance',
  'Risk & Clinical',
  'Regulatory & Compliance',
  'Facilities & Equipment',
  'Other',
];
