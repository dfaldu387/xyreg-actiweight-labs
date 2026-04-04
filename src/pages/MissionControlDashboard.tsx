import React from "react";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { MultiCompanyDashboard } from "@/components/mission-control/MultiCompanyDashboard";
import { SingleCompanyDashboard } from "@/components/mission-control/SingleCompanyDashboard";
import { SingleProductDashboard } from "@/components/mission-control/SingleProductDashboard";
import { ReviewerDashboard } from "@/components/mission-control/ReviewerDashboard";

export default function MissionControlDashboard() {
  const { dashboardType, isLoading, activeCompanyId, activeProductId } = useDashboardContext();

  if (isLoading) {
    return (
      <div className="px-2 py-8 h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  // Render the appropriate dashboard based on user context
  switch (dashboardType) {
    case 'multi-company':
      return <MultiCompanyDashboard />;
    
    case 'single-company':
      return <SingleCompanyDashboard />;
    
    case 'single-product':
      return (
        <SingleProductDashboard 
          productId={activeProductId!} 
          companyId={activeCompanyId!} 
        />
      );
    
    case 'reviewer':
      return <ReviewerDashboard />;
    
    default:
      return <SingleCompanyDashboard />;
  }
}