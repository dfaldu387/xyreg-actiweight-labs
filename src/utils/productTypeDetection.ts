
import { Product } from '@/types/client';

export type ProductType = 'new_Device' | 'existing_Device' | 'line_extension' | 'legacy_Device' | 'new_product' | 'existing_product' | 'legacy_product';
export type ProductTypeFilter = 'all' | 'new_product' | 'existing_product' | 'line_extension' | 'legacy_product';

export function detectProductType(product: Product | any): ProductType {
  // Add null/undefined checks to prevent errors
  if (!product) {
    console.warn('[detectProductType] Product is null or undefined');
    return 'new_Device';
  }

  // console.log('[detectProductType] Analyzing product:', {
  //   name: product.name,
  //   is_line_extension: product.is_line_extension,
  //   parent_product_id: product.parent_product_id,
  //   project_types: product.project_types,
  //   project_types_type: typeof product.project_types,
  //   project_types_array: Array.isArray(product.project_types)
  // });

  // Check if it's explicitly marked as a line extension
  if (product.is_line_extension === true) {
    // console.log('[detectProductType] Detected as line_extension (explicit flag)');
    return 'line_extension';
  }

  // Check project types array first - this is the most reliable indicator
  if (product.project_types && Array.isArray(product.project_types) && product.project_types.length > 0) {
    // console.log('[detectProductType] Checking project types array:', product.project_types);
    
    // Check for legacy product first (most specific)
    const hasLegacyProductTypes = product.project_types.some(type => {
      if (typeof type !== 'string') return false;
      const lowerType = type.toLowerCase();
      const isLegacyProduct = lowerType.includes('legacy product');
      // console.log('[detectProductType] Checking for legacy product:', type, '→', isLegacyProduct);
      return isLegacyProduct;
    });
    
    if (hasLegacyProductTypes) {
      // console.log('[detectProductType] Detected as legacy_product (project types)');
      return 'legacy_Device';
    }
    
    // Check for line extension project types next (most specific after legacy)
    const hasLineExtensionTypes = product.project_types.some(type => {
      if (typeof type !== 'string') return false;
      const lowerType = type.toLowerCase();
      const isLineExtension = lowerType.includes('line extension');
      // console.log('[detectProductType] Checking for line extension:', type, '→', isLineExtension);
      return isLineExtension;
    });
    
    if (hasLineExtensionTypes) {
      // console.log('[detectProductType] Detected as line_extension (project types)');
      return 'line_extension';
    }

    // Check for new product types (highest priority for new products)
    const hasNewProductTypes = product.project_types.some(type => {
      if (typeof type !== 'string') return false;
      const lowerType = type.toLowerCase();
      const isNewProduct = lowerType.includes('new product development') || 
                          lowerType.includes('npd') ||
                          lowerType.includes('technology development') ||
                          lowerType.includes('feasibility study') ||
                          (lowerType.includes('new product') && !lowerType.includes('line extension'));
      // console.log('[detectProductType] Checking for new product:', type, '→', isNewProduct);
      return isNewProduct;
    });
    
    if (hasNewProductTypes) {
      // console.log('[detectProductType] Detected as new_Device (project types)');
      return 'new_Device';
    }

    // Check for existing product types with flexible matching
    const hasExistingProductTypes = product.project_types.some(type => {
      if (typeof type !== 'string') return false;
      const lowerType = type.toLowerCase();
      const isExistingProduct = lowerType.includes('Device improvement') ||
                               lowerType.includes('feature enhancement') ||
                               lowerType.includes('component or material change') ||
                               lowerType.includes('labeling or packaging change') ||
                               lowerType.includes('software update') ||
                               lowerType.includes('patch release') ||
                               lowerType.includes('cybersecurity enhancement') ||
                               lowerType.includes('capa implementation') ||
                               lowerType.includes('compliance remediation') ||
                               lowerType.includes('recertification') ||
                               lowerType.includes('regulatory submission') ||
                               lowerType.includes('manufacturing process change') ||
                               lowerType.includes('production site transfer') ||
                               (lowerType.includes('improvement') && !lowerType.includes('new Device')) ||
                               (lowerType.includes('enhancement') && !lowerType.includes('new Device')) ||
                               (lowerType.includes('change') && !lowerType.includes('new Device')) ||
                               (lowerType.includes('update') && !lowerType.includes('new Device'));
      // console.log('[detectProductType] Checking for product upgrade:', type, '→', isExistingProduct);
      return isExistingProduct;
    });
    
    if (hasExistingProductTypes) {
      // console.log('[detectProductType] Detected as existing_product (project types)');
      return 'existing_Device';
    }
  }

  // Only use parent product as secondary indicator when project types are ambiguous
  // This handles cases where a product has a parent but unclear project types
  if (product.parent_product_id) {
    // console.log('[detectProductType] Has parent but ambiguous project types, defaulting to new_product');
    // Default to new_product for unclear cases rather than assuming line extension
    return 'new_Device';
  }

  // Default fallback - be more conservative and default to new_product for unknown cases
  // This way new products without explicit project types are correctly classified
  // console.log('[detectProductType] Using default: new_product');
  return 'new_Device';
}

export function getProductTypeIcon(productType: ProductType): string {
  switch (productType) {
    case 'new_Device':
      return 'Package'; // Simple box for new products
    case 'existing_Device':
      return 'PackagePlus'; // Box with plus for product upgrades
    case 'line_extension':
      return 'GitBranch';
    case 'legacy_Device':
      return 'Archive'; // Archive icon for legacy products
    default:
      return 'Package';
  }
}

export function getProductTypeLabel(productType: ProductType): string {
  switch (productType) {
    case 'new_Device':
      return 'New Device';
    case 'existing_Device':
      return 'Device Upgrade';
    case 'line_extension':
      return 'Line Extension';
    case 'legacy_Device':
      return 'Legacy Device';
    default:
      return 'Device';
  }
}
