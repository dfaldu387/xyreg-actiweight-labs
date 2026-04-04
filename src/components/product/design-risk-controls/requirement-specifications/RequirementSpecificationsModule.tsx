import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";
import { useBaselineLockError, isBaselineLockError } from "@/hooks/useBaselineLockError";
import { BaselineLockDialog } from "@/components/change-control/BaselineLockDialog";
import { traceabilityService } from "@/services/traceabilityService";
import { UserNeedsService } from "@/services/userNeedsService";
import { useProductDetails } from "@/hooks/useProductDetails";
import { AddRequirementDialog } from "./AddRequirementDialog";
import { EditRequirementDialog } from "./EditRequirementDialog";
import { RequirementSpecificationsTable } from "./RequirementSpecificationsTable";
import { RequirementSpecsSuggestions } from "./RequirementSpecsSuggestions";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import { ExcelExportService } from "@/utils/excelExport";
import type { CreateRequirementSpecificationData, RequirementSpecification, UpdateRequirementSpecificationData } from "./types";

interface RequirementSpecificationsModuleProps {
  productId: string;
  companyId: string;
}

export function RequirementSpecificationsModule({ 
  productId, 
  companyId 
}: RequirementSpecificationsModuleProps) {
  const queryClient = useQueryClient();
  const [editingRequirement, setEditingRequirement] = useState<RequirementSpecification | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [deletingRequirement, setDeletingRequirement] = useState<RequirementSpecification | null>(null);
  const baselineLock = useBaselineLockError();

  // Fetch product details for AI suggestions
  const { data: productData } = useProductDetails(productId);

  // Fetch user needs for AI suggestions
  const { data: userNeeds = [] } = useQuery({
    queryKey: ['user-needs', productId],
    queryFn: () => UserNeedsService.getUserNeeds(productId),
    enabled: !!productId
  });

  const { 
    data: requirements = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['requirement-specifications', productId],
    queryFn: () => requirementSpecificationsService.getByProductId(productId),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateRequirementSpecificationData) => {
      const requirement = await requirementSpecificationsService.create(productId, companyId, data);
      
      // Update traceability links if traces_to has user need IDs
      if (data.traces_to && data.traces_to.trim()) {
        const userNeedIds = data.traces_to.split(',').map(id => id.trim()).filter(Boolean);
        if (userNeedIds.length > 0) {
          await traceabilityService.updateRequirementUserNeedLinks(requirement.requirement_id, userNeedIds);
        }
      }
      
      return requirement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['requirement-specifications', productId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['user-needs', productId] 
      });
      toast({
        description: "Requirement specification created successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to create requirement specification:', error);
      toast({
        description: "Failed to create requirement specification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, requirementId, userNeedIds }: {
      id: string;
      data: UpdateRequirementSpecificationData;
      requirementId: string;
      userNeedIds: string[];
    }) => {
      return await requirementSpecificationsService.updateWithTraceability(id, data, requirementId, userNeedIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['requirement-specifications', productId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['user-needs', productId] 
      });
      toast({
        description: "Requirement specification updated successfully.",
      });
    },
    onError: (error) => {
      if (isBaselineLockError(error) && editingRequirement) {
        baselineLock.handleError(error, editingRequirement.id, 'requirement_specification', editingRequirement.requirement_id || editingRequirement.id);
        return;
      }
      console.error('Failed to update requirement specification:', error);
      toast({
        description: "Failed to update requirement specification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await requirementSpecificationsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['requirement-specifications', productId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['user-needs', productId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['hazards', productId] 
      });
      setDeletingRequirement(null);
      toast({
        description: "Requirement specification deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to delete requirement specification:', error);
      setDeletingRequirement(null);
      toast({
        description: "Failed to delete requirement specification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddRequirement = async (data: CreateRequirementSpecificationData) => {
    await createMutation.mutateAsync(data);
  };

  const handleRowClick = (requirement: RequirementSpecification) => {
    setEditingRequirement(requirement);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRequirement = async (id: string, data: UpdateRequirementSpecificationData) => {
    if (!editingRequirement) return;
    
    // Parse user need IDs from traces_to field
    const userNeedIds = data.traces_to 
      ? data.traces_to.split(',').map(id => id.trim()).filter(Boolean)
      : [];
    
    await updateMutation.mutateAsync({
      id,
      data,
      requirementId: editingRequirement.requirement_id,
      userNeedIds
    });
  };

  const handleDeleteRequirement = (requirement: RequirementSpecification) => {
    setDeletingRequirement(requirement);
  };

  const handleConfirmDelete = (reason: string) => {
    if (deletingRequirement) {
      deleteMutation.mutate(deletingRequirement.id);
      setDeletingRequirement(null);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const data = ExcelExportService.formatRequirementSpecsForExport(requirements);
      await ExcelExportService.exportToExcel([data], `Requirement_Specifications_${productData?.name || 'Product'}`);
      toast({
        description: "Requirement specifications exported to Excel successfully",
      });
    } catch (error) {
      console.error('Failed to export requirement specifications:', error);
      toast({
        description: "Failed to export requirement specifications to Excel",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Failed to load requirement specifications. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Requirement Specifications</CardTitle>
              <CardDescription>
                Manage requirement specifications for this product
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleDownloadExcel}
                disabled={requirements.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              {/* Only show AI suggestions if we have product data and user needs */}
              {productData && userNeeds.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowAISuggestions(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Suggestions
                </Button>
              )}
              <AddRequirementDialog
                onAdd={handleAddRequirement}
                isLoading={createMutation.isPending}
                productId={productId}
                companyId={companyId}
                productName={productData?.name}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading requirement specifications...</div>
            </div>
          ) : requirements.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                No requirement specifications found for this product.
              </div>
              <AddRequirementDialog
                onAdd={handleAddRequirement}
                isLoading={createMutation.isPending}
                productId={productId}
                companyId={companyId}
                productName={productData?.name}
              />
            </div>
          ) : (
            <RequirementSpecificationsTable
              data={requirements}
              onRowClick={handleRowClick}
              onDeleteRequirement={handleDeleteRequirement}
            />
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions Dialog */}
      {productData && userNeeds && (
        <RequirementSpecsSuggestions
          productId={productId}
          companyId={companyId}
          productData={productData}
          userNeeds={userNeeds}
          onAddRequirement={handleAddRequirement}
          open={showAISuggestions}
          onOpenChange={setShowAISuggestions}
          isLoading={createMutation.isPending}
        />
      )}

      <EditRequirementDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        requirement={editingRequirement}
        onSave={handleUpdateRequirement}
        isLoading={updateMutation.isPending}
        productId={productId}
        companyId={companyId}
        productName={productData?.name}
      />

      {deletingRequirement && (
        <DeleteConfirmationDialog
          open={!!deletingRequirement}
          onOpenChange={(open) => !open && setDeletingRequirement(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Requirement"
          description="This will permanently delete the requirement specification and remove all its traceability links to user needs and hazards."
          itemName={`${deletingRequirement.requirement_id} - ${deletingRequirement.description}`}
          affectedItems={[
            ...(deletingRequirement.traces_to ? deletingRequirement.traces_to.split(',').map(id => `User Need ${id.trim()}`).filter(Boolean) : []),
            ...(deletingRequirement.linked_risks ? deletingRequirement.linked_risks.split(',').map(id => `Hazard ${id.trim()}`).filter(Boolean) : [])
          ]}
          isLoading={deleteMutation.isPending}
        />
      )}
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