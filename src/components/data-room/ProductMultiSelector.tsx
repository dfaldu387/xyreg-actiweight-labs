import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Product {
  id: string;
  name: string;
}

interface ProductMultiSelectorProps {
  products: Product[];
  selectedProductIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export function ProductMultiSelector({
  products,
  selectedProductIds,
  onChange,
}: ProductMultiSelectorProps) {
  const toggleProduct = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      onChange(selectedProductIds.filter(id => id !== productId));
    } else {
      onChange([...selectedProductIds, productId]);
    }
  };

  const removeProduct = (productId: string) => {
    onChange(selectedProductIds.filter(id => id !== productId));
  };

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));

  return (
    <div className="space-y-4">
      {/* Selected Products Display */}
      {selectedProductIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map(product => (
            <Badge key={product.id} variant="secondary" className="pl-3 pr-2 py-1.5">
              {product.name}
              <button
                onClick={() => removeProduct(product.id)}
                className="ml-2 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Product Selection List */}
      <Card>
        <CardContent className="pt-6">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active products found. You can still create a data room for general documents.
            </p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {products.map(product => (
                <div key={product.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`product-${product.id}`}
                    checked={selectedProductIds.includes(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                  />
                  <Label
                    htmlFor={`product-${product.id}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {product.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {selectedProductIds.length === 0 
          ? "No products selected - you can manually upload documents only"
          : selectedProductIds.length === 1
          ? "Content will be generated from the selected product"
          : `Content will be generated from ${selectedProductIds.length} selected products`
        }
      </p>
    </div>
  );
}
