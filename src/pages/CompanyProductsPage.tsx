
import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { FullPageLoader } from "@/components/ui/loading-spinner";

/**
 * CompanyProductsPage redirects to the company dashboard since it already shows
 * the products for a specific company. This avoids duplicate code and ensures
 * consistent UI between different entry points.
 */
export default function CompanyProductsPage() {
  const { companyName } = useParams();
  
  if (!companyName) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Company Not Found</h2>
            <p className="text-muted-foreground max-w-md">
              No company name was provided. Please select a company.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show a loading indicator briefly before redirecting
  // This prevents a flash of blank screen
  return (
    <React.Fragment>
      <FullPageLoader />
      <Navigate
        to={`/app/company/${companyName}/portfolio?view=cards`}
        replace={true}
      />
    </React.Fragment>
  );
}
