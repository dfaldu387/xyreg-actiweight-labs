import React, { useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ComprehensiveHazardForm } from "./ComprehensiveHazardForm";
import { Hazard, CreateHazardInput } from "./types";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";
import { hazardProductScopeService } from "@/services/hazardProductScopeService";

interface EditHazardDialogProps {
  hazard: Hazard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditHazard: (id: string, input: CreateHazardInput, requirementIds: string[]) => void;
  onDeleteHazard?: (hazard: Hazard) => void;
  isLoading?: boolean;
  productId: string;
  companyId?: string;
}

export function EditHazardDialog({
  hazard,
  open,
  onOpenChange,
  onEditHazard,
  onDeleteHazard,
  isLoading,
  productId,
  companyId,
}: EditHazardDialogProps) {
  const { lang } = useTranslation();
  const {
    data: requirements = [],
    isLoading: requirementsLoading,
  } = useQuery({
    queryKey: ["requirement-specifications", productId],
    queryFn: () => requirementSpecificationsService.getByProductId(productId),
    enabled: open && !!productId,
  });

  // Load existing product scope for this hazard
  const { data: existingScope } = useQuery({
    queryKey: ["hazard-product-scope", hazard?.id],
    queryFn: async () => {
      const rows = await hazardProductScopeService.getScopeByHazardId(hazard!.id);
      return {
        categoryNames: rows.filter(r => r.scope_type === "category").map(r => r.category_name!),
        productIds: rows.filter(r => r.scope_type === "device").map(r => r.product_id!),
      };
    },
    enabled: open && !!hazard?.id,
  });

  // Merge scope into initialData
  const initialDataWithScope = useMemo(() => {
    if (!hazard) return undefined;
    return {
      ...hazard,
      productScope: existingScope || { categoryNames: [], productIds: [productId] },
    };
  }, [hazard, existingScope, productId]);

  const handleSubmit = (input: CreateHazardInput, requirementIds: string[]) => {
    if (hazard) {
      onEditHazard(hazard.id, input, requirementIds);
    }
  };

  const handleDelete = () => {
    if (hazard && onDeleteHazard) {
      onOpenChange(false);
      onDeleteHazard(hazard);
    }
  };

  // Detect if this is a draft hazard linked from a requirement
  const aiFillContext = useMemo(() => {
    if (!hazard || !companyId) return undefined;
    
    // For draft hazards linked from a requirement, use the linked requirement's description
    const draftMatch = hazard.description?.match(/^Draft - linked from (.+)$/);
    if (draftMatch) {
      const linkedReqId = draftMatch[1];
      const linkedReq = requirements.find(r => r.requirement_id === linkedReqId);
      if (linkedReq) {
        return {
          companyId,
          productId,
          requirementDescription: linkedReq.description,
          requirementId: linkedReq.requirement_id,
          requirementCategory: linkedReq.category,
        };
      }
    }
    
    // For all other hazards, provide context from the hazard itself
    return {
      companyId,
      productId,
      requirementDescription: hazard.description || '',
      requirementId: hazard.hazard_id,
      requirementCategory: hazard.category,
      existingHazardData: {
        hazardous_situation: hazard.hazardous_situation,
        potential_harm: hazard.potential_harm,
        foreseeable_sequence_events: hazard.foreseeable_sequence_events,
      },
    };
  }, [hazard, companyId, productId, requirements]);

  if (!hazard) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang('riskManagement.dialog.edit.title')} - {hazard.hazard_id}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {lang('riskManagement.dialog.edit.description')}
          </p>
        </DialogHeader>
        <ComprehensiveHazardForm
          requirements={requirements}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading || requirementsLoading}
          initialData={initialDataWithScope}
          aiFillContext={aiFillContext}
          companyId={companyId}
          productId={productId}
          deleteButton={onDeleteHazard ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {lang('riskManagement.dialog.delete.title')}
            </Button>
          ) : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}