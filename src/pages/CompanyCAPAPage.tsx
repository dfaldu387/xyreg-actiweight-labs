import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';
import { useCAPAsByCompany, useCAPAAnalytics } from '@/hooks/useCAPAData';
import { CAPADashboard } from '@/components/capa/CAPADashboard';
import { CAPAList } from '@/components/capa/CAPAList';
import { CAPACreateDialog } from '@/components/capa/CAPACreateDialog';
import { CAPAHelixHealthIndex } from '@/components/capa/CAPAHelixHealthIndex';
import { CAPASourceHeatmap } from '@/components/capa/CAPASourceHeatmap';
import { CAPAAgingChart } from '@/components/capa/CAPAAgingChart';
import { CAPARecord } from '@/types/capa';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { useTranslation } from '@/hooks/useTranslation';

export default function CompanyCAPAPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : '';
  const { data: companyInfo, isLoading: companyLoading } = useCompanyInfo();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isRestricted = !isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.CAPA);
  const { lang } = useTranslation();

  const companyId = companyInfo?.id;

  const { data: capas = [], isLoading: capasLoading } = useCAPAsByCompany(companyId);
  const { data: analytics, isLoading: analyticsLoading } = useCAPAAnalytics(companyId);

  const handleCAPAClick = (capa: CAPARecord) => {
    navigate(`/app/capa/${capa.id}`);
  };

  if (companyLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={[
            { label: "Client Compass", onClick: () => navigate('/app/clients') },
            { label: lang('capa.loading') },
            { label: lang('capa.management') }
          ]}
          title={lang('capa.loading')}
          subtitle={lang('capa.loadingManagement')}
        />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Client Compass", onClick: () => navigate('/app/clients') },
    { label: decodedCompanyName, onClick: () => navigate(`/app/company/${companyName}`) },
    { label: lang('capa.management') }
  ];

  return (
    <RestrictedFeatureProvider isRestricted={isRestricted} planName={planName} featureName={lang('capa.management')}>
      <div className="space-y-6">
        <ConsistentPageHeader
          breadcrumbs={breadcrumbs}
          title={lang('capa.management')}
          subtitle={lang('capa.subtitle')}
          actions={
            <Button onClick={() => setCreateDialogOpen(true)} disabled={isRestricted}>
              <Plus className="h-4 w-4 mr-2" />
              {lang('capa.newCapa')}
            </Button>
          }
        />

        {isRestricted && <RestrictedPreviewBanner className="mx-2 !mb-0" />}

        <div className="space-y-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">{lang('capa.overview')}</TabsTrigger>
              <TabsTrigger value="records">{lang('capa.capaRecords')}</TabsTrigger>
              <TabsTrigger value="analytics">{lang('capa.advancedAnalytics')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats Dashboard */}
              <CAPADashboard
                analytics={analytics || null}
                isLoading={analyticsLoading}
              />

              {/* Health Index & Aging Side-by-Side */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <CAPAHelixHealthIndex capas={capas} />
                <CAPAAgingChart capas={capas} />
                <CAPASourceHeatmap capas={capas} />
              </div>
            </TabsContent>

            <TabsContent value="records">
              <CAPAList
                capas={capas}
                isLoading={capasLoading}
                onCAPAClick={isRestricted ? undefined : handleCAPAClick}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Full Analytics View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CAPAHelixHealthIndex capas={capas} />
                <CAPAAgingChart capas={capas} />
              </div>
              <CAPASourceHeatmap capas={capas} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Create Dialog */}
        {companyId && !isRestricted && (
          <CAPACreateDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            companyId={companyId}
          />
        )}
      </div>
    </RestrictedFeatureProvider>
  );
}
