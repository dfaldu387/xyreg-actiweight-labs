import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RequirementEditForm } from "./RequirementEditForm";
import type { Database } from "@/integrations/supabase/types";

type GapTemplateItemRow = Database["public"]["Tables"]["gap_template_items"]["Row"];

interface RequirementEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: GapTemplateItemRow | null;
  onSave: (updates: Partial<GapTemplateItemRow>) => Promise<void>;
  isLoading?: boolean;
}

export function RequirementEditDialog({
  open,
  onOpenChange,
  requirement,
  onSave,
  isLoading = false
}: RequirementEditDialogProps) {
  if (!requirement) return null;

  const handleSave = async (updates: Partial<GapTemplateItemRow>) => {
    await onSave(updates);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Requirement: {requirement.item_number}</DialogTitle>
        </DialogHeader>
        <RequirementEditForm
          requirement={requirement}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}