import { ProductType } from './productTypeDetection';

export interface ProductTypeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProductTypeChange(
  currentType: ProductType,
  newType: ProductType,
  projectTypes: string[],
  product: any
): ProductTypeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Ensure at least one project type is selected
  if (!projectTypes || projectTypes.length === 0) {
    errors.push('At least one project type must be selected');
  }

  // Validate line extension requirements
  if (newType === 'line_extension') {
    if (!product.product_platform && !product.parent_product_id) {
      warnings.push('Line extensions should have a product platform or parent product set');
    }
  }

  // Validate legacy product requirements
  if (newType === 'legacy_Device') {
    if (!product.eudamed_registration_number) {
      warnings.push('Legacy products typically require an EUDAMED registration number');
    }
  }

  // Warn about major type changes
  if (currentType !== newType) {
    if (currentType === 'legacy_Device' && newType !== 'legacy_Device') {
      warnings.push('Changing from Legacy Device may affect existing compliance data and registrations');
    }
    
    if (currentType === 'line_extension' && newType === 'new_Device') {
      warnings.push('Changing from Line Extension to New Product will remove platform relationships');
    }

    if (currentType === 'existing_Device' && newType === 'new_Device') {
      warnings.push('Changing to New Product will affect version history and parent relationships');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function getProductTypeFromProjectTypes(projectTypes: string[]): ProductType {
  if (!projectTypes || projectTypes.length === 0) {
    return 'new_Device';
  }

  // Check for legacy product
  if (projectTypes.some(t => t.toLowerCase().includes('legacy product'))) {
    return 'legacy_Device';
  }

  // Check for line extension
  if (projectTypes.some(t => t.toLowerCase().includes('line extension'))) {
    return 'line_extension';
  }

  // Check for new product types
  const newProductKeywords = ['new product development', 'npd', 'technology development', 'feasibility study'];
  if (projectTypes.some(t => newProductKeywords.some(k => t.toLowerCase().includes(k)))) {
    return 'new_Device';
  }

  // Check for existing product types
  const existingProductKeywords = [
    'device improvement', 'product improvement', 'feature enhancement', 'component or material change',
    'labeling or packaging change', 'software update', 'patch release',
    'cybersecurity enhancement', 'capa implementation', 'compliance remediation',
    'recertification', 'regulatory submission', 'manufacturing process change',
    'production site transfer'
  ];
  if (projectTypes.some(t => existingProductKeywords.some(k => t.toLowerCase().includes(k)))) {
    return 'existing_Device';
  }

  return 'new_Device';
}
