import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useProductBundles } from '@/hooks/useProductBundleGroups';
import { Package2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { BundleOverviewTab } from '@/components/product/bundle/BundleOverviewTab';
import { BundleBuildTab } from '@/components/product/bundle/BundleBuildTab';

export default function ProductBundleManagementPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: product, isLoading } = useProductDetails(productId!);
  const { data: bundles } = useProductBundles(productId!);
  
  const bundleIdFromUrl = searchParams.get('bundleId');
  const selectedBundleId = bundleIdFromUrl || bundles?.[0]?.id || null;
  
  useEffect(() => {
    if (!bundleIdFromUrl && bundles && bundles.length > 0) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('bundleId', bundles[0].id);
      setSearchParams(newParams, { replace: true });
    }
  }, [bundles, bundleIdFromUrl, searchParams, setSearchParams]);


  if (!productId) {
    return <div className="p-6">Product ID is required</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return <div className="p-6">Product not found</div>;
  }

  const handleNavigateToProduct = () => {
    navigate(`/app/product/${productId}/product-definition`);
  };

  const companyName = product.company || 'Company';
  
  const breadcrumbs = [
    { label: 'Client Compass', href: '/app/clients' },
    { label: companyName, href: `/app/company/${companyName}` },
    { label: product.name, href: `/app/product/${productId}/product-definition` },
    { label: 'Bundle Management' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${product.name} - Bundle Management`}
        subtitle="Define and manage product bundle relationships, accessories, consumables, and variants"
      />

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={handleNavigateToProduct}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Device Definition
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Bundle Overview</TabsTrigger>
            <TabsTrigger value="build">Build Bundle</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <BundleOverviewTab 
              productId={productId} 
              companyId={product.company_id}
              companyName={companyName}
              selectedBundleId={selectedBundleId}
              bundles={bundles || []}
              onNavigateToRelationships={() => setActiveTab('build')}
            />
          </TabsContent>

          <TabsContent value="build" className="space-y-6">
            <BundleBuildTab
              productId={productId}
              companyId={product.company_id}
              selectedBundleId={selectedBundleId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
