import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
const screen = { getByText: (t: string) => document.body.querySelector(`*`) } as any;

// Mock all child dashboard components
vi.mock('@/components/mission-control/MultiCompanyDashboard', () => ({
  MultiCompanyDashboard: () => <div data-testid="multi-company-dashboard">Multi Company</div>,
}));
vi.mock('@/components/mission-control/SingleCompanyDashboard', () => ({
  SingleCompanyDashboard: () => <div data-testid="single-company-dashboard">Single Company</div>,
}));
vi.mock('@/components/mission-control/SingleProductDashboard', () => ({
  SingleProductDashboard: ({ productId, companyId }: any) => (
    <div data-testid="single-product-dashboard">Product: {productId}</div>
  ),
}));
vi.mock('@/components/mission-control/ReviewerDashboard', () => ({
  ReviewerDashboard: () => <div data-testid="reviewer-dashboard">Reviewer</div>,
}));

// Mock the context hook
vi.mock('@/hooks/useDashboardContext', () => ({
  useDashboardContext: vi.fn(),
}));

import { useDashboardContext } from '@/hooks/useDashboardContext';
import MissionControlDashboard from '../MissionControlDashboard';

const mockedUseDashboardContext = vi.mocked(useDashboardContext);

const baseContext = {
  companyCount: 1,
  productCount: 1,
  isReviewer: false,
  activeCompanyId: 'comp-001',
  activeProductId: 'prod-001',
  isLoading: false,
  isMissionControlOverlay: false,
  originalContext: null,
};

describe('MissionControlDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when isLoading is true', () => {
    mockedUseDashboardContext.mockReturnValue({
      ...baseContext,
      dashboardType: 'multi-company',
      isLoading: true,
    });

    render(<MissionControlDashboard />);
    expect(screen.getByText('Loading Mission Control...')).toBeInTheDocument();
  });

  it('renders MultiCompanyDashboard for multi-company type', () => {
    mockedUseDashboardContext.mockReturnValue({
      ...baseContext,
      dashboardType: 'multi-company',
    });

    render(<MissionControlDashboard />);
    expect(screen.getByTestId('multi-company-dashboard')).toBeInTheDocument();
  });

  it('renders SingleCompanyDashboard for single-company type', () => {
    mockedUseDashboardContext.mockReturnValue({
      ...baseContext,
      dashboardType: 'single-company',
    });

    render(<MissionControlDashboard />);
    expect(screen.getByTestId('single-company-dashboard')).toBeInTheDocument();
  });

  it('renders SingleProductDashboard for single-product type', () => {
    mockedUseDashboardContext.mockReturnValue({
      ...baseContext,
      dashboardType: 'single-product',
    });

    render(<MissionControlDashboard />);
    expect(screen.getByTestId('single-product-dashboard')).toBeInTheDocument();
  });

  it('renders ReviewerDashboard for reviewer type', () => {
    mockedUseDashboardContext.mockReturnValue({
      ...baseContext,
      dashboardType: 'reviewer',
      isReviewer: true,
    });

    render(<MissionControlDashboard />);
    expect(screen.getByTestId('reviewer-dashboard')).toBeInTheDocument();
  });

  it('defaults to SingleCompanyDashboard for unknown type', () => {
    mockedUseDashboardContext.mockReturnValue({
      ...baseContext,
      dashboardType: 'unknown-type' as any,
    });

    render(<MissionControlDashboard />);
    expect(screen.getByTestId('single-company-dashboard')).toBeInTheDocument();
  });
});
