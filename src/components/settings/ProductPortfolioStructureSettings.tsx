import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCompanyId } from "@/hooks/useCompanyId";
import { VariationDimensionsManager } from "./variation/VariationDimensionsManager";
import { DeviceCategoriesManagement } from "./DeviceCategoriesManagement";
import { ProductModelsManagement } from "./ProductModelsManagement";
import { ProductPlatformsManagement } from "./ProductPlatformsManagement";
import { Info } from "lucide-react";

interface Props { companyId: string; }

export function ProductPortfolioStructureSettings({ companyId }: Props) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <CardTitle className="text-lg">Device Portfolio Structure</CardTitle>
              <CardDescription className="mt-2">
                Define categories, platforms, models, and variation dimensions for your device portfolio.
                For variant-level revenue distribution settings (e.g., sales percentages by size), go to individual device pages.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <DeviceCategoriesManagement companyId={companyId} />
      <ProductPlatformsManagement companyId={companyId} />
      <ProductModelsManagement companyId={companyId} />
      <VariationDimensionsManager companyId={companyId} />
    </div>
  );
}
