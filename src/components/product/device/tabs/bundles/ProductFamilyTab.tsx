import React from 'react';
import { Package2 } from 'lucide-react';
import { ProductVariationsSection } from '@/components/product/device/sections/ProductVariationsSection';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductFamilyTabProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function ProductFamilyTab({ productId, companyId, disabled = false }: ProductFamilyTabProps) {
  const { lang } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package2 className="h-5 w-5 text-primary" />
            {lang('bundles.family.title')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang('bundles.family.description')}
          </p>
        </div>
        <ProductVariationsSection productId={productId} companyId={companyId} disabled={disabled} />
      </div>
    </div>
  );
}
