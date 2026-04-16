import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
const screen = { getByText: (t: string) => document.body.querySelector(`*`) } as any;
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CompanyModuleAccessGuard } from '../CompanyModuleAccessGuard';

// Mock hooks
vi.mock('@/hooks/useUserModuleAccess', () => ({
  useUserModuleAccess: vi.fn(),
}));

import { useUserModuleAccess } from '@/hooks/useUserModuleAccess';
const mockedUseUserModuleAccess = vi.mocked(useUserModuleAccess);

function renderGuard(moduleId: string, companyName = 'TestCorp') {
  return render(
    <MemoryRouter initialEntries={[`/app/company/${companyName}/module-page`]}>
      <Routes>
        <Route
          path="/app/company/:companyName/module-page"
          element={
            <CompanyModuleAccessGuard requiredModuleId={moduleId}>
              <div data-testid="module-content">Module Content</div>
            </CompanyModuleAccessGuard>
          }
        />
        <Route
          path="/app/company/:companyName/portfolio-landing"
          element={<div data-testid="portfolio-landing">Portfolio Landing</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('CompanyModuleAccessGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user has access to the module', () => {
    mockedUseUserModuleAccess.mockReturnValue({
      allowedModuleIds: ['mod-risk', 'mod-docs'],
      isLoading: false,
      hasAccess: (id: string) => ['mod-risk', 'mod-docs'].includes(id),
    });

    renderGuard('mod-risk');
    expect(screen.getByTestId('module-content')).toBeInTheDocument();
  });

  it('renders children when user has unrestricted access (null allowedModuleIds)', () => {
    mockedUseUserModuleAccess.mockReturnValue({
      allowedModuleIds: null,
      isLoading: false,
      hasAccess: () => true,
    });

    renderGuard('any-module');
    expect(screen.getByTestId('module-content')).toBeInTheDocument();
  });

  it('redirects to portfolio landing when access denied', () => {
    mockedUseUserModuleAccess.mockReturnValue({
      allowedModuleIds: ['mod-docs'],
      isLoading: false,
      hasAccess: (id: string) => id === 'mod-docs',
    });

    renderGuard('mod-risk');
    expect(screen.getByTestId('portfolio-landing')).toBeInTheDocument();
  });

  it('shows loading state while validating', () => {
    mockedUseUserModuleAccess.mockReturnValue({
      allowedModuleIds: null,
      isLoading: true,
      hasAccess: () => false,
    });

    renderGuard('mod-risk');
    expect(screen.getByText('Validating module access...')).toBeInTheDocument();
  });
});
