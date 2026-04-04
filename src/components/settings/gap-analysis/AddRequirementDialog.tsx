import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddRequirementForm } from "./AddRequirementForm";
import type { Database } from "@/integrations/supabase/types";

type GapTemplateItemInsert = Database["public"]["Tables"]["gap_template_items"]["Insert"];

interface AddRequirementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  onSave: (requirement: Omit<GapTemplateItemInsert, 'template_id'>) => Promise<void>;
  isLoading?: boolean;
  nextSortOrder?: number;
}

export function AddRequirementDialog({
  open,
  onOpenChange,
  templateId,
  onSave,
  isLoading = false,
  nextSortOrder = 0
}: AddRequirementDialogProps) {
  const handleSave = async (requirement: Omit<GapTemplateItemInsert, 'template_id'>) => {
    await onSave(requirement);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Requirement</DialogTitle>
        </DialogHeader>
        <AddRequirementForm
          templateId={templateId}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={isLoading}
          nextSortOrder={nextSortOrder}
        />
      </DialogContent>
    </Dialog>
  );
}