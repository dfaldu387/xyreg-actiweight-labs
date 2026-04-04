import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { QualityManualDashboard } from '@/components/quality-manual/QualityManualDashboard';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Loader2 } from 'lucide-react';

export default function QualityManualPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : "";
  const companyId = useCompanyId();

  const breadcrumbs = [
    { label: "Client Compass", onClick: () => navigate('/app/clients') },
    { label: decodedCompanyName, onClick: () => navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}`) },
    { label: "Global Quality Manual" }
  ];

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${decodedCompanyName} Global Quality Manual`}
        subtitle="Enterprise-wide QMS documentation per ISO 13485 §4.2.2"
      />
      <div className="px-2">
        {companyId ? (
          <QualityManualDashboard companyId={companyId} />
        ) : (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
