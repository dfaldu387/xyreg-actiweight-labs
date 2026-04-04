import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductRelationshipArchitectureMapper } from '@/components/commercial/ProductRelationshipArchitectureMapper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProductBundleRelationshipMapperProps {
  productId: string;
  companyId: string;
  companyName: string;
}

export function ProductBundleRelationshipMapper({
  productId,
  companyId,
  companyName
}: ProductBundleRelationshipMapperProps) {
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  // Fetch all products for the company
  const { data: allProducts, isLoading } = useQuery({
    queryKey: ['company-products', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId
  });

  // Fetch relationships for this product to show related products
  const { data: relationships } = useQuery({
    queryKey: ['product-relationships', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_accessory_relationships')
        .select('*')
        .or(`main_product_id.eq.${productId},accessory_product_id.eq.${productId}`);
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId
  });

  // Filter products to include current product and related products
  useEffect(() => {
    if (allProducts && relationships) {
      const relatedProductIds = new Set<string>();
      relatedProductIds.add(productId);
      
      relationships.forEach(rel => {
        relatedProductIds.add(rel.main_product_id);
        relatedProductIds.add(rel.accessory_product_id);
      });

      const filtered = allProducts.filter(p => relatedProductIds.has(p.id));
      setFilteredProducts(filtered);
    } else if (allProducts) {
      // If no relationships yet, just show current product
      const currentProduct = allProducts.find(p => p.id === productId);
      setFilteredProducts(currentProduct ? [currentProduct] : []);
    }
  }, [allProducts, relationships, productId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Use the visual mapper below to define relationships between products. 
          Drag products from the left panel onto the canvas, then connect them to create 
          accessories, consumables, or bundle item relationships. All products in the company 
          are available in the left panel.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Product Relationship Architecture</CardTitle>
          <CardDescription>
            Define how products relate to each other in this bundle. 
            The architecture mapper shows all company products - select and connect the ones relevant to this bundle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductRelationshipArchitectureMapper
            companyId={companyId}
            products={allProducts || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
