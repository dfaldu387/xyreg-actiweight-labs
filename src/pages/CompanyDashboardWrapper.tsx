
import React, { Suspense, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CompanyDashboardErrorBoundary } from "@/components/error/CompanyDashboardErrorBoundary";

// Lazy load the actual CompanyDashboard with error handling
const LazyCompanyDashboard = React.lazy(() => 
  import("./CompanyDashboard").catch(error => {
    // Return a fallback component if the main component fails to load
    return import("./CompanyDashboardFallback");
  })
);

export default function CompanyDashboardWrapper() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();

  // Handle invalid company names immediately
  useEffect(() => {
    const decodedName = companyName ? decodeURIComponent(companyName) : '';
    if (!decodedName || decodedName === 'Unknown Company' || decodedName.trim() === '') {
      navigate('/app/clients', { replace: true });
    }
  }, [companyName, navigate]);

  // Don't render anything if we have an invalid company name
  const decodedName = companyName ? decodeURIComponent(companyName) : '';
  if (!decodedName || decodedName === 'Unknown Company' || decodedName.trim() === '') {
    return null;
  }

  return (
    <CompanyDashboardErrorBoundary companyName={companyName}>
      <Suspense 
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-muted-foreground">Loading company dashboard...</p>
            </div>
          </div>
        }
      >
        <LazyCompanyDashboard />
      </Suspense>
    </CompanyDashboardErrorBoundary>
  );
}
