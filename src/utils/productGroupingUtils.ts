import { ProductForSelection } from '@/types/project';

export interface ProductFamily {
  basicUDI: string;
  primaryProduct: ProductForSelection;
  variants: ProductForSelection[];
}

export interface GroupedProducts {
  standaloneProducts: ProductForSelection[];
  productFamilies: Map<string, ProductFamily>;
}

/**
 * Group products by their Basic UDI-DI
 * - Products without basic_udi_di are standalone
 * - Products with the same basic_udi_di are grouped into families
 */
export function groupProductsByBasicUDI(products: ProductForSelection[]): GroupedProducts {
  const standaloneProducts: ProductForSelection[] = [];
  const familiesMap = new Map<string, ProductFamily>();

  products.forEach(product => {
    if (!product.basic_udi_di) {
      // No Basic UDI-DI = standalone product
      standaloneProducts.push(product);
    } else {
      // Group by Basic UDI-DI
      const existing = familiesMap.get(product.basic_udi_di);
      
      if (existing) {
        // Add to existing family
        existing.variants.push(product);
      } else {
        // Create new family
        familiesMap.set(product.basic_udi_di, {
          basicUDI: product.basic_udi_di,
          primaryProduct: product,
          variants: [product]
        });
      }
    }
  });

  return {
    standaloneProducts,
    productFamilies: familiesMap
  };
}

/**
 * Extract a display suffix from the full UDI-DI for variant identification
 * Shows last 8 characters or the part after the basic UDI-DI
 */
export function getVariantDisplaySuffix(product: ProductForSelection): string {
  if (!product.udi_di) return '';
  
  if (product.basic_udi_di && product.udi_di.includes(product.basic_udi_di)) {
    // Show the part after the basic UDI-DI
    const suffix = product.udi_di.replace(product.basic_udi_di, '');
    return suffix ? `(${suffix})` : '';
  }
  
  // Fallback: show last 8 characters
  const last8 = product.udi_di.slice(-8);
  return last8 ? `(...${last8})` : '';
}
