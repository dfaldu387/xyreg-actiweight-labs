import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Shield, 
  Lightbulb, 
  PenTool, 
  X, 
  Loader2 
} from 'lucide-react';
import { ProductIPAsset, useUnlinkIPAsset } from '@/hooks/useProductIPAssets';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<string, React.ElementType> = {
  patent: FileText,
  trademark: Shield,
  trade_secret: Lightbulb,
  design_right: PenTool,
  copyright: FileText,
};

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-muted text-muted-foreground',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  filed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  granted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  abandoned: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  expired: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

interface ProductIPAssetsListProps {
  assets: ProductIPAsset[];
  productId: string;
  disabled?: boolean;
}

export function ProductIPAssetsList({ assets, productId, disabled }: ProductIPAssetsListProps) {
  const unlinkMutation = useUnlinkIPAsset();

  const handleUnlink = (assetId: string) => {
    unlinkMutation.mutate({ assetId, productId });
  };

  if (assets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
        <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No IP assets linked to this product yet</p>
        <p className="text-xs mt-1">Add patents, trademarks, or trade secrets below</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assets.map((asset) => {
        const Icon = TYPE_ICONS[asset.ip_type] || FileText;
        const statusColor = STATUS_COLORS[asset.status || 'idea'] || STATUS_COLORS.idea;

        return (
          <div
            key={asset.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-2 rounded-md bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{asset.title}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {asset.ip_type?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {asset.internal_reference && (
                    <span className="text-xs text-muted-foreground">
                      Ref: {asset.internal_reference}
                    </span>
                  )}
                  <Badge className={cn('text-xs', statusColor)}>
                    {asset.status?.replace('_', ' ') || 'Idea'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!disabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleUnlink(asset.id)}
                  disabled={unlinkMutation.isPending}
                >
                  {unlinkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
