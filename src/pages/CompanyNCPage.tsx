import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';
import { useNCsByCompany, useNCAnalytics } from '@/hooks/useNonconformityData';
import { NCList } from '@/components/nonconformity/NCList';
import { NCCreateDialog } from '@/components/nonconformity/NCCreateDialog';
import { NCDashboard } from '@/components/nonconformity/NCDashboard';
import { NCRecord } from '@/types/nonconformity';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { useTranslation } from '@/hooks/useTranslation';

export default function CompanyNCPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : '';
  const { data: companyInfo, isLoading: companyLoading } = useCompanyInfo();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isRestricted = !isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.NONCONFORMITY ?? 'portfolio.nonconformity');
  const { lang } = useTranslation();

  const companyId = companyInfo?.id;
  const { data: ncs = [], isLoading: ncsLoading } = useNCsByCompany(companyId);
  const { data: analytics, isLoading: analyticsLoading } = useNCAnalytics(companyId);

  const handleNCClick = (nc: NCRecord) => {
    navigate(`/app/nonconformity/${nc.id}`);
  };

  if (companyLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={[
            { label: "Client Compass", onClick: () => navigate('/app/clients') },
            { label: lang('nonconformity.loading') },
            { label: lang('nonconformity.breadcrumb') }
          ]}
          title={lang('nonconformity.loading')}
          subtitle={lang('nonconformity.loadingSubtitle')}
        />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <RestrictedFeatureProvider isRestricted={isRestricted} planName={planName} featureName="Nonconformity">
      <div className="space-y-6">
        <ConsistentPageHeader
          breadcrumbs={[
            { label: "Client Compass", onClick: () => navigate('/app/clients') },
            { label: decodedCompanyName, onClick: () => navigate(`/app/company/${companyName}`) },
            { label: lang('nonconformity.breadcrumb') }
          ]}
          title={lang('nonconformity.title')}
          subtitle={lang('nonconformity.subtitle')}
          actions={
            <Button onClick={() => setCreateDialogOpen(true)} disabled={isRestricted}>
              <Plus className="h-4 w-4 mr-2" />
              {lang('nonconformity.newNC')}
            </Button>
          }
        />

        {isRestricted && <RestrictedPreviewBanner className="mx-2 !mb-0" />}

        <Tabs defaultValue="records" className="space-y-4">
          <TabsList>
            <TabsTrigger value="records">{lang('nonconformity.ncRecords')}</TabsTrigger>
            <TabsTrigger value="overview">{lang('nonconformity.overview')}</TabsTrigger>
          </TabsList>

          <TabsContent value="records">
            <NCList ncs={ncs} isLoading={ncsLoading} onNCClick={isRestricted ? undefined : handleNCClick} />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <NCDashboard analytics={analytics || null} isLoading={analyticsLoading} />
          </TabsContent>
        </Tabs>

        {companyId && !isRestricted && (
          <NCCreateDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            companyId={companyId}
          />
        )}
      </div>
    </RestrictedFeatureProvider>
  );
}
