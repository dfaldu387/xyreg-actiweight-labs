
import React from "react";
import { EnhancedProductCreationDialog } from "./EnhancedProductCreationDialog";

interface AddProductDialogProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded?: (productId: string) => void;
}

export function AddProductDialog({ companyId, open, onOpenChange, onProductAdded }: AddProductDialogProps) {
  const handleProductCreated = (productId: string, projectId?: string) => {
    onProductAdded?.(productId);
    onOpenChange(false);
  };

  return (
    <EnhancedProductCreationDialog
      open={open}
      onOpenChange={onOpenChange}
      companyId={companyId}
      onProductCreated={handleProductCreated}
    />
  );
}
