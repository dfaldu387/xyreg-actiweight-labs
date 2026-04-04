
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { GitBranch, Plus, History, RefreshCw } from 'lucide-react';
import { Product } from '@/types/client';
import { ProductVersionHierarchy as VersionHierarchyType } from '@/types/project';
import { VersionSelector } from '@/components/version/VersionSelector';
import { VersionBreadcrumbs } from '@/components/version/VersionBreadcrumbs';
import { VersionComparisonDialog } from '@/components/version/VersionComparisonDialog';
import { getProductVersionHierarchy } from '@/services/versionManagementService';
import { toast } from 'sonner';

interface ProductVersionHeaderProps {
  product: Product;
  onVersionSwitch?: (productId: string) => void;
  onCreateVersion?: () => void;
  onRefresh?: () => void;
}

export function ProductVersionHeader({
  product,
  onVersionSwitch,
  onCreateVersion,
  onRefresh
}: ProductVersionHeaderProps) {
  const [versionHierarchy, setVersionHierarchy] = useState<VersionHierarchyType[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);

  useEffect(() => {
    loadVersionHierarchy();
  }, [product.id]);

  const loadVersionHierarchy = async () => {
    if (!product.id) return;

    setIsLoadingHierarchy(true);
    try {
      // Use the root product ID or current product ID for hierarchy
      const rootProductId = product.parent_product_id || product.id;
      const hierarchy = await getProductVersionHierarchy(rootProductId);
      setVersionHierarchy(hierarchy);
    } catch (error) {
      console.error('Error loading version hierarchy:', error);
      toast.error('Failed to load version hierarchy');
    } finally {
      setIsLoadingHierarchy(false);
    }
  };

  const handleVersionSwitch = (productId: string) => {
    onVersionSwitch?.(productId);
    toast.success('Switched to selected version');
  };

  const handleCreateVersion = () => {
    onCreateVersion?.();
  };

  const hasVersions = versionHierarchy.length > 1;
  const currentVersion = versionHierarchy.find(v => v.product_id === product.id);

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-medium">Version Management</h3>
              <p className="text-sm text-muted-foreground">
                Current version: <Badge variant="outline">v{product.version || '1.0'}</Badge>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={isLoadingHierarchy}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingHierarchy ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            {hasVersions && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(true)}
              >
                <History className="h-4 w-4 mr-2" />
                Compare
              </Button>
            )}
            
            {onCreateVersion && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateVersion}
              >
                <Plus className="h-4 w-4 mr-2" />
                Update Product
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Version Selector */}
          <div className="flex items-center gap-4">
            <VersionSelector
              companyId={product.company_id}
              currentProductId={product.id}
              rootProductId={product.parent_product_id || product.id}
              onVersionSelect={handleVersionSwitch}
              onCreateVersion={handleCreateVersion}
              className="flex-1 max-w-xs"
            />
          </div>

          {/* Version Breadcrumbs */}
          {hasVersions && currentVersion && (
            <VersionBreadcrumbs
              hierarchy={versionHierarchy}
              currentVersionId={product.id}
              onVersionSelect={handleVersionSwitch}
            />
          )}
        </div>
      </CardContent>

      {/* Version Comparison Dialog */}
      <VersionComparisonDialog
        open={showComparison}
        onOpenChange={setShowComparison}
        companyId={product.company_id}
        rootProductId={product.parent_product_id || product.id}
        currentVersionId={product.id}
      />
    </Card>
  );
}
