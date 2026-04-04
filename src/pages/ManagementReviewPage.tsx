import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { useCompanyId } from '@/hooks/useCompanyId';
import { ManagementReviewDashboard } from '@/components/management-review/ManagementReviewDashboard';
import { useTranslation } from '@/hooks/useTranslation';

export default function ManagementReviewPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : "";
  const companyId = useCompanyId();
  const { lang } = useTranslation();

  const breadcrumbs = [
    { label: "Client Compass", onClick: () => navigate('/app/clients') },
    { label: decodedCompanyName, onClick: () => navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}`) },
    { label: lang('managementReview.title') }
  ];

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${decodedCompanyName} ${lang('managementReview.title')}`}
        subtitle={lang('managementReview.subtitle')}
      />
      <div className="px-2 space-y-6">
        <ManagementReviewDashboard companyId={companyId} companyName={decodedCompanyName} />
      </div>
    </div>
  );
}
