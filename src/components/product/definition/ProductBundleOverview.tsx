import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ExternalLink, Settings } from 'lucide-react';
import { useProductBundleWithVariants } from '@/hooks/useProductBundle';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductBundleOverviewProps {
  productId: string;
  companyId: string;
  companyName: string;
}

export function ProductBundleOverview({ productId, companyId, companyName }: ProductBundleOverviewProps) {
  const navigate = useNavigate();
  const { data: bundle, isLoading } = useProductBundleWithVariants(
    productId, 
    companyId,
  );

  const handleProductClick = (targetProductId: string) => {
    navigate(`/app/product/${targetProductId}/device-information`);
  };

  const handleManageBundle = () => {
    navigate(`/app/product/${productId}/bundle-management`);
  };

  const handleManageArchitecture = () => {
    navigate(`/app/company/${encodeURIComponent(companyName)}/commercial?tab=commercial-performance`);
  };

  // If no company data, show minimal UI with manage button
  if (!companyId || !companyName) {
    return (
      <div className="space-y-4">
        <div 
          className="flex items-start gap-3 cursor-pointer hover:bg-accent/50 p-3 -m-3 rounded-lg transition-colors"
          onClick={handleManageBundle}
        >
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
            <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Product Bundle
            </div>
            <div className="text-sm text-muted-foreground">
              Configure bundle relationships
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!bundle) return null;

  const totalProducts = 
    bundle.accessories.length + 
    bundle.consumables.length + 
    bundle.bundleItems.length;

  const hasBundle = totalProducts > 0;

  return (
    <div className="space-y-4">
      <div 
        className="flex items-start gap-3 cursor-pointer hover:bg-accent/50 p-3 -m-3 rounded-lg transition-colors"
        onClick={handleManageBundle}
      >
        <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
          <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Product Bundle
          </div>
          {hasBundle ? (
            <div className="space-y-1">
              {bundle.bundleItems.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Main Products: {bundle.bundleItems.length}
                </div>
              )}
              {bundle.accessories.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Accessories: {bundle.accessories.length}
                </div>
              )}
              {bundle.consumables.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Consumables: {bundle.consumables.length}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No bundle defined
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
