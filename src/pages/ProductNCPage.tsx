import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useNCsByProduct } from '@/hooks/useNonconformityData';
import { NCList } from '@/components/nonconformity/NCList';
import { NCCreateDialog } from '@/components/nonconformity/NCCreateDialog';
import { NCRecord } from '@/types/nonconformity';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { DEVICES_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';

export default function ProductNCPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading: productLoading } = useProductDetails(productId || undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isRestricted = !isMenuAccessKeyEnabled(DEVICES_MENU_ACCESS.NONCONFORMITY ?? 'devices.nonconformity');

  const companyId = product?.company_id;
  const { data: ncs = [], isLoading: ncsLoading } = useNCsByProduct(productId);

  const handleNCClick = (nc: NCRecord) => {
    navigate(`/app/nonconformity/${nc.id}`);
  };

  if (!productId) {
    return <div className="px-2 py-6 text-center text-destructive">Product Not Found</div>;
  }

  if (productLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={[{ label: "Loading..." }, { label: "Nonconformity" }]}
          title="Loading..."
          subtitle="Loading..."
        />
        <div className="flex-1 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
      </div>
    );
  }

  return (
    <RestrictedFeatureProvider isRestricted={isRestricted} planName={planName} featureName="Nonconformity">
      <div className="space-y-6">
        <ConsistentPageHeader
          breadcrumbs={[
            { label: "Client Compass", onClick: () => navigate('/app/clients') },
            { label: product?.company || "Company", onClick: () => product?.company && navigate(`/app/company/${encodeURIComponent(product.company)}`) },
            { label: product?.name || "Product", onClick: () => navigate(`/app/product/${productId}`) },
            { label: "Nonconformity" }
          ]}
          title={`${product?.name || 'Product'} Nonconformity`}
          subtitle="Track nonconforming product per ISO 13485 Clause 8.3"
          actions={
            <Button onClick={() => setCreateDialogOpen(true)} disabled={isRestricted}>
              <Plus className="h-4 w-4 mr-2" />
              New NC
            </Button>
          }
        />

        {isRestricted && <RestrictedPreviewBanner className="mx-2 !mb-0" />}

        <NCList ncs={ncs} isLoading={ncsLoading} onNCClick={isRestricted ? undefined : handleNCClick} />

        {companyId && !isRestricted && (
          <NCCreateDialog
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
