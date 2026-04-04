import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductsByBasicUDI } from '@/hooks/useProductsByBasicUDI';
import { useFamilyMetrics } from '@/hooks/useFamilyMetrics';
import { FamilyDashboardHeader } from '@/components/product/family/FamilyDashboardHeader';
import { FamilyMetricCards } from '@/components/product/family/FamilyMetricCards';
import { FamilyPipelineChart } from '@/components/product/family/FamilyPipelineChart';
import { FamilyVariantsTable } from '@/components/product/family/FamilyVariantsTable';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DeviceFamilyDashboard() {
  const { companyId, familyKey } = useParams<{ companyId: string; familyKey: string }>();
  const navigate = useNavigate();
  const { groupedProducts, isLoading, error } = useProductsByBasicUDI(companyId || '', familyKey);
  const { getPrimaryRegulatoryClass, getLifecycleStatus } = useFamilyMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-500">Error loading family data: {error.message}</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const familyProducts = familyKey ? (groupedProducts?.get(familyKey) || []) : [];

  if (familyProducts.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground">No products found for this family.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Derive family name from first product
  const familyName = familyProducts[0]?.trade_name || familyProducts[0]?.name || 'Unknown Family';
  const variantCount = familyProducts.length;
  const primaryClass = getPrimaryRegulatoryClass(familyProducts);
  const lifecycleStatus = getLifecycleStatus(familyProducts);

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Breadcrumb / Back Button */}
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Portfolio
        </Button>
      </div>

      {/* Header */}
      <FamilyDashboardHeader
        familyName={familyName}
        variantCount={variantCount}
        primaryClass={primaryClass}
        lifecycleStatus={lifecycleStatus}
      />

      {/* Metric Cards */}
      <FamilyMetricCards products={familyProducts} />

      {/* Pipeline Chart */}
      <FamilyPipelineChart products={familyProducts} />

      {/* Variants Table */}
      <FamilyVariantsTable products={familyProducts} companyId={companyId || ''} />
    </div>
  );
}
