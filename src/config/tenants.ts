// Per-tenant feature flags and error messages.
// The company allow list lives in the `tenant_configs` DB table — see the
// migration at supabase/migrations/20260505000000_tenant_configs.sql.
// Feature flags stay here because each one gates code paths that may not
// be present in every tenant's bundle.

export type TenantFeatures = {
  google: boolean;
  audit: boolean;
  genesis: boolean;
  investor: boolean;
  edgeFnResetEmail: boolean;
};

export type TenantConfig = {
  key: string;
  errorMessage: string;
  features: TenantFeatures;
};

const tenantRegistry: Record<string, TenantConfig> = {
  arnar: {
    key: 'arnar',
    errorMessage: 'User not found. Only authorized company users can log in.',
    features: { google: true, audit: false, genesis: false, investor: false, edgeFnResetEmail: false },
  },
  mockup: {
    key: 'mockup',
    errorMessage: 'User not found',
    features: { google: true, audit: true, genesis: true, investor: true, edgeFnResetEmail: true },
  },
  genish: {
    key: 'genish',
    errorMessage: 'User not found. Only Genis ehf users can log in.',
    features: { google: false, audit: false, genesis: false, investor: false, edgeFnResetEmail: false },
  },
  actiweight: {
    key: 'actiweight',
    errorMessage: 'User not found. Only Actiweight Labs AS users can log in.',
    features: { google: true, audit: false, genesis: false, investor: false, edgeFnResetEmail: false },
  },
  davidhealth: {
    key: 'davidhealth',
    errorMessage: 'User not found. Only David Health Solutions Oy users can log in.',
    features: { google: true, audit: false, genesis: false, investor: false, edgeFnResetEmail: false },
  },
};

const DEFAULT_TENANT_KEY = 'mockup';

const rawTenantKey = (import.meta.env.VITE_TENANT_KEY as string | undefined)?.trim();
const resolvedTenantKey = rawTenantKey && tenantRegistry[rawTenantKey] ? rawTenantKey : DEFAULT_TENANT_KEY;

if (rawTenantKey && !tenantRegistry[rawTenantKey]) {
  console.warn(
    `[tenant] Unknown VITE_TENANT_KEY="${rawTenantKey}", falling back to "${DEFAULT_TENANT_KEY}". ` +
    `Valid keys: ${Object.keys(tenantRegistry).join(', ')}`
  );
}

export const activeTenant: TenantConfig = tenantRegistry[resolvedTenantKey];
