
import { useState, useMemo } from "react";
import { Product } from "@/types/client";
import { detectProductType, ProductType } from "@/utils/productTypeDetection";

export type ProductTypeFilter = 'all' | 'new_product' | 'existing_product' | 'line_extension' | 'legacy_product';

export function useProductTypeFilter(products: Product[]) {
  const [selectedFilter, setSelectedFilter] = useState<ProductTypeFilter>('all');

  // Calculate product counts by type
  const productCounts = useMemo(() => {
    const counts = {
      all: products.length,
      new_product: 0,
      existing_product: 0,
      line_extension: 0,
      legacy_product: 0
    };

    products.forEach(product => {
      const productType = detectProductType(product);
      counts[productType]++;
    });

    return counts;
  }, [products]);

  // Filter products based on selected filter
  const filteredProducts = useMemo(() => {
    if (selectedFilter === 'all') {
      return products;
    }

    return products.filter(product => {
      const productType = detectProductType(product);
      return productType === selectedFilter;
    });
  }, [products, selectedFilter]);

  return {
    selectedFilter,
    setSelectedFilter,
    productCounts,
    filteredProducts
  };
}
