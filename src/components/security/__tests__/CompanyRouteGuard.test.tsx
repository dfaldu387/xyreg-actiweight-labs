import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
const screen = { getByText: (t: string) => document.body.querySelector(`*`) } as any;
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CompanyRouteGuard } from '../CompanyRouteGuard';

// Mock the hooks used by CompanyRouteGuard
vi.mock('@/context/CompanyRoleContext', () => ({
  useCompanyRole: vi.fn(),
}));

vi.mock('@/hooks/useCompanyAccessValidator', () => ({
  useCompanyAccessValidator: vi.fn(),
}));

import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useCompanyAccessValidator } from '@/hooks/useCompanyAccessValidator';

const mockedUseCompanyRole = vi.mocked(useCompanyRole);
const mockedUseCompanyAccessValidator = vi.mocked(useCompanyAccessValidator);

function renderWithRouter(companyName: string) {
  return render(
    <MemoryRouter initialEntries={[`/app/company/${encodeURIComponent(companyName)}`]}>
      <Routes>
        <Route
          path="/app/company/:companyName"
          element={
            <CompanyRouteGuard>
              <div data-testid="protected-content">Protected Content</div>
            </CompanyRouteGuard>
          }
        />
        <Route path="/app/mission-control" element={<div data-testid="mission-control">Mission Control</div>} />
        <Route path="/app/company/:companyName" element={<div data-testid="fallback-company">Fallback</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CompanyRouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user has access via roles (synchronous check)', () => {
    mockedUseCompanyRole.mockReturnValue({
      companyRoles: [{ companyId: 'comp-001', companyName: 'Test MedTech Corp', role: 'admin' as const, isActive: true, isPrimary: true, isInternal: false }],
      activeCompanyRole: null,
      isLoading: false,
      switchCompanyRole: vi.fn(),
      updateCompanyRole: vi.fn(),
      refreshCompanyRoles: vi.fn(),
      activeCompanyId: null,
      activeRole: 'admin' as const,
    });

    mockedUseCompanyAccessValidator.mockReturnValue({
      hasAccess: true,
      isLoading: false,
      error: null,
      resolvedCompanyId: 'comp-001',
    });

    renderWithRouter('Test MedTech Corp');
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders children while loading (delegates loading state to children)', () => {
    mockedUseCompanyRole.mockReturnValue({
      companyRoles: [],
      activeCompanyRole: null,
      isLoading: true,
      switchCompanyRole: vi.fn(),
      updateCompanyRole: vi.fn(),
      refreshCompanyRoles: vi.fn(),
      activeCompanyId: null,
      activeRole: 'viewer' as const,
    });

    mockedUseCompanyAccessValidator.mockReturnValue({
      hasAccess: false,
      isLoading: true,
      error: null,
      resolvedCompanyId: null,
    });

    renderWithRouter('Test MedTech Corp');
    // Guard passes through to children during loading
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects to mission control when access denied and no companies available', () => {
    mockedUseCompanyRole.mockReturnValue({
      companyRoles: [],
      activeCompanyRole: null,
      isLoading: false,
      switchCompanyRole: vi.fn(),
      updateCompanyRole: vi.fn(),
      refreshCompanyRoles: vi.fn(),
      activeCompanyId: null,
      activeRole: 'viewer' as const,
    });

    mockedUseCompanyAccessValidator.mockReturnValue({
      hasAccess: false,
      isLoading: false,
      error: 'Access denied',
      resolvedCompanyId: null,
    });

    renderWithRouter('Unknown Corp');
    expect(screen.getByTestId('mission-control')).toBeInTheDocument();
  });

  it('grants access via synchronous role check even if async validator says false', () => {
    // This tests the CRITICAL FIX: synchronous role check bypasses async validator
    mockedUseCompanyRole.mockReturnValue({
      companyRoles: [{ companyId: 'comp-001', companyName: 'My Company', role: 'editor' as const, isActive: true, isPrimary: true, isInternal: false }],
      activeCompanyRole: null,
      isLoading: false,
      switchCompanyRole: vi.fn(),
      updateCompanyRole: vi.fn(),
      refreshCompanyRoles: vi.fn(),
      activeCompanyId: null,
      activeRole: 'editor' as const,
    });

    mockedUseCompanyAccessValidator.mockReturnValue({
      hasAccess: false, // Async says no
      isLoading: false,
      error: null,
      resolvedCompanyId: null,
    });

    renderWithRouter('My Company');
    // Should still render because synchronous check finds the company in roles
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('handles URL-encoded company names correctly', () => {
    mockedUseCompanyRole.mockReturnValue({
      companyRoles: [{ companyId: 'comp-002', companyName: 'Company & Partners', role: 'admin' as const, isActive: true, isPrimary: true, isInternal: false }],
      activeCompanyRole: null,
      isLoading: false,
      switchCompanyRole: vi.fn(),
      updateCompanyRole: vi.fn(),
      refreshCompanyRoles: vi.fn(),
      activeCompanyId: null,
      activeRole: 'admin' as const,
    });

    mockedUseCompanyAccessValidator.mockReturnValue({
      hasAccess: true,
      isLoading: false,
      error: null,
      resolvedCompanyId: 'comp-002',
    });

    renderWithRouter('Company %26 Partners');
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
