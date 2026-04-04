import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Package, ChevronDown, Loader2 } from 'lucide-react';
import { useCompanyProductSelection } from '@/hooks/useCompanyProductSelection';
import { ProductForSelection } from '@/types/project';
import { cn } from '@/lib/utils';

interface BaseProductSelectorProps {
  companyId: string;
  selectedProductId?: string;
  onProductSelect: (productId: string) => void;
  className?: string;
}

function pickPrimaryDevice(group: ProductForSelection[]): ProductForSelection {
  if (group.length === 1) return group[0];

  return [...group].sort((a, b) => {
    if (a.udi_di && b.udi_di) {
      const aSuffix = a.udi_di.replace(/\D/g, '').slice(-6);
      const bSuffix = b.udi_di.replace(/\D/g, '').slice(-6);
      if (aSuffix && bSuffix && aSuffix !== bSuffix) {
        return aSuffix.localeCompare(bSuffix);
      }
    }

    if (a.inserted_at && b.inserted_at) {
      return new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime();
    }

    return (a.name || '').localeCompare(b.name || '');
  })[0];
}

export function BaseProductSelector({
  companyId,
  selectedProductId,
  onProductSelect,
  className
}: BaseProductSelectorProps) {
  const { products, isLoading, error } = useCompanyProductSelection(companyId);
  const [open, setOpen] = React.useState(false);

  const baseProducts = React.useMemo(() => {
    if (!Array.isArray(products)) return [];

    const roots = products.filter((product) => !product.parent_product_id);
    const groups = new Map<string, ProductForSelection[]>();

    roots.forEach((product) => {
      const key = product.basic_udi_di || `standalone-${product.id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(product);
    });

    const primaryDevices: ProductForSelection[] = [];
    groups.forEach((group) => {
      // Prefer explicit primary device designation
      const primaryDevice = group.find((p: any) => p.is_master_device === true);
      primaryDevices.push(primaryDevice || pickPrimaryDevice(group));
    });

    return primaryDevices.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [products]);

  const selectedProduct = baseProducts.find((p) => p.id === selectedProductId);

  const handleProductSelect = React.useCallback((product: ProductForSelection) => {
    onProductSelect(product.id);
    // Radix will close the menu automatically via onSelect
  }, [onProductSelect]);

  if (error) {
    return (
      <Button variant="outline" disabled className={className}>
        <Package className="mr-2 h-4 w-4" />
        Error loading devices
      </Button>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            className={cn('min-w-[200px] justify-between', className)}
          >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : selectedProduct ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">{selectedProduct.name}</span>
                <Badge variant="secondary" className="text-xs h-5">
                  v{selectedProduct.version || '1.0'}
                </Badge>
              </div>
            ) : (
              <span className="text-sm">Select Base Device</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="min-w-[256px] max-h-[300px] overflow-auto z-[10000]" 
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel className="px-2 py-1.5 font-semibold">Base Devices</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {baseProducts.length === 0 ? (
          <DropdownMenuItem disabled className="py-1.5">
            <span className="text-sm text-muted-foreground">
              {Array.isArray(products) && products.length === 0
                ? 'No devices found'
                : 'No base devices found (all devices are variants)'}
            </span>
          </DropdownMenuItem>
        ) : (
          baseProducts.map((product) => (
            <DropdownMenuItem
              key={product.id}
              onSelect={(e) => {
                // Don't prevent default - let Radix handle the menu close
                handleProductSelect(product);
              }}
              className="py-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full">
                <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{product.name}</span>
                    {product.id === selectedProductId && (
                      <Badge variant="default" className="text-xs h-[18px]">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Current: v{product.version || '1.0'} • {product.status}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
