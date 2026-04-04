import React, { useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, TrendingUp, AlertTriangle, Wand2 } from "lucide-react";
import { ProductLifecycleInfo } from '@/services/productLifecycleService';
import { LegacyProductPhaseService } from '@/services/legacyProductPhaseService';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductLifecycleBannerProps {
  portfolioSummary: {
    totalProducts: number;
    developmentProducts: { count: number; products: ProductLifecycleInfo[] };
    launchedProducts: { count: number; products: ProductLifecycleInfo[] };
    unknownProducts: { count: number; products: ProductLifecycleInfo[] };
  };
  companyId: string;
  onNavigateToRNPV: () => void;
  onRefresh: () => void;
  disabled?: boolean;
}

export function ProductLifecycleBanner({
  portfolioSummary,
  companyId,
  onNavigateToRNPV,
  onRefresh,
  disabled = false
}: ProductLifecycleBannerProps) {
  const { developmentProducts, launchedProducts, unknownProducts, totalProducts } = portfolioSummary;
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const { lang } = useTranslation();

  const handleAutoAssignLegacyProducts = async () => {
    if (disabled) return;
    setIsAutoAssigning(true);
    try {
      const result = await LegacyProductPhaseService.assignLegacyProductsToPhase(companyId);
      if (result.success && result.updatedCount > 0) {
        // Refresh the portfolio data
        onRefresh();
      }
    } finally {
      setIsAutoAssigning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Portfolio Overview */}
      <div className="bg-muted/30 border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">{lang('commercialPerformance.lifecycle.portfolioOverview')}</h3>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {developmentProducts.count} {lang('commercialPerformance.lifecycle.development')}
                </Badge>
                <span className="text-muted-foreground">{lang('commercialPerformance.lifecycle.devicesInRd')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {launchedProducts.count} {lang('commercialPerformance.lifecycle.launched')}
                </Badge>
                <span className="text-muted-foreground">{lang('commercialPerformance.lifecycle.devicesGeneratingRevenue')}</span>
              </div>
              {unknownProducts.count > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-gray-100">
                    {unknownProducts.count} {lang('commercialPerformance.lifecycle.unknown')}
                  </Badge>
                  <span className="text-muted-foreground">{lang('commercialPerformance.lifecycle.needsPhaseAssignment')}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalProducts}</div>
            <div className="text-sm text-muted-foreground">{lang('commercialPerformance.lifecycle.totalDevices')}</div>
          </div>
        </div>
      </div>

      {/* Commercial Performance Focus */}
      {launchedProducts.count > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-green-800">{lang('commercialPerformance.lifecycle.trackingActive')}</strong>
              <br />
              <span className="text-green-700">
                {launchedProducts.count > 1
                  ? lang('commercialPerformance.lifecycle.trackingDescriptionPlural').replace('{{count}}', String(launchedProducts.count))
                  : lang('commercialPerformance.lifecycle.trackingDescription').replace('{{count}}', String(launchedProducts.count))
                }
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Development Products rNPV Notice */}
      {developmentProducts.count > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-blue-800">{lang('commercialPerformance.lifecycle.rnpvNeeded')}</strong>
              <br />
              <span className="text-blue-700">
                {developmentProducts.count > 1
                  ? lang('commercialPerformance.lifecycle.rnpvNeededDescPlural').replace('{{count}}', String(developmentProducts.count))
                  : lang('commercialPerformance.lifecycle.rnpvNeededDesc').replace('{{count}}', String(developmentProducts.count))
                }
              </span>
            </div>
            <Button
              onClick={onNavigateToRNPV}
              variant="outline"
              size="sm"
              className="ml-4 border-blue-300 text-blue-700 hover:bg-blue-100"
              disabled={disabled}
            >
              {lang('commercialPerformance.lifecycle.openRnpv')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Unknown Products Warning */}
      {unknownProducts.count > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-amber-800">{lang('commercialPerformance.lifecycle.missingPhase')}</strong>
              <br />
              <span className="text-amber-700">
                {unknownProducts.count > 1
                  ? lang('commercialPerformance.lifecycle.missingPhaseDescPlural').replace('{{count}}', String(unknownProducts.count))
                  : lang('commercialPerformance.lifecycle.missingPhaseDesc').replace('{{count}}', String(unknownProducts.count))
                }
              </span>
            </div>
            <Button
              onClick={handleAutoAssignLegacyProducts}
              disabled={isAutoAssigning || disabled}
              variant="outline"
              size="sm"
              className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              {isAutoAssigning ? lang('commercialPerformance.lifecycle.assigning') : lang('commercialPerformance.lifecycle.autoAssign')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* No Products Message */}
      {totalProducts === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {lang('commercialPerformance.lifecycle.noDevices')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}