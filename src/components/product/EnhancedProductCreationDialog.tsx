import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProductCreationForm } from "./creation/ProductCreationForm";
import { useTranslation } from "@/hooks/useTranslation";

interface EnhancedProductCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onProductCreated: (productId: string, projectId?: string) => void;
}

export function EnhancedProductCreationDialog({
  open,
  onOpenChange,
  companyId,
  onProductCreated
}: EnhancedProductCreationDialogProps) {
  const { lang } = useTranslation();

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleProductCreated = (productId: string, projectId?: string) => {
    onProductCreated(productId, projectId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto z-[9990]"
      >
        <DialogHeader>
          <DialogTitle>{lang('productCreation.title')}</DialogTitle>
          <DialogDescription>
            {lang('productCreation.description')}
          </DialogDescription>
        </DialogHeader>

        <ProductCreationForm
          companyId={companyId}
          onProductCreated={handleProductCreated}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
