import React, { useMemo, useState, useCallback } from 'react';
import { useBundleDetails } from '@/hooks/useProductBundleGroups';
import { RNPVAnalysis, ExportData } from '@/components/product/business/RNPVAnalysis';
import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Download, AlertTriangle } from 'lucide-react';
import { BundleRNPVExportService } from '@/services/bundleRNPVExportService';
import { toast } from 'sonner';

interface BundleRNPVAdapterProps {
  bundleId: string;
  disabled?: boolean;
}

/**
 * Adapter component that transforms bundle products into "markets" 
 * so they can be analyzed using the existing RNPVAnalysis component.
 * 
 * Key mapping:
 * - market.code → product.id
 * - market.name → product.name
 * - market.selected → true (all bundle products are selected)
 * - market.launchDate → product.projected_launch_date or actual_launch_date
 */
export function BundleRNPVAdapter({ bundleId, disabled = false }: BundleRNPVAdapterProps) {
  const { data: bundle, isLoading, error } = useBundleDetails(bundleId);
  const [exportData, setExportData] = useState<ExportData | null>(null);

  // Transform bundle products into "market" format for RNPVAnalysis
  const productAsMarkets = useMemo(() => {
    if (!bundle?.members || bundle.members.length === 0) {
      return [];
    }

    const markets: EnhancedProductMarket[] = bundle.members
      .filter(member => {
        // Include if it has EITHER a product OR a sibling group
        const hasProduct = member.product_id && (member as any).products;
        const hasSiblingGroup = member.sibling_group_id && (member as any).product_sibling_groups;
        return hasProduct || hasSiblingGroup;
      })
      .map(member => {
        let productId: string;
        let productName: string;
        let launchDate: Date | undefined;

        // Handle direct product member
        if (member.product_id && (member as any).products) {
          const product = (member as any).products;
          productId = product.id;
          productName = product.name || `Product ${product.id.substring(0, 8)}`;
          
          if (product.actual_launch_date) {
            launchDate = new Date(product.actual_launch_date);
          } else if (product.projected_launch_date) {
            launchDate = new Date(product.projected_launch_date);
          }
        }
        // Handle sibling group member
        else if (member.sibling_group_id && (member as any).product_sibling_groups) {
          const siblingGroup = (member as any).product_sibling_groups;
          productId = siblingGroup.id;
          productName = siblingGroup.name || `Group ${siblingGroup.id.substring(0, 8)}`;
        }

        return {
          code: productId!,
          name: productName!,
          selected: true,
          riskClass: 'medium' as const,
          launchDate,
        };
      });

    return markets;
  }, [bundle]);

  // Handle export data callback
  const handleExportData = useCallback((data: ExportData) => {
    setExportData(data);
  }, []);

  // Handle Excel export
  const handleExportToExcel = useCallback(() => {
    if (!exportData || !bundle) {
      toast.error('No data available to export');
      return;
    }

    try {
      BundleRNPVExportService.exportToExcel(
        bundle.bundle_name || 'Bundle',
        exportData.marketResults,
        exportData.marketInputs,
        exportData.portfolioResults,
        exportData.selectedMarkets
      );
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export to Excel');
    }
  }, [exportData, bundle]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading bundle products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load bundle details. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  // No bundle data
  if (!bundle) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Bundle not found. Please check the bundle ID.
        </AlertDescription>
      </Alert>
    );
  }

  // No products in bundle
  if (productAsMarkets.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This bundle has no products yet. Add products to the bundle to begin rNPV analysis.
        </AlertDescription>
      </Alert>
    );
  }

  // Render the existing RNPVAnalysis component with products as "markets"
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 border rounded-lg p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="font-semibold text-sm">Bundle rNPV Analysis</h3>
              <span className="text-xs text-muted-foreground">
                {productAsMarkets.length} product{productAsMarkets.length !== 1 ? 's' : ''} • {bundle.bundle_name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              NPV analysis with budget data auto-loaded from milestones
            </p>
          </div>
          <Button
            onClick={handleExportToExcel}
            disabled={!exportData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 shrink-0"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <RNPVAnalysis 
        markets={productAsMarkets}
        productId={undefined}
        bundleId={bundleId}
        isBundleMode={true}
        onExportData={handleExportData}
      />
    </div>
  );
}
