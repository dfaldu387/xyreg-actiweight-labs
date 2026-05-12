import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useCompanyAccessValidator } from '@/hooks/useCompanyAccessValidator';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useAuth } from '@/context/AuthContext';
import { FullPageLoader } from '@/components/ui/loading-spinner';
import { AlertTriangle } from 'lucide-react';

interface CompanyRouteGuardProps {
  children: React.ReactNode;
}

/**
 * CRITICAL SECURITY COMPONENT: Guards company-specific routes
 * Prevents unauthorized access to company data
 * NOTE: Does NOT show its own loader - child components handle loading state
 * to prevent multiple sequential loaders
 *
 * FIXED: Added synchronous role check to prevent redirects during async validation
 */
export function CompanyRouteGuard({ children }: CompanyRouteGuardProps) {
  const { companyName } = useParams<{ companyName: string }>();
  const { companyRoles, isLoading: rolesLoading } = useCompanyRole();
  const { tenantAllowedCompanyIds, tenantPrimaryCompanyId } = useAuth();
  const { hasAccess, isLoading, error, resolvedCompanyId } = useCompanyAccessValidator(companyName);

  // Synchronous check: the URL company must appear in the user's role list,
  // which is already intersected with the tenant allow list (see useCompanyRoles).
  // Even when async validation is loading, this lets us short-circuit safely.
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : null;
  const matchedRole = decodedCompanyName
    ? companyRoles.find(role => role.companyName.toLowerCase() === decodedCompanyName.toLowerCase())
    : null;
  // Defence-in-depth: re-check the tenant allow list. If the role list ever
  // drifts from the tenant filter, this still catches cross-tenant URLs.
  const passesTenantGate =
    !tenantAllowedCompanyIds || tenantAllowedCompanyIds.length === 0 ||
    (matchedRole ? tenantAllowedCompanyIds.includes(matchedRole.companyId) : false);
  const urlCompanyInRoles = !!matchedRole && passesTenantGate;

  // While loading, two cases:
  //   - URL company already matches a role we know about → safe to pass through
  //     to children (they'll show their own loader). No flash possible.
  //   - We don't yet have a confirmed match → block rendering with a loader.
  //     Otherwise the unauthorized company's shell flashes before the guard's
  //     redirect runs (e.g., logging into `arnar` while the URL still points
  //     at "test company 1" from a previous tenant).
  if (isLoading || rolesLoading) {
    if (urlCompanyInRoles) return <>{children}</>;
    return <FullPageLoader />;
  }

  // If URL company is in user's roles AND passes the tenant gate, grant access.
  if (urlCompanyInRoles) {
    return <>{children}</>;
  }

  // Handle access denied - redirect to tenant primary (if user has access),
  // otherwise the first company they actually have access to, otherwise mission control.
  if (!hasAccess || !urlCompanyInRoles) {
    if (companyRoles.length > 0) {
      const primaryRole = tenantPrimaryCompanyId
        ? companyRoles.find(r => r.companyId === tenantPrimaryCompanyId)
        : null;
      const fallbackCompany = primaryRole ?? companyRoles[0];
      return <Navigate to={`/app/company/${encodeURIComponent(fallbackCompany.companyName)}`} replace />;
    }
    return <Navigate to="/app/mission-control" replace />;
  }

  // Access granted - render children
  return <>{children}</>;
}

/**
 * Access Denied Error Page Component
 */
export function CompanyAccessDenied({ companyName, error }: { companyName?: string; error?: string }) {
  const { companyRoles } = useCompanyRole();

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access {companyName ? `"${decodeURIComponent(companyName)}"` : 'this company'}.
            </p>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
            )}
          </div>

          {companyRoles.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">You have access to:</p>
              <div className="space-y-1">
                {companyRoles.map(role => (
                  <div key={role.companyId} className="text-sm">
                    <button
                      onClick={() => window.location.href = `/app/company/${encodeURIComponent(role.companyName)}`}
                      className="text-primary hover:underline"
                    >
                      {role.companyName}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}