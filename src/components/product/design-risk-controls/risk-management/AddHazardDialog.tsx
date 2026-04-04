import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComprehensiveHazardForm } from "./ComprehensiveHazardForm";
import { CreateHazardInput } from "./types";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";

interface AddHazardDialogProps {
  onAddHazard: (input: CreateHazardInput, requirementIds: string[]) => void;
  isLoading?: boolean;
  productId: string;
  companyId?: string;
  disabled?: boolean;
  customTrigger?: React.ReactNode;
}

export function AddHazardDialog({ onAddHazard, isLoading, productId, companyId, disabled = false, customTrigger }: AddHazardDialogProps) {
  const { lang } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled && newOpen) return;
    setOpen(newOpen);
  };

  const {
    data: requirements = [],
    isLoading: requirementsLoading,
  } = useQuery({
    queryKey: ["requirement-specifications", productId],
    queryFn: () => requirementSpecificationsService.getByProductId(productId),
    enabled: open && !!productId,
  });

  const handleSubmit = (input: CreateHazardInput, requirementIds: string[]) => {
    onAddHazard(input, requirementIds);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {customTrigger || (
          <Button disabled={disabled}>
            <Plus className="h-4 w-4 mr-2" />
            {lang('riskManagement.newHazard')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang('riskManagement.dialog.add.title')}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {lang('riskManagement.dialog.add.description')}
          </p>
        </DialogHeader>
        <ComprehensiveHazardForm
          requirements={requirements}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          isLoading={isLoading || requirementsLoading}
          companyId={companyId}
          productId={productId}
        />
      </DialogContent>
    </Dialog>
  );
}