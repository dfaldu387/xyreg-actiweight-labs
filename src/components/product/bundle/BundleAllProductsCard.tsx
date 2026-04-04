import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Package, Eye, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Product {
  id: string;
  name: string;
  trade_name?: string;
  description?: string;
  basic_udi_di?: string;
  image?: string;
  images?: string[];
}

interface BundleAllProductsCardProps {
  companyId: string;
  currentProductId: string;
  selectedProductIds: string[];
  onAddProducts: (products: Product[]) => void;
  onRemoveProduct?: (productId: string) => void;
  isNewBundle?: boolean;
}

export function BundleAllProductsCard({
  companyId,
  currentProductId,
  selectedProductIds,
  onAddProducts,
  onRemoveProduct,
  isNewBundle = false,
}: BundleAllProductsCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch ALL products from the company
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['all-products-for-bundle', companyId, currentProductId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name, trade_name, description, basic_udi_di, image, images')
        .eq('company_id', companyId)
        .eq('is_archived', false);
      
      // Only exclude currentProductId if it's a valid non-empty string
      if (currentProductId && currentProductId.trim() !== '') {
        query = query.neq('id', currentProductId);
      }
      
      const { data, error } = await query.order('name');

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!companyId,
  });

  // Filter products based on search only - keep all products visible
  const filteredProducts = useMemo(() => {
    let filteredList = products;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredList = filteredList.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.trade_name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.basic_udi_di?.toLowerCase().includes(term)
      );
    }
    
    return filteredList;
  }, [products, searchTerm]);

  const handleToggleSelection = (productId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSelectAll = () => {
    const availableIds = filteredProducts
      .filter(p => !selectedProductIds.includes(p.id))
      .map(p => p.id);
    setSelectedIds(availableIds);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleAddSelected = () => {
    const productsToAdd = products.filter(p => selectedIds.includes(p.id));
    onAddProducts(productsToAdd);
    setSelectedIds([]);
  };

  const selectedCount = selectedIds.length;
  const hasSelection = selectedCount > 0;
  const productCount = products.length;

  return (
    <Card className="border-2 border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <CardTitle>All Devices</CardTitle>
          <Badge variant="secondary">{productCount} devices</Badge>
        </div>
        <CardDescription>
          All devices from your company. Select devices to include in this bundle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, description, or Basic UDI-DI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Action Buttons */}
        {hasSelection && (
          <div className="flex items-center justify-between gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="text-sm font-medium">
              {selectedCount} {selectedCount === 1 ? 'device' : 'devices'} selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                onClick={handleAddSelected}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add to Bundle
              </Button>
            </div>
          </div>
        )}

        {/* Info text */}
        <div className="text-sm text-muted-foreground">
          {hasSelection 
            ? 'Click "Add to Bundle" to confirm your selection' 
            : 'Check devices to select them, then click "Add to Bundle"'}
        </div>

        {/* Products List */}
        <div className="border rounded-lg max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              {searchTerm ? 'No devices match your search' : 'No devices available'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredProducts.map((product) => {
                const isAlreadyAdded = selectedProductIds.includes(product.id);
                const isSelected = selectedIds.includes(product.id);
                
                return (
                  <div
                    key={product.id}
                    onClick={() => !isAlreadyAdded && handleToggleSelection(product.id)}
                    className={`flex items-start gap-3 p-3 transition-colors ${
                      isAlreadyAdded 
                        ? 'opacity-50 bg-muted/50 cursor-not-allowed' 
                        : isSelected
                        ? 'bg-primary/10 border-l-4 border-l-primary cursor-pointer hover:bg-primary/15'
                        : 'hover:bg-accent cursor-pointer'
                    }`}
                  >
                    <Checkbox
                      checked={isAlreadyAdded || isSelected}
                      disabled={isAlreadyAdded}
                      onCheckedChange={() => !isAlreadyAdded && handleToggleSelection(product.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm">
                          {product.trade_name || product.name}
                          {product.trade_name && (
                            <span className="text-xs text-muted-foreground ml-1">({product.name})</span>
                          )}
                        </div>
                        {isAlreadyAdded && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            In Bundle
                          </Badge>
                        )}
                      </div>
                      {product.basic_udi_di && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Basic UDI-DI: {product.basic_udi_di}
                        </div>
                      )}
                      {product.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
