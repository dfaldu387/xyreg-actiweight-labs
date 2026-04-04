import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useCompanyAccessValidator } from '@/hooks/useCompanyAccessValidator';
import { useCompanyRole } from '@/context/CompanyRoleContext';
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
  const { hasAccess, isLoading, error, resolvedCompanyId } = useCompanyAccessValidator(companyName);

  // CRITICAL FIX: Synchronous check - if URL company exists in user's roles, they have access
  // This prevents the race condition where async validation returns false during loading
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : null;
  const urlCompanyInRoles = decodedCompanyName && companyRoles.some(role =>
    role.companyName.toLowerCase() === decodedCompanyName.toLowerCase()
  );

  

  // While loading, pass through to children - they handle their own loading state
  // This prevents duplicate loaders (CompanyRouteGuard + CompanyDashboard)
  if (isLoading || rolesLoading) {
    return <>{children}</>;
  }

  // CRITICAL FIX: If URL company is in user's roles, grant access immediately
  // This bypasses the async validator when we already know the user has access
  if (urlCompanyInRoles) {
    
    return <>{children}</>;
  }

  // Handle access denied - redirect to first available company or mission control
  if (!hasAccess) {
    // If user has companies, redirect to first one
    if (companyRoles.length > 0) {
      const fallbackCompany = companyRoles[0];
      
      return <Navigate to={`/app/company/${encodeURIComponent(fallbackCompany.companyName)}`} replace />;
    }

    // No companies available, redirect to mission control
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