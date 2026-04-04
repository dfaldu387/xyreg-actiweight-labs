import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ComplianceInstancesOverview } from '@/components/compliance/ComplianceInstancesOverview';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';

export default function ComplianceInstancesPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : "";

  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    if (companyName) {
      navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}`);
    }
  };

  if (!companyName) {
    return (
      <div className="px-2 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Company Not Found</h1>
          <p className="text-muted-foreground mt-2">
            Please navigate to a valid company to view compliance instances.
          </p>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    {
      label: "Client Compass",
      onClick: handleNavigateToClients
    },
    {
      label: decodedCompanyName,
      onClick: handleNavigateToCompany
    },
    {
      label: "Compliance Instances"
    }
  ];

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${decodedCompanyName} Compliance Instances`}
        subtitle="Comprehensive regulatory compliance management"
      />
      <div className="px-2 space-y-6">
          <div className="mb-6">
            <div className="flex items-center justify-between border-b border-border">
              <h2 className="text-lg font-semibold py-3">Compliance Instances Overview</h2>
              <HelpTooltip 
                content="XYREG provides a systematic approach to managing medical device regulatory compliance across multiple jurisdictions. Our platform organizes compliance requirements into four key instances: Documents for technical documentation and submissions, Gap Analysis for standards compliance assessment, Activities for quality processes and testing protocols, and Audits for compliance verification and management reviews. This structured approach ensures comprehensive coverage of all regulatory requirements while maintaining traceability and accountability throughout the product lifecycle."
              />
            </div>
        </div>
        <ComplianceInstancesOverview 
          context="company"
          companyName={decodedCompanyName}
        />
      </div>
    </div>
  );
}