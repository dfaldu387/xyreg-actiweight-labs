
/**
 * Centralized utility for consistent document type detection
 */

export type DocumentType = 'product-specific' | 'template-instance' | 'company-template';

export interface DocumentTypeInfo {
  type: DocumentType;
  isValid: boolean;
  reason?: string;
}

/**
 * Determine document type based on document properties
 */
export function getDocumentType(document: any): DocumentTypeInfo {
  console.log("DocumentTypeUtils: Analyzing document:", {
    id: document.id,
    name: document.name,
    template_source_id: document.template_source_id,
    document_scope: document.document_scope,
    product_id: document.product_id
  });

  // Company templates
  if (document.document_scope === 'company_template') {
    return {
      type: 'company-template',
      isValid: true
    };
  }

  // Product documents
  if (document.document_scope === 'product_document') {
    if (document.template_source_id) {
      // Template instance
      return {
        type: 'template-instance',
        isValid: !!document.product_id,
        reason: document.product_id ? undefined : 'Missing product_id'
      };
    } else {
      // Product-specific document
      return {
        type: 'product-specific',
        isValid: !!document.product_id,
        reason: document.product_id ? undefined : 'Missing product_id'
      };
    }
  }

  // Unknown or invalid document type
  return {
    type: 'product-specific', // Default fallback
    isValid: false,
    reason: `Unknown document_scope: ${document.document_scope}`
  };
}

/**
 * Check if document is a template instance
 */
export function isTemplateInstance(document: any): boolean {
  const typeInfo = getDocumentType(document);
  return typeInfo.type === 'template-instance' && typeInfo.isValid;
}

/**
 * Check if document is product-specific
 */
export function isProductSpecific(document: any): boolean {
  const typeInfo = getDocumentType(document);
  return typeInfo.type === 'product-specific' && typeInfo.isValid;
}

/**
 * Check if document is a company template
 */
export function isCompanyTemplate(document: any): boolean {
  const typeInfo = getDocumentType(document);
  return typeInfo.type === 'company-template' && typeInfo.isValid;
}

/**
 * Validate document type for specific product and tab context
 */
export function validateDocumentForContext(
  document: any, 
  expectedType: DocumentType, 
  productId?: string
): { isValid: boolean; error?: string } {
  const typeInfo = getDocumentType(document);
  
  if (!typeInfo.isValid) {
    return {
      isValid: false,
      error: typeInfo.reason || 'Invalid document structure'
    };
  }

  if (typeInfo.type !== expectedType) {
    return {
      isValid: false,
      error: `Expected ${expectedType} but got ${typeInfo.type}`
    };
  }

  // Additional validation for product-scoped documents
  if ((expectedType === 'template-instance' || expectedType === 'product-specific') && productId) {
    if (document.product_id !== productId) {
      return {
        isValid: false,
        error: `Document belongs to different product: ${document.product_id} vs ${productId}`
      };
    }
  }

  return { isValid: true };
}
