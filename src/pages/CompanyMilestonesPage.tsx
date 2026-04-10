import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { CompanyMilestonesOfficial } from "@/components/company/CompanyMilestonesOfficial";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { buildCompanyBreadcrumbs } from "@/utils/breadcrumbUtils";
import { useTranslation } from "@/hooks/useTranslation";

export default function CompanyMilestonesPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const { activeCompanyRole, isLoading } = useCompanyRole();
  const navigate = useNavigate();
  const { lang } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const displayCompanyName = companyName || activeCompanyRole?.companyName;

  if (!displayCompanyName) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {lang("milestones.noCompanySelected")}
        </AlertDescription>
      </Alert>
    );
  }

  const breadcrumbs = buildCompanyBreadcrumbs(
    decodeURIComponent(displayCompanyName),
    lang("milestones.enterpriseTitle"),
    () => navigate("/app"),
    () => navigate(`/app/company/${encodeURIComponent(displayCompanyName)}`),
  );

  return (
    <div className="px-4 py-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={lang("milestones.pageTitle").replace(
          "{{companyName}}",
          decodeURIComponent(displayCompanyName),
        )}
        subtitle={lang("milestones.subtitle")}
      />
      <CompanyMilestonesOfficial
        companyName={decodeURIComponent(displayCompanyName)}
      />
    </div>
  );
}
