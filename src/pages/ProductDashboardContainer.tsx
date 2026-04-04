import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CompanyDashboardErrorBoundary } from '@/components/error/CompanyDashboardErrorBoundary';
import { CompanyDocumentManager } from '@/components/documents/CompanyDocumentManager';
import { GapAnalysis } from '@/components/product/GapAnalysis';
import { ProductAudits } from '@/components/product/ProductAudits';
import { ProductCertifications } from '@/components/product/ProductCertifications';
import { TeamMembers } from '@/components/product/TeamMembers';
import { ProductActivitiesTab } from '@/components/activities/ProductActivitiesTab';
import { ComprehensiveDeviceInformation } from '@/components/product/device/ComprehensiveDeviceInformation';
import { ProductPageHeader } from '@/components/product/layout/ProductPageHeader';
import { LifecycleErrorBoundary } from '@/components/product/device/LifecycleErrorBoundary';
import { ProductLifecycleOverview } from '@/components/product/ProductLifecycleOverview';
import { useProductDetails } from '@/hooks/useProductDetails';
import { SimplifiedPhaseDataService } from '@/components/settings/phases/SimplifiedPhaseDataService';
import { ProductRelationshipsManager } from '@/components/commercial/ProductRelationshipsManager';
import { ClinicalTrialsManager } from '@/components/clinical/ClinicalTrialsManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProductMarketStatus } from "@/hooks/useProductMarketStatus";
import { useTranslation } from '@/hooks/useTranslation';

export default function ProductDashboardContainer() {
  const { productId } = useParams<{ productId: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { lang } = useTranslation();

  const { data: product, isLoading, error, refetch } = useProductDetails(productId);

  // Calculate market status for badges - MUST be called before any conditional returns
  const marketStatus = useProductMarketStatus(product?.markets);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleArchive = async () => {
    if (!product?.id) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_archived: true })
        .eq('id', product.id);

      if (error) throw error;

      toast.success(lang('productDashboard.deviceArchivedSuccess'));
    } catch (error) {
      console.error('Error archiving device:', error);
      toast.error(lang('productDashboard.deviceArchiveFailed'));
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!product?.company_id) return;

    try {
      await SimplifiedPhaseDataService.deletePhase(phaseId);
      toast.success(lang('productDashboard.phaseDeletedSuccess'));
    } catch (error) {
      console.error('Error deleting phase:', error);
      toast.error(lang('productDashboard.phaseDeleteFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">{lang('productDashboard.loadingDeviceStatus')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-500">{lang('productDashboard.errorLoadingDevice')}</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{lang('productDashboard.deviceNotFound')}</h2>
          <p className="text-muted-foreground">{lang('productDashboard.deviceNotFoundSimple')}</p>
        </div>
      </div>
    );
  }

  // Transform product data for ProductLifecycleOverview
  const chartProducts = product ? [{
    id: product.id,
    name: product.name,
    progress: product.progress || 0,
    status: product.status || 'On Track',
    phase: product.current_lifecycle_phase || 'Not Started'
  }] : [];

  return (
    <CompanyDashboardErrorBoundary>
      <ProductPageHeader
        product={product}
        subsection={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        marketStatus={marketStatus}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="overview">{lang('productDashboard.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="device">{lang('productDashboard.tabs.deviceInfo')}</TabsTrigger>
          <TabsTrigger value="documents">{lang('productDashboard.tabs.documents')}</TabsTrigger>
          <TabsTrigger value="activities">{lang('productDashboard.tabs.activities')}</TabsTrigger>
          <TabsTrigger value="audits">{lang('productDashboard.tabs.audits')}</TabsTrigger>
          <TabsTrigger value="certifications">{lang('productDashboard.tabs.certifications')}</TabsTrigger>
          <TabsTrigger value="clinical">{lang('productDashboard.tabs.clinical')}</TabsTrigger>
          <TabsTrigger value="relationships">{lang('productDashboard.tabs.relationships')}</TabsTrigger>
          <TabsTrigger value="gap-analysis">{lang('productDashboard.tabs.gapAnalysis')}</TabsTrigger>
          <TabsTrigger value="team">{lang('productDashboard.tabs.team')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <LifecycleErrorBoundary>
            <ProductLifecycleOverview products={chartProducts} companyId={product.company_id} />
          </LifecycleErrorBoundary>
        </TabsContent>

        <TabsContent value="device">
          <ComprehensiveDeviceInformation />
        </TabsContent>

        <TabsContent value="documents">
          <CompanyDocumentManager companyId={product.company_id} />
        </TabsContent>

        <TabsContent value="activities">
          <ProductActivitiesTab />
        </TabsContent>

        <TabsContent value="audits">
          <ProductAudits productId={productId} audits={[]} />
        </TabsContent>

        <TabsContent value="certifications">
          <ProductCertifications certifications={[]} />
        </TabsContent>

        <TabsContent value="clinical">
          {product?.company_id && (
            <ClinicalTrialsManager 
              productId={productId || ''} 
              companyId={product.company_id}
              companyName={product.company || ''}
            />
          )}
        </TabsContent>

        <TabsContent value="relationships">
          {product?.company_id && (
            <ProductRelationshipsManager 
              companyId={product.company_id} 
              productId={productId || ''} 
            />
          )}
        </TabsContent>

        <TabsContent value="gap-analysis">
          <GapAnalysis productId={productId} />
        </TabsContent>

        <TabsContent value="team">
          <TeamMembers members={[]} />
        </TabsContent>
      </Tabs>
    </CompanyDashboardErrorBoundary>
  );
}
