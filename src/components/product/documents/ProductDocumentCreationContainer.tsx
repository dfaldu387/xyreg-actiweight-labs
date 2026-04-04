
import React, { useState } from 'react';
import { ProductDocumentCreationDialog } from './ProductDocumentCreationDialog';

interface ProductDocumentCreationContainerProps {
  productId: string;
  companyId: string;
  onDocumentCreated: (metadata?: any) => Promise<{ success: boolean; instances: any }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDocumentCreationContainer({
  productId,
  companyId,
  onDocumentCreated,
  open,
  onOpenChange
}: ProductDocumentCreationContainerProps) {

  // Handle document creation with proper return type handling
  const handleDocumentCreated = async (documentId: string, metadata?: any) => {
    console.log("Document created with ID:", documentId);
    const result = await onDocumentCreated({ documentId, ...metadata });
    console.log("Refresh result:", result);
  };

  return (
    <ProductDocumentCreationDialog
      open={open}
      onOpenChange={onOpenChange}
      productId={productId}
      companyId={companyId}
      onDocumentCreated={handleDocumentCreated}
    />
  );
}
