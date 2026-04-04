import React from 'react';
import { useParams } from 'react-router-dom';
import { useProductDetails } from '@/hooks/useProductDetails';
import { ProductPageHeader } from '@/components/product/layout/ProductPageHeader';
import { useProductMarketStatus } from '@/hooks/useProductMarketStatus';
import { BomRevisionList } from '@/components/bom/BomRevisionList';
import { useTranslation } from '@/hooks/useTranslation';

export default function DeviceBomPage() {
  const { productId } = useParams<{ productId: string }>();
  const { data: product, isLoading } = useProductDetails(productId);
  const marketStatus = useProductMarketStatus(product?.markets);
  const { lang } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {product && (
        <ProductPageHeader
          product={product}
          subsection={lang('bom.billOfMaterials')}
          marketStatus={marketStatus}
        />
      )}
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <BomRevisionList />
      </div>
    </div>
  );
}
