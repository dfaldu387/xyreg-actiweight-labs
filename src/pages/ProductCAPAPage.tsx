import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useCAPAsByProduct, useCAPAAnalyticsByProduct } from '@/hooks/useCAPAData';
import { CAPADashboard } from '@/components/capa/CAPADashboard';
import { CAPAList } from '@/components/capa/CAPAList';
import { CAPACreateDialog } from '@/components/capa/CAPACreateDialog';
import { CAPARecord } from '@/types/capa';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { DEVICES_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';

export default function ProductCAPAPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading: productLoading } = useProductDetails(productId || undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isRestricted = !isMenuAccessKeyEnabled(DEVICES_MENU_ACCESS.CAPA);

  const companyId = product?.company_id;
  
  const { data: capas = [], isLoading: capasLoading } = useCAPAsByProduct(productId);
  const { data: analytics, isLoading: analyticsLoading } = useCAPAAnalyticsByProduct(productId);

  const handleCAPAClick = (capa: CAPARecord) => {
    navigate(`/app/capa/${capa.id}`);
  };

  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    if (product?.company) {
      navigate(`/app/company/${encodeURIComponent(product.company)}`);
    }
  };

  const handleNavigateToProduct = () => {
    if (productId) {
      navigate(`/app/product/${productId}`);
    }
  };

  if (!productId) {
    return (
      <div className="px-2 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Product Not Found</h1>
          <p className="text-muted-foreground mt-2">
            Please navigate to a valid product to view CAPA records.
          </p>
        </div>
      </div>
    );
  }

  if (productLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={[
            { label: "Client Compass", onClick: handleNavigateToClients },
            { label: "Loading...", onClick: () => {} },
            { label: "Loading...", onClick: () => {} },
            { label: "CAPA Management" }
          ]}
          title="Loading..."
          subtitle="Loading CAPA management..."
        />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Client Compass", onClick: handleNavigateToClients },
    { label: product?.company || "Company", onClick: handleNavigateToCompany },
    { label: product?.name || "Product", onClick: handleNavigateToProduct },
    { label: "CAPA Management" }
  ];

  return (
    <RestrictedFeatureProvider isRestricted={isRestricted} planName={planName} featureName="CAPA Management">
      <div className="space-y-6">
        <ConsistentPageHeader
          breadcrumbs={breadcrumbs}
          title={`${product?.name || 'Product'} CAPA Management`}
          subtitle="Product-specific corrective and preventive actions"
          actions={
            <Button onClick={() => setCreateDialogOpen(true)} disabled={isRestricted}>
              <Plus className="h-4 w-4 mr-2" />
              New CAPA
            </Button>
          }
        />

        {isRestricted && <RestrictedPreviewBanner className="mx-2 !mb-0" />}

        <div className="px-2 space-y-6">
          {/* Analytics Dashboard */}
          <CAPADashboard
            analytics={analytics || null}
            isLoading={analyticsLoading}
          />

          {/* CAPA List */}
          <div>
            <h2 className="text-lg font-semibold mb-4">CAPA Records</h2>
            <CAPAList
              capas={capas}
              isLoading={capasLoading}
              onCAPAClick={isRestricted ? undefined : handleCAPAClick}
              showProduct
            />
          </div>
        </div>

        {/* Create Dialog */}
        {companyId && !isRestricted && (
          <CAPACreateDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            companyId={companyId}
            productId={productId}
          />
        )}
      </div>
    </RestrictedFeatureProvider>
  );
}
