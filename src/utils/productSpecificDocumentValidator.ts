
/**
 * Enhanced validation utilities for Product-Specific Documents
 * Ensures strict separation between template instances and truly custom documents
 */

export interface DocumentValidationResult {
  isValid: boolean;
  isProductSpecific: boolean;
  isTemplateInstance: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Comprehensive validation for product-specific documents
 * Implements multiple layers of checks to prevent template contamination
 */
export function validateProductSpecificDocument(document: any, productId?: string): DocumentValidationResult {
  const result: DocumentValidationResult = {
    isValid: false,
    isProductSpecific: false,
    isTemplateInstance: false,
    warnings: [],
    errors: []
  };

  // Basic document structure validation
  if (!document || !document.id) {
    result.errors.push('Document is missing required fields');
    return result;
  }

  // CRITICAL CHECK 1: Template source detection
  if (document.template_source_id) {
    result.isTemplateInstance = true;
    result.errors.push(`Document "${document.name}" has template_source_id: ${document.template_source_id}`);
  }

  // CRITICAL CHECK 2: Document scope validation
  if (document.document_scope && document.document_scope !== 'product_document') {
    result.errors.push(`Document "${document.name}" has invalid scope: ${document.document_scope}`);
  }

  // CRITICAL CHECK 3: Product ownership validation
  if (productId && document.product_id !== productId) {
    result.errors.push(`Document "${document.name}" belongs to different product: ${document.product_id} vs ${productId}`);
  }

  // ENHANCED CHECK 4: Template indicator detection in names/descriptions
  const templateIndicators = [
    'Auto-created',
    'from template',
    'template instance',
    'automatically generated',
    'inherited from'
  ];

  const hasTemplateIndicators = templateIndicators.some(indicator => 
    document.name?.toLowerCase().includes(indicator.toLowerCase()) ||
    document.description?.toLowerCase().includes(indicator.toLowerCase())
  );

  if (hasTemplateIndicators) {
    result.isTemplateInstance = true;
    result.errors.push(`Document "${document.name}" contains template indicators in name/description`);
  }

  // ENHANCED CHECK 5: Template metadata detection
  const templateMetadataFields = [
    'template_name',
    'source_template_id',
    'is_template_instance',
    'template_version',
    'inherited_from'
  ];

  const hasTemplateMetadata = templateMetadataFields.some(field => document[field]);
  if (hasTemplateMetadata) {
    result.isTemplateInstance = true;
    result.errors.push(`Document "${document.name}" contains template metadata`);
  }

  // Determine if document is genuinely product-specific
  result.isProductSpecific = !result.isTemplateInstance && 
                            (document.document_scope === 'product_document' || !document.document_scope) &&
                            (!productId || document.product_id === productId);

  // Overall validation result
  result.isValid = result.isProductSpecific && result.errors.length === 0;

  // Add warnings for edge cases
  if (!document.name) {
    result.warnings.push('Document is missing a name');
  }

  if (!document.created_at) {
    result.warnings.push('Document is missing creation timestamp');
  }

  return result;
}

/**
 * Batch validation for multiple documents
 */
export function validateProductSpecificDocuments(
  documents: any[], 
  productId?: string
): {
  validDocuments: any[];
  invalidDocuments: any[];
  templateInstances: any[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    templateInstances: number;
  };
} {
  const validDocuments: any[] = [];
  const invalidDocuments: any[] = [];
  const templateInstances: any[] = [];

  documents.forEach(doc => {
    const validation = validateProductSpecificDocument(doc, productId);
    
    if (validation.isTemplateInstance) {
      templateInstances.push(doc);
    } else if (validation.isValid && validation.isProductSpecific) {
      validDocuments.push(doc);
    } else {
      invalidDocuments.push(doc);
    }
  });

  return {
    validDocuments,
    invalidDocuments,
    templateInstances,
    summary: {
      total: documents.length,
      valid: validDocuments.length,
      invalid: invalidDocuments.length,
      templateInstances: templateInstances.length
    }
  };
}

/**
 * Data cleanup utility to identify contaminated documents
 */
export function identifyContaminatedDocuments(documents: any[]): {
  contaminatedDocuments: any[];
  cleanupRecommendations: string[];
} {
  const contaminatedDocuments: any[] = [];
  const cleanupRecommendations: string[] = [];

  documents.forEach(doc => {
    const validation = validateProductSpecificDocument(doc);
    
    if (validation.isTemplateInstance || !validation.isProductSpecific) {
      contaminatedDocuments.push({
        ...doc,
        contaminationReason: validation.errors.join(', ')
      });
    }
  });

  if (contaminatedDocuments.length > 0) {
    cleanupRecommendations.push(
      `Found ${contaminatedDocuments.length} contaminated documents that should not appear in product-specific tab`
    );
    cleanupRecommendations.push(
      'Run document cleanup service to properly categorize these documents'
    );
    cleanupRecommendations.push(
      'Review document creation workflows to prevent future contamination'
    );
  }

  return {
    contaminatedDocuments,
    cleanupRecommendations
  };
}
