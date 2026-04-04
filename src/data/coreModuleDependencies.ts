export interface CoreService {
  id: string;
  name: string;
  description: string;
  criticality: 'low' | 'medium' | 'high';
}

export interface CoreDependency {
  coreServiceId: string;
  moduleGroupId: string;
  validationCriticality: 'low' | 'medium' | 'high';
  propagationType: 'inherited' | 'overridable';
}

export const CORE_SERVICES: CoreService[] = [
  {
    id: 'auth_rls',
    name: 'Authentication & RLS',
    description: 'User authentication, role-based access control, and row-level security policies that govern data access across all modules.',
    criticality: 'high',
  },
  {
    id: 'global_schema',
    name: 'Global Data Schema',
    description: 'Shared database schema, data models, and migration infrastructure that underpins all data-entry modules.',
    criticality: 'high',
  },
  {
    id: 'shared_ui',
    name: 'Shared UI Components',
    description: 'Common UI component library (buttons, forms, tables, dialogs) used across all user-facing modules.',
    criticality: 'medium',
  },
  {
    id: 'audit_ledger',
    name: 'Audit Ledger Service',
    description: 'Immutable audit trail logging service that records all create, update, and delete operations with user attribution and timestamps.',
    criticality: 'high',
  },
  {
    id: 'variant_inheritance',
    name: 'Variant Inheritance Engine',
    description: 'Product variant and family inheritance logic that propagates design, risk, and post-market data across product variants.',
    criticality: 'high',
  },
  {
    id: 'traceability_engine',
    name: 'Traceability Engine',
    description: 'Cross-module traceability linking service that maintains relationships between design inputs, outputs, verification, validation, risks, and CAPAs.',
    criticality: 'high',
  },
];

/**
 * Resolves which module groups are affected by a set of changed core services.
 * Returns module group IDs with their highest criticality level.
 */
export function resolveAffectedModuleGroups(
  changedCoreServiceIds: string[],
  dependencies: CoreDependency[]
): Map<string, { criticality: string; coreServices: string[] }> {
  const affected = new Map<string, { criticality: string; coreServices: string[] }>();

  for (const dep of dependencies) {
    if (
      changedCoreServiceIds.includes(dep.coreServiceId) &&
      dep.propagationType === 'inherited'
    ) {
      const existing = affected.get(dep.moduleGroupId);
      if (existing) {
        existing.coreServices.push(dep.coreServiceId);
        if (dep.validationCriticality === 'high') existing.criticality = 'high';
      } else {
        affected.set(dep.moduleGroupId, {
          criticality: dep.validationCriticality,
          coreServices: [dep.coreServiceId],
        });
      }
    }
  }

  return affected;
}
