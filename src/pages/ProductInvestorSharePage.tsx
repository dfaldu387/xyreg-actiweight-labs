import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { EnhancedProductCreationDialog } from '@/components/product/EnhancedProductCreationDialog';
import { useProductCreationContext } from '@/hooks/useProductCreationContext';
import { XyregGenesisWelcome } from '@/components/investor-share/XyregGenesisWelcome';
import { XyregGenesisChecklistCards } from '@/components/investor-share/XyregGenesisChecklistCards';
import { CompetitiveAnalysisTeaser } from '@/components/investor-share/CompetitiveAnalysisTeaser';
import { RegulatoryPathwayTeaser } from '@/components/investor-share/RegulatoryPathwayTeaser';
import { IPPortfolioTeaser } from '@/components/investor-share/IPPortfolioTeaser';
import { InvestorShareCard } from '@/components/investor-share/InvestorShareCard';
import { MarketplaceShareCard } from '@/components/investor-share/MarketplaceShareCard';
import { GenesisLaunchStepsSidebar } from '@/components/investor-share/GenesisLaunchStepsSidebar';
import { Button } from '@/components/ui/button';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useViabilityFunnelProgress } from '@/hooks/useViabilityFunnelProgress';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';

export default function ProductInvestorSharePage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading: productLoading } = useProductDetails(productId);
  const companyId = product?.company_id;
  const companyName = (product as any)?.companies?.name || 'Company';
  const productName = product?.name || 'Product';

  const handleNavigateToClients = () => navigate('/app/clients');
  const handleNavigateToCompany = () => {
    if (companyName) {
      navigate(`/app/company/${encodeURIComponent(companyName)}/mission-control`);
    }
  };
  const handleNavigateToProduct = () => {
    if (productId) {
      navigate(`/app/product/${productId}/device-information`);
    }
  };

  const [showCreateDeviceDialog, setShowCreateDeviceDialog] = useState(false);
  const { handleProductCreated } = useProductCreationContext();
  const { readinessChecklist, overallProgress, isLoading: funnelLoading } = useViabilityFunnelProgress(productId || '', companyId || '');

  if (productLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={[
            { label: "Client Compass", onClick: handleNavigateToClients },
            { label: "Loading...", onClick: () => {} },
          ]}
          title="Loading..."
          subtitle="Please wait..."
        />
        <div className="container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-48 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container py-6 space-y-8">
          {/* Action Button Row */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDeviceDialog(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Device
            </Button>
          </div>

          {/* Welcome Hero Section */}
          <XyregGenesisWelcome />

          {/* Two Sharing Cards - Side by Side on Desktop */}
          {companyId && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Share Your Business Case</h2>
                <p className="text-sm text-muted-foreground">
                  Choose how you want to connect with investors
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                {/* Share with Investor Card */}
                <InvestorShareCard
                  companyId={companyId}
                  companyName={companyName}
                  productId={productId}
                />

                {/* Share on Marketplace Card */}
                <MarketplaceShareCard
                  companyId={companyId}
                  companyName={companyName}
                  productId={productId}
                />
              </div>
            </div>
          )}

          {/* Checklist Cards Grid */}
          {!funnelLoading && (
            <XyregGenesisChecklistCards
              readinessChecklist={readinessChecklist}
              overallProgress={overallProgress}
              extraCards={productId && companyId ? [
                <CompetitiveAnalysisTeaser key="competitive" productId={productId} />,
                <RegulatoryPathwayTeaser key="regulatory" productId={productId} />,
                <IPPortfolioTeaser key="ip" companyId={companyId} />
              ] : undefined}
            />
          )}

          {companyId && (
            <EnhancedProductCreationDialog
              open={showCreateDeviceDialog}
              onOpenChange={setShowCreateDeviceDialog}
              companyId={companyId}
              onProductCreated={(newProductId, projectId) => {
                handleProductCreated(newProductId, projectId);
                navigate(`/app/product/${newProductId}/business-case?tab=genesis`);
              }}
            />
          )}
        </div>
      </div>

      {/* Right Sidebar - Steps List */}
      {productId && !funnelLoading && readinessChecklist.length > 0 && (
        <GenesisLaunchStepsSidebar
          productId={productId}
          readinessChecklist={readinessChecklist}
          overallProgress={overallProgress}
        />
      )}
    </div>
  );
}
