import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditRequirementForm } from "./EditRequirementForm";
import type { RequirementSpecification, UpdateRequirementSpecificationData } from "./types";

interface EditRequirementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: RequirementSpecification | null;
  onSave: (id: string, updates: UpdateRequirementSpecificationData) => Promise<void>;
  isLoading?: boolean;
  productId: string;
  companyId: string;
  productName?: string;
}

export function EditRequirementDialog({
  open,
  onOpenChange,
  requirement,
  onSave,
  isLoading = false,
  productId,
  companyId,
  productName
}: EditRequirementDialogProps) {
  if (!requirement) return null;

  const handleSave = async (updates: UpdateRequirementSpecificationData) => {
    await onSave(requirement.id, updates);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Requirement: {requirement.requirement_id}</DialogTitle>
        </DialogHeader>
        <EditRequirementForm
          requirement={requirement}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={isLoading}
          productId={productId}
          companyId={companyId}
          productName={productName}
        />
      </DialogContent>
    </Dialog>
  );
}
