import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";
import { RequirementSpecification } from "@/components/product/design-risk-controls/requirement-specifications/types";
import { useTranslation } from "@/hooks/useTranslation";

interface DeleteSystemRequirementDialogProps {
  requirement: RequirementSpecification;
  trigger: React.ReactNode;
  disabled?: boolean;
}

export function DeleteSystemRequirementDialog({ requirement, trigger, disabled = false }: DeleteSystemRequirementDialogProps) {
  const { lang } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled && newOpen) return;
    setOpen(newOpen);
  };
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return requirementSpecificationsService.delete(requirement.id);
    },
    onSuccess: () => {
      toast.success(lang('systemRequirements.toast.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', requirement.product_id, 'system'] });
      queryClient.invalidateQueries({ queryKey: ['linked-reqs-for-user-needs', requirement.product_id] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(lang('systemRequirements.toast.deleteError'));
    }
  });

  const handleDelete = () => {
    if (disabled) return;
    deleteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {lang('systemRequirements.dialog.delete.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {lang('systemRequirements.dialog.delete.description').replace('{id}', requirement.requirement_id)}
          </p>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">{lang('systemRequirements.dialog.delete.requirement')}:</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {requirement.description}
            </p>
          </div>

          <p className="text-sm text-destructive">
            {lang('systemRequirements.dialog.delete.warning')}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={disabled || deleteMutation.isPending}
          >
            {lang('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={disabled || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? lang('common.deleting') : lang('systemRequirements.dialog.delete.deleteButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}