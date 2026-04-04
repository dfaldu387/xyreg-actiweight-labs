import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useDevMode } from "@/context/DevModeContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function ReviewRedirect() {
  const navigate = useNavigate();
  const { companyRoles, activeCompanyRole, isLoading: rolesLoading } = useCompanyRole();
  const { isDevMode, primaryCompany } = useDevMode();

  useEffect(() => {
    // Wait for roles to initialize
    if (rolesLoading) return;

    console.log("ReviewRedirect navigation logic:", { 
      isDevMode, 
      primaryCompany: primaryCompany?.name, 
      rolesLoading,
      companyRolesCount: companyRoles.length,
      activeCompany: activeCompanyRole?.companyName
    });

    // If in DevMode with a primary company selected, redirect to that company's review
    if (isDevMode && primaryCompany) {
      console.log("DevMode with primary company - redirecting to company review");
      navigate(`/app/company/${encodeURIComponent(primaryCompany.name)}/review`);
      return;
    }

    // If user has an active company role, redirect to that company's review
    if (activeCompanyRole?.companyName) {
      console.log("Active company role - redirecting to company review");
      navigate(`/app/company/${encodeURIComponent(activeCompanyRole.companyName)}/review`);
      return;
    }

    // If user has any company roles, redirect to the first one's review
    if (companyRoles.length > 0) {
      console.log("Multiple company roles - redirecting to first company review");
      navigate(`/app/company/${encodeURIComponent(companyRoles[0].companyName)}/review`);
      return;
    }

    // Fallback: redirect to general review (though this shouldn't happen in normal flow)
    console.log("No company context - redirecting to general review");
    navigate('/app/review');
  }, [navigate, companyRoles, activeCompanyRole, rolesLoading, isDevMode, primaryCompany]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Redirecting to review dashboard...</p>
      </div>
    </div>
  );
}
