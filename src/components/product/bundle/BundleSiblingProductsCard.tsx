import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Layers, Search, Plus, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Product {
  id: string;
  name: string;
  description?: string;
  basic_udi_di?: string;
}

interface BundleSiblingProductsCardProps {
  companyId: string;
  currentProductId: string;
  selectedProductIds: string[];
  onAddProducts: (products: Product[]) => void;
}

export function BundleSiblingProductsCard({
  companyId,
  currentProductId,
  selectedProductIds,
  onAddProducts,
}: BundleSiblingProductsCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch the current product's Basic UDI-DI
  const { data: currentProduct } = useQuery({
    queryKey: ['product-basic-udi', currentProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, basic_udi_di')
        .eq('id', currentProductId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentProductId,
  });

  // Fetch sibling products (same Basic UDI-DI)
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['sibling-products-for-bundle', companyId, currentProduct?.basic_udi_di],
    queryFn: async () => {
      if (!currentProduct?.basic_udi_di) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, basic_udi_di')
        .eq('company_id', companyId)
        .eq('basic_udi_di', currentProduct.basic_udi_di)
        .neq('id', currentProductId)
        .order('name');

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!companyId && !!currentProduct?.basic_udi_di,
  });

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const handleToggleProduct = (productId: string) => {
    setSelectedIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
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
          <CardTitle>Sibling Products (Same Device Family)</CardTitle>
          <Badge variant="secondary">{productCount} products</Badge>
        </div>
        <CardDescription>
          Basic UDI-DI: {currentProduct?.basic_udi_di || 'Loading...'}
          <br />
          Different sizes/configurations of the same device. Select products below to create distribution groups.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Selection Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={filteredProducts.filter(p => !selectedProductIds.includes(p.id)).length === 0}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
              disabled={!hasSelection}
            >
              Clear
            </Button>
          </div>
          <Button
            onClick={handleAddSelected}
            disabled={!hasSelection}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Selected ({selectedCount})
          </Button>
        </div>

        {/* Products List */}
        <div className="border rounded-lg max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              {searchTerm ? 'No products match your search' : 'No products available'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredProducts.map((product) => {
                const isAlreadyAdded = selectedProductIds.includes(product.id);
                const isSelected = selectedIds.includes(product.id);

                return (
                  <div
                    key={product.id}
                    className={`flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors ${
                      isAlreadyAdded ? 'opacity-50 bg-muted/50' : ''
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isAlreadyAdded}
                      onCheckedChange={() => handleToggleProduct(product.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {product.name}
                        {isAlreadyAdded && (
                          <span className="ml-2 text-xs text-muted-foreground">(Already added)</span>
                        )}
                      </div>
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
