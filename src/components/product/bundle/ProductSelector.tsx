import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductGroupSelector } from './ProductGroupSelector';

type SelectionMode = 'products' | 'groups';

interface ProductSelectorProps {
  companyId: string;
  currentProductId: string;
  selectedProductIds: string[];
  selectedGroupIds: string[];
  onAddProduct: (product: any) => void;
  onAddVariantGroup: (group: any) => void;
}

export function ProductSelector({
  companyId,
  currentProductId,
  selectedProductIds,
  selectedGroupIds,
  onAddProduct,
  onAddVariantGroup
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('products');

  // Fetch all company products
  const { data: products, isLoading } = useQuery({
    queryKey: ['company-products', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!companyId
  });

  // Filter products
  const availableProducts = products?.filter(product => {
    // Exclude current product
    if (product.id === currentProductId) return false;
    
    // Exclude already selected products
    if (selectedProductIds.includes(product.id)) return false;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={selectionMode === 'products' ? 'default' : 'outline'}
          onClick={() => setSelectionMode('products')}
          className="flex-1"
        >
          Individual Products
        </Button>
        <Button
          variant={selectionMode === 'groups' ? 'default' : 'outline'}
          onClick={() => setSelectionMode('groups')}
          className="flex-1"
        >
          Variant Groups
        </Button>
      </div>

      {selectionMode === 'products' ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-4 space-y-2">
              {availableProducts && availableProducts.length > 0 ? (
                availableProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {product.description}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onAddProduct(product)}
                      className="ml-4"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {searchQuery
                    ? 'No products found matching your search'
                    : 'All products have been added to the bundle'}
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <ProductGroupSelector
          companyId={companyId}
          currentProductId={currentProductId}
          selectedGroupIds={selectedGroupIds}
          onAddGroup={onAddVariantGroup}
        />
      )}

    </div>
  );
}
