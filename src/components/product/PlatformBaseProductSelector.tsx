
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlatformBaseProductSelectorProps {
  companyId: string;
  platform: string;
  selectedProductId?: string;
  onProductSelect: (productId: string) => void;
  className?: string;
}

interface PlatformProduct {
  id: string;
  name: string;
  version?: string;
  status: string;
}

export function PlatformBaseProductSelector({
  companyId,
  platform,
  selectedProductId,
  onProductSelect,
  className
}: PlatformBaseProductSelectorProps) {
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['platform-products', companyId, platform],
    queryFn: async (): Promise<PlatformProduct[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, version, status')
        .eq('company_id', companyId)
        .eq('product_platform', platform)
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;

      return data.map(product => ({
        id: product.id,
        name: product.name,
        version: product.version || '1.0',
        status: product.status || 'On Track'
      }));
    },
    enabled: !!companyId && !!platform
  });

  const selectedProduct = products.find(p => p.id === selectedProductId);

  if (error) {
    return (
      <Button variant="outline" disabled className={className}>
        <Package className="h-4 w-4 mr-2" />
        Error loading products
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className} disabled={isLoading}>
          <Package className="h-4 w-4 mr-2" />
          {isLoading ? (
            'Loading...'
          ) : selectedProduct ? (
            <>
              {selectedProduct.name}
              <Badge variant="secondary" className="ml-2">
                v{selectedProduct.version}
              </Badge>
            </>
          ) : (
            'Select Base Product'
          )}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Products in {platform}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {products.length === 0 ? (
          <DropdownMenuItem disabled>
            No products found in this platform
          </DropdownMenuItem>
        ) : (
          products.map((product) => (
            <DropdownMenuItem
              key={product.id}
              onClick={() => onProductSelect(product.id)}
              className="flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium">{product.name}</span>
                <span className="text-xs text-muted-foreground">
                  v{product.version} • {product.status}
                </span>
              </div>
              {product.id === selectedProductId && (
                <Badge variant="secondary" className="text-xs">Selected</Badge>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
