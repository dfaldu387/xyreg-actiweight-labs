import React, { Suspense, lazy } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useAuth } from '@/context/AuthContext';
import { Building2 } from 'lucide-react';

// Lazy load MultiCompanyDashboard to avoid circular dependencies
const MultiCompanyDashboard = lazy(() => import('./MultiCompanyDashboard').then(m => ({ default: m.MultiCompanyDashboard })));

/**
 * Redirect component for /app/mission-control route
 *
 * This component handles two scenarios:
 * 1. If ?all=true is in the URL (user explicitly selected "All Companies"),
 *    render the MultiCompanyDashboard to show aggregated data from all companies.
 * 2. Otherwise, redirect to the company-specific mission control route
 *    (/app/company/:companyName/mission-control).
 *
 * If the user has no company selected or available, it shows a message
 * to select a company.
 */
export function MissionControlRedirect() {
  const { companyRoles, activeCompanyRole, isLoading: rolesLoading } = useCompanyRole();
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  // Check if user explicitly requested multi-company view
  const showAllCompanies = searchParams.get('all') === 'true';

  // Show loading while auth or roles are loading
  if (authLoading || rolesLoading) {
    return (
      <div className="px-2 py-8 h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, let the protected route handle it
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is a super admin, redirect to super admin portal
  if (user.user_metadata?.role === 'super_admin') {
    return <Navigate to="/super-admin" replace />;
  }

  // If user explicitly selected "All Companies" and has multiple companies,
  // show the multi-company dashboard
  if (showAllCompanies && companyRoles.length > 0) {
    return (
      <Suspense fallback={
        <div className="px-2 py-8 h-screen flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Mission Control...</p>
          </div>
        </div>
      }>
        <MultiCompanyDashboard />
      </Suspense>
    );
  }

  // Determine which company to redirect to
  // Priority: active company role > first available company
  const targetCompany = activeCompanyRole || companyRoles[0];

  if (targetCompany) {
    const redirectUrl = `/app/company/${encodeURIComponent(targetCompany.companyName)}/mission-control`;
    return <Navigate to={redirectUrl} replace />;
  }

  // No companies available - show message to select a company
  return (
    <div className="px-2 py-8 h-screen flex flex-col items-center justify-center">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-muted p-4">
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">No Company Selected</h2>
        <p className="text-muted-foreground mb-6">
          Please select a company to access Mission Control. You need to be a member of at least one company to view the dashboard.
        </p>
        <p className="text-sm text-muted-foreground">
          If you believe you should have access to a company, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
