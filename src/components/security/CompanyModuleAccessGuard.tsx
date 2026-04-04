import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useUserModuleAccess } from '@/hooks/useUserModuleAccess';
import { FullPageLoader } from '@/components/ui/loading-spinner';
import { AlertTriangle } from 'lucide-react';

interface CompanyModuleAccessGuardProps {
  children: React.ReactNode;
  requiredModuleId: string;
}

/**
 * CRITICAL SECURITY COMPONENT: Guards company module-specific routes
 * Prevents unauthorized access to restricted company modules
 */
export function CompanyModuleAccessGuard({ children, requiredModuleId }: CompanyModuleAccessGuardProps) {
  const { companyName } = useParams<{ companyName: string }>();
  const { hasAccess, isLoading, allowedModuleIds } = useUserModuleAccess();

  // Show loading while validating access
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <FullPageLoader />
        <div className="text-center mt-4">
          <p className="text-muted-foreground">Validating module access...</p>
        </div>
      </div>
    );
  }

  // Check if user has access to this module
  if (!hasAccess(requiredModuleId)) {
    // Redirect to company portfolio landing page
    return <Navigate to={`/app/company/${companyName}/portfolio-landing`} replace />;
  }

  // Access granted - render children
  return <>{children}</>;
}

/**
 * Module Access Denied Error Page Component
 */
export function ModuleAccessDenied({ moduleName }: { moduleName?: string }) {
  const { companyName } = useParams<{ companyName: string }>();

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
            <h2 className="text-2xl font-bold text-foreground">Module Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the {moduleName || 'requested module'}.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Please contact your administrator if you believe you should have access.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => window.location.href = `/app/company/${companyName}/portfolio-landing`}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
