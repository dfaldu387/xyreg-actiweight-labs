import React from "react";
import { ProductVariantManager } from "../../variants/ProductVariantManager";

interface Props {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function ProductVariationsSection({ productId, companyId, disabled = false }: Props) {
  return <ProductVariantManager productId={productId} companyId={companyId} disabled={disabled} />;
}