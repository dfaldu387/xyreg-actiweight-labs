import React, { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// ---- Mock types matching real context shapes ----

interface MockAuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

interface MockCompanyRole {
  companyId: string;
  companyName: string;
  role: 'admin' | 'editor' | 'viewer' | 'consultant' | 'author';
}

interface TestProvidersProps {
  children: ReactNode;
  // Router
  initialRoute?: string;
  // Auth overrides
  user?: MockAuthUser | null;
  isLoading?: boolean;
  userRole?: string;
  isReviewer?: boolean;
  isInvestor?: boolean;
  // Company role overrides
  companyRoles?: MockCompanyRole[];
  activeCompanyRole?: MockCompanyRole | null;
  activeCompanyId?: string | null;
  activeRole?: string;
  companyRolesLoading?: boolean;
}

// Provide stable no-op functions
const noop = () => {};
const asyncNoop = async () => {};
const asyncNoopResult = async () => ({ error: null, success: true });

/**
 * Creates a wrapper component with all required contexts for RTL testing.
 * Mocks AuthContext, CompanyRoleContext, and wraps in MemoryRouter + QueryClientProvider.
 */
export function createTestProviders(overrides: Omit<TestProvidersProps, 'children'> = {}) {
  return function TestProviders({ children }: { children: ReactNode }) {
    return <TestProvidersInner {...overrides}>{children}</TestProvidersInner>;
  };
}

function TestProvidersInner({
  children,
  initialRoute = '/',
  user = { id: 'user-001', email: 'test@example.com' },
  isLoading = false,
  userRole = 'admin',
  isReviewer = false,
  isInvestor = false,
  companyRoles = [{ companyId: 'comp-001', companyName: 'Test MedTech Corp', role: 'admin' }],
  activeCompanyRole = null,
  activeCompanyId = null,
  activeRole = 'admin',
  companyRolesLoading = false,
}: TestProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  const effectiveActiveRole = activeCompanyRole ?? (companyRoles.length > 0 ? companyRoles[0] : null);
  const effectiveActiveCompanyId = activeCompanyId ?? effectiveActiveRole?.companyId ?? null;

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/**
 * Helper to build mock return values for hooks that are vi.mocked.
 */
export function mockAuthContext(overrides: Partial<TestProvidersProps> = {}) {
  return {
    user: overrides.user ?? { id: 'user-001', email: 'test@example.com' },
    session: null,
    signIn: asyncNoopResult,
    signOut: asyncNoop,
    signUp: asyncNoop,
    isLoading: overrides.isLoading ?? false,
    userRole: overrides.userRole ?? 'admin',
    isReviewer: overrides.isReviewer ?? false,
    isInvestor: overrides.isInvestor ?? false,
    refreshSession: asyncNoop,
    clearDevMode: noop,
  };
}

export function mockCompanyRoleContext(overrides: Partial<TestProvidersProps> = {}) {
  const roles = overrides.companyRoles ?? [
    { companyId: 'comp-001', companyName: 'Test MedTech Corp', role: 'admin' as const },
  ];
  const activeRole = overrides.activeCompanyRole ?? (roles.length > 0 ? roles[0] : null);

  return {
    companyRoles: roles,
    activeCompanyRole: activeRole,
    isLoading: overrides.companyRolesLoading ?? false,
    switchCompanyRole: vi.fn(async () => ({ success: true })),
    updateCompanyRole: vi.fn(async () => ({ success: true })),
    refreshCompanyRoles: vi.fn(async () => {}),
    activeCompanyId: overrides.activeCompanyId ?? activeRole?.companyId ?? null,
    activeRole: overrides.activeRole ?? 'admin',
  };
}
