import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, LayoutDashboard, FileText, Clock } from 'lucide-react';
import { IPDashboard } from '@/components/ip-management/IPDashboard';
import { IPAssetsList } from '@/components/ip-management/IPAssetsList';
import { IPDeadlineTracker } from '@/components/ip-management/IPDeadlineTracker';
import { IPAssetForm } from '@/components/ip-management/IPAssetForm';
import { IPAsset } from '@/hooks/useIPAssets';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { useTranslation } from '@/hooks/useTranslation';

export default function CompanyIPPortfolioPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const companyId = useCompanyId();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<IPAsset | null>(null);
  const { lang } = useTranslation();

  // Restriction check - double security pattern (hooks must be called before any conditional returns)
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMERCIAL_IP_PORTFOLIO);
  const isRestricted = !isFeatureEnabled;

  const handleCreateNew = () => {
    if (isRestricted) return;
    setSelectedAsset(null);
    setIsFormOpen(true);
  };

  const handleSelectAsset = (asset: IPAsset) => {
    if (isRestricted) return;
    setSelectedAsset(asset);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setSelectedAsset(null);
    setIsFormOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (isRestricted && open) return;
    setIsFormOpen(open);
  };

  if (!companyId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-muted-foreground">
          {lang('ipPortfolio.loadingCompany')}
        </div>
      </div>
    );
  }

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName={lang('ipPortfolio.featureName')}
    >
      <div className="p-2 pt-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Lightbulb className="h-8 w-8" />
            {lang('ipPortfolio.title')}
          </h1>
          <p className="text-muted-foreground">
            {lang('ipPortfolio.subtitle')}
          </p>
        </div>

        {isRestricted && <RestrictedPreviewBanner />}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard" className="flex items-center gap-2" disabled={isRestricted}>
              <LayoutDashboard className="h-4 w-4" />
              {lang('ipPortfolio.tabs.dashboard')}
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2" disabled={isRestricted}>
              <FileText className="h-4 w-4" />
              {lang('ipPortfolio.tabs.assets')}
            </TabsTrigger>
            <TabsTrigger value="deadlines" className="flex items-center gap-2" disabled={isRestricted}>
              <Clock className="h-4 w-4" />
              {lang('ipPortfolio.tabs.deadlines')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <IPDashboard companyId={companyId} />
          </TabsContent>

          <TabsContent value="assets" className="mt-6">
            <IPAssetsList
              companyId={companyId}
              onCreateNew={handleCreateNew}
              onSelectAsset={handleSelectAsset}
              disabled={isRestricted}
            />
          </TabsContent>

          <TabsContent value="deadlines" className="mt-6">
            <IPDeadlineTracker companyId={companyId} disabled={isRestricted} />
          </TabsContent>
        </Tabs>

        {/* IP Asset Form Dialog */}
        <IPAssetForm
          companyId={companyId}
          asset={selectedAsset}
          open={isFormOpen}
          onOpenChange={handleOpenChange}
          onSuccess={handleFormSuccess}
          disabled={isRestricted}
        />
      </div>
    </RestrictedFeatureProvider>
  );
}
