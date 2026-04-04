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
  'engineering': ['Design & Development', 'Risk & Clinical'],
  'design': ['Design & Development', 'Risk & Clinical'],
  'quality': ['Quality Core', 'Regulatory & Compliance'],
  'qa': ['Quality Core', 'Regulatory & Compliance'],
  'production': ['Production & Supply', 'Facilities & Equipment'],
  'manufacturing': ['Production & Supply', 'Facilities & Equipment'],
  'regulatory': ['Regulatory & Compliance', 'Post-Market & Vigilance'],
  'clinical': ['Risk & Clinical', 'Post-Market & Vigilance'],
  'operations': ['Production & Supply', 'Facilities & Equipment'],
  'supply chain': ['Production & Supply'],
};

// Get recommended groups for a role name (fuzzy match)
export function getRecommendedGroupsForRole(roleName: string): string[] {
  const lower = roleName.toLowerCase();
  const groups = new Set<string>();
  
  for (const [pattern, recommendedGroups] of Object.entries(ROLE_TRAINING_RECOMMENDATIONS)) {
    if (lower.includes(pattern)) {
      recommendedGroups.forEach(g => groups.add(g));
    }
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
