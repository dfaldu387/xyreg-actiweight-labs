
import React from "react";
import { ProductLifecycleOverview } from "./ProductLifecycleOverview";
import { Card, CardContent } from "@/components/ui/card";
import { ChartProduct } from "@/types/client";

interface ProductLifecycleChartProps {
  products: ChartProduct[];
  companyId?: string;
}

export function ProductLifecycleChart({ products, companyId }: ProductLifecycleChartProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <ProductLifecycleOverview products={products} companyId={companyId} />
      </CardContent>
    </Card>
  );
}
