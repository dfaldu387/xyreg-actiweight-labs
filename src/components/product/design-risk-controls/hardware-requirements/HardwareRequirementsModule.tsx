import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Download, Plus, Upload } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { HardwareRequirementsAIService } from "@/services/hardwareRequirementsAIService";
import { useBaselineLockError, isBaselineLockError } from "@/hooks/useBaselineLockError";
import { BaselineLockDialog } from "@/components/change-control/BaselineLockDialog";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";
import { HardwareAISuggestionsDialog } from "./HardwareAISuggestionsDialog";
import { AddHardwareRequirementDialog } from "./AddHardwareRequirementDialog";
import { HardwareRequirementsTable } from "./HardwareRequirementsTable";
import { EditHardwareRequirementDialog } from "./EditHardwareRequirementDialog";
import { HardwareRequirementsImportDialog } from "./HardwareRequirementsImportDialog";
import { supabase } from "@/integrations/supabase/client";
import { RequirementSpecification } from "@/components/product/design-risk-controls/requirement-specifications/types";

interface HardwareRequirementsModuleProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function HardwareRequirementsModule({ productId, companyId, disabled = false }: HardwareRequirementsModuleProps) {
  const { lang } = useTranslation();
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<RequirementSpecification | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const baselineLock = useBaselineLockError();

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['requirement-specifications', productId, 'hardware'],
    queryFn: () => requirementSpecificationsService.getByProductAndType(productId, 'hardware'),
    enabled: !!productId
  });

  // Fetch valid SYSR IDs for missing link detection
  const { data: validSystemReqIds = [] } = useQuery({
    queryKey: ['valid-sysr-ids', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requirement_specifications')
        .select('requirement_id')
        .eq('product_id', productId)
        .like('requirement_id', 'SYSR%');
      if (error) throw error;
      return (data || []).map(r => r.requirement_id);
    },
    enabled: !!productId
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return requirementSpecificationsService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'hardware'] });
      toast.success('Hardware requirement updated successfully');
    },
    onError: (error) => {
      if (isBaselineLockError(error) && editingRequirement) {
        baselineLock.handleError(error, editingRequirement.id, 'hardware_requirement', editingRequirement.requirement_id || editingRequirement.id);
        return;
      }
      toast.error('Failed to update hardware requirement');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return requirementSpecificationsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'hardware'] });
      toast.success('Hardware requirement deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete hardware requirement');
    },
  });

  const handleRowClick = (requirement: RequirementSpecification) => {
    if (disabled) return;
    setEditingRequirement(requirement);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRequirement = async (id: string, data: any) => {
    if (disabled) return;
    await updateMutation.mutateAsync({ id, data });
  };

  const handleDeleteRequirement = async (id: string) => {
    if (disabled) return;
    await deleteMutation.mutateAsync(id);
  };

  // AI suggestions mutation
  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const systemRequirements: any[] = [];
      const productData = {};
      return HardwareRequirementsAIService.generateHardwareRequirements({
        companyId,
        productData,
        systemRequirements,
        selectedCategories: []
      });
    },
    onSuccess: (response) => {
      if (response.success && response.suggestions) {
        toast.success(lang('hardwareRequirements.suggestions.generateSuccess'));
      } else {
        toast.error(response.error || lang('hardwareRequirements.suggestions.generateError'));
      }
    },
    onError: (error) => {
      toast.error(lang('hardwareRequirements.suggestions.generateError'));
      console.error('AI suggestions error:', error);
    }
  });

  const handleDownloadExcel = async () => {
    if (disabled) return;
    toast.success(lang('hardwareRequirements.toast.exportComingSoon'));
  };

  const handleAISuggestions = () => {
    if (disabled) return;
    setShowAISuggestions(true);
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {lang('hardwareRequirements.title')}
              </CardTitle>
              <CardDescription>
                {lang('hardwareRequirements.description')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowImport(true)}
                disabled={disabled}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadExcel}
                disabled={disabled || requirements.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {lang('hardwareRequirements.exportExcel')}
              </Button>
              <Button
                variant="outline"
                onClick={handleAISuggestions}
                disabled={disabled || generateSuggestionsMutation.isPending}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generateSuggestionsMutation.isPending ? lang('hardwareRequirements.suggestions.generating') : lang('hardwareRequirements.aiSuggestions')}
              </Button>
              <AddHardwareRequirementDialog
                productId={productId}
                companyId={companyId}
                disabled={disabled}
                trigger={
                  <Button disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    {lang('hardwareRequirements.addRequirement')}
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{lang('hardwareRequirements.loading')}</div>
            </div>
          ) : requirements.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                {lang('hardwareRequirements.noRequirements')}
              </div>
              <AddHardwareRequirementDialog
                productId={productId}
                companyId={companyId}
                disabled={disabled}
                trigger={
                  <Button disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    {lang('hardwareRequirements.addRequirement')}
                  </Button>
                }
              />
            </div>
          ) : (
            <HardwareRequirementsTable
              requirements={requirements}
              disabled={disabled}
              onEditRequirement={handleRowClick}
              validSystemReqIds={validSystemReqIds}
              productId={productId}
            />
          )}
        </CardContent>
      </Card>

      <HardwareAISuggestionsDialog
        open={showAISuggestions}
        onOpenChange={setShowAISuggestions}
        productId={productId}
        companyId={companyId}
      />

      <EditHardwareRequirementDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (disabled && open) return;
          setIsEditDialogOpen(open);
        }}
        requirement={editingRequirement}
        onSave={handleUpdateRequirement}
        onDelete={handleDeleteRequirement}
        isLoading={updateMutation.isPending || deleteMutation.isPending}
        disabled={disabled}
        productId={productId}
      />
      <BaselineLockDialog
        open={baselineLock.state.open}
        onOpenChange={(open) => !open && baselineLock.close()}
        reviewTitle={baselineLock.state.reviewTitle}
        baselineDate={baselineLock.state.baselineDate}
        objectId={baselineLock.state.objectId}
        objectType={baselineLock.state.objectType}
        objectLabel={baselineLock.state.objectLabel}
        companyId={companyId}
        productId={productId}
      />
      <HardwareRequirementsImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        productId={productId}
        companyId={companyId}
      />
    </div>
  );
}
