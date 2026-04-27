import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Sparkles, Download, Plus, ExternalLink, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { SoftwareRequirementsAIService } from "@/services/softwareRequirementsAIService";
import { useBaselineLockError, isBaselineLockError } from "@/hooks/useBaselineLockError";
import { BaselineLockDialog } from "@/components/change-control/BaselineLockDialog";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";
import { SoftwareAISuggestionsDialog } from "./SoftwareAISuggestionsDialog";
import { AddSoftwareRequirementDialog } from "./AddSoftwareRequirementDialog";
import { SoftwareRequirementsTable } from "./SoftwareRequirementsTable";
import { EditSoftwareRequirementDialog } from "./EditSoftwareRequirementDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { RequirementSpecification } from "@/components/product/design-risk-controls/requirement-specifications/types";
import { SoftwareRequirementsImportDialog } from "./SoftwareRequirementsImportDialog";

interface SoftwareRequirementsModuleProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function SoftwareRequirementsModule({ productId, companyId, disabled = false }: SoftwareRequirementsModuleProps) {
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<RequirementSpecification | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { lang } = useTranslation();
  const baselineLock = useBaselineLockError();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['requirement-specifications', productId, 'software'],
    queryFn: () => requirementSpecificationsService.getByProductAndType(productId, 'software'),
    enabled: !!productId
  });

  // Auto-open a software requirement when navigated from the Traceability Matrix
  useEffect(() => {
    const openId = searchParams.get('openItemId');
    if (!openId || isLoading || !requirements.length) return;
    const found = requirements.find(r => r.id === openId);
    if (found) {
      setEditingRequirement(found);
      setIsEditDialogOpen(true);
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('openItemId');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, requirements, isLoading, setSearchParams]);

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
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'software'] });
      queryClient.invalidateQueries({ queryKey: ['linked-reqs-for-user-needs', productId] });
      toast.success('Software requirement updated successfully');
    },
    onError: (error) => {
      if (isBaselineLockError(error) && editingRequirement) {
        baselineLock.handleError(error, editingRequirement.id, 'software_requirement', editingRequirement.requirement_id || editingRequirement.id);
        return;
      }
      toast.error('Failed to update software requirement');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return requirementSpecificationsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'software'] });
      queryClient.invalidateQueries({ queryKey: ['linked-reqs-for-user-needs', productId] });
      toast.success('Software requirement deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete software requirement');
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
      return SoftwareRequirementsAIService.generateSoftwareRequirements({
        companyId,
        productData,
        systemRequirements,
        selectedCategories: []
      });
    },
    onSuccess: (response) => {
      if (response.success && response.suggestions) {
        toast.success(lang('softwareRequirements.suggestions.generateSuccess', { count: response.suggestions.length }));
      } else {
        toast.error(response.error || lang('softwareRequirements.suggestions.generateError'));
      }
    },
    onError: (error) => {
      toast.error(lang('softwareRequirements.suggestions.generateError'));
      console.error('AI suggestions error:', error);
    }
  });

  const handleDownloadExcel = async () => {
    if (disabled) return;
    toast.success(lang('softwareRequirements.toast.exportComingSoon'));
  };

  const handlePushToJira = () => {
    if (disabled) return;
    toast.success(lang('softwareRequirements.toast.pushToJiraComingSoon'));
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
                {lang('softwareRequirements.title')}
              </CardTitle>
              <CardDescription>
                {lang('softwareRequirements.description')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(true)}
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
                {lang('softwareRequirements.exportExcel')}
              </Button>
              <Button
                variant="outline"
                onClick={handlePushToJira}
                disabled={disabled}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {lang('softwareRequirements.pushToJira')}
              </Button>
              <Button
                variant="outline"
                onClick={handleAISuggestions}
                disabled={disabled || generateSuggestionsMutation.isPending}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generateSuggestionsMutation.isPending ? lang('softwareRequirements.suggestions.generating') : lang('softwareRequirements.aiSuggestions')}
              </Button>
              <AddSoftwareRequirementDialog
                productId={productId}
                companyId={companyId}
                disabled={disabled}
                trigger={
                  <Button disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    {lang('softwareRequirements.addRequirement')}
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{lang('softwareRequirements.loading')}</div>
            </div>
          ) : requirements.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                {lang('softwareRequirements.noRequirements')}
              </div>
              <AddSoftwareRequirementDialog
                productId={productId}
                companyId={companyId}
                disabled={disabled}
                trigger={
                  <Button disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    {lang('softwareRequirements.addRequirement')}
                  </Button>
                }
              />
            </div>
          ) : (
            <SoftwareRequirementsTable
              requirements={requirements}
              disabled={disabled}
              onEditRequirement={handleRowClick}
              validSystemReqIds={validSystemReqIds}
            />
          )}
        </CardContent>
      </Card>

      <SoftwareAISuggestionsDialog
        open={showAISuggestions}
        onOpenChange={setShowAISuggestions}
        productId={productId}
        companyId={companyId}
      />

      <EditSoftwareRequirementDialog
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
      <SoftwareRequirementsImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        productId={productId}
        companyId={companyId}
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
    </div>
  );
}
