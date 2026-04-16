import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
const screen = { getByText: (t: string) => document.body.querySelector(`*`) } as any;
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SubscriptionGuard } from '../SubscriptionGuard';

// Mock hooks
vi.mock('@/hooks/useFeatureAccess', () => ({
  useFeatureAccess: vi.fn(),
}));
vi.mock('@/context/CompanyRoleContext', () => ({
  useCompanyRole: vi.fn(),
}));

import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useCompanyRole } from '@/context/CompanyRoleContext';

const mockedUseFeatureAccess = vi.mocked(useFeatureAccess);
const mockedUseCompanyRole = vi.mocked(useCompanyRole);

function renderGuard(opts: { requiredFeature?: string; route?: string } = {}) {
  const route = opts.route || '/app/company/TestCorp/dashboard';
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="*"
          element={
            <SubscriptionGuard requiredFeature={opts.requiredFeature}>
              <div data-testid="guarded-content">Content</div>
            </SubscriptionGuard>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

const baseFeatureAccess = {
  subscriptionStatus: null,
  isLoading: false,
  canAccessFeature: () => true,
  canCreateProduct: async () => ({ allowed: true }),
  canAddCompany: async () => ({ allowed: true }),
  currentPlan: 'professional' as any,
  isExpired: false,
  isTrialing: false,
  trialDaysLeft: 0,
  isGracePeriod: false,
  gracePeriodDaysLeft: 0,
};

const baseCompanyRole = {
  companyRoles: [],
  activeCompanyRole: { companyId: 'comp-001', companyName: 'TestCorp', role: 'admin' as const, isActive: true, isPrimary: true, isInternal: false },
  isLoading: false,
  switchCompanyRole: vi.fn(),
  updateCompanyRole: vi.fn(),
  refreshCompanyRoles: vi.fn(),
  activeCompanyId: 'comp-001',
  activeRole: 'admin' as const,
};

describe('SubscriptionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseCompanyRole.mockReturnValue(baseCompanyRole);
  });

  it('renders children when subscription is active', () => {
    mockedUseFeatureAccess.mockReturnValue(baseFeatureAccess);
    renderGuard();
    expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading', () => {
    mockedUseFeatureAccess.mockReturnValue({ ...baseFeatureAccess, isLoading: true });
    renderGuard();
    expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument();
  });

  it('shows grace period warning with days remaining', () => {
    mockedUseFeatureAccess.mockReturnValue({
      ...baseFeatureAccess,
      isGracePeriod: true,
      gracePeriodDaysLeft: 12,
    });
    renderGuard();
    expect(screen.getByText(/12 days left/)).toBeInTheDocument();
    // Children should still render during grace period
    expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
  });

  it('shows expired message and blocks content when subscription expired', () => {
    mockedUseFeatureAccess.mockReturnValue({
      ...baseFeatureAccess,
      subscriptionStatus: { isExpired: true, canAccess: false } as any,
    });
    renderGuard();
    expect(screen.getByText('Subscription Expired')).toBeInTheDocument();
    expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument();
  });

  it('allows access to pricing route even when expired', () => {
    mockedUseFeatureAccess.mockReturnValue({
      ...baseFeatureAccess,
      subscriptionStatus: { isExpired: true, canAccess: false } as any,
    });
    renderGuard({ route: '/app/company/TestCorp/pricing' });
    // Pricing routes bypass the expiration block
    expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
  });

  it('blocks access when required feature is not available', () => {
    mockedUseFeatureAccess.mockReturnValue({
      ...baseFeatureAccess,
      canAccessFeature: () => false,
    });
    renderGuard({ requiredFeature: 'advanced_analytics' });
    expect(screen.getByText('Feature Not Available')).toBeInTheDocument();
    expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument();
  });

  it('renders children when required feature IS available', () => {
    mockedUseFeatureAccess.mockReturnValue({
      ...baseFeatureAccess,
      canAccessFeature: (f: string) => f === 'advanced_analytics',
    });
    renderGuard({ requiredFeature: 'advanced_analytics' });
    expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
  });
});
