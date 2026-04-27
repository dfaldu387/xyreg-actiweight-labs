import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Sparkles, Download, Plus, AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { AddSystemRequirementDialog } from "./AddSystemRequirementDialog";
import { useBaselineLockError, isBaselineLockError } from "@/hooks/useBaselineLockError";
import { BaselineLockDialog } from "@/components/change-control/BaselineLockDialog";
import { AISuggestionsDialog } from "./AISuggestionsDialog";
import { SystemRequirementsTable } from "./SystemRequirementsTable";
import { EditSystemRequirementDialog } from "./EditSystemRequirementDialog";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { RequirementSpecification } from "@/components/product/design-risk-controls/requirement-specifications/types";
import { SystemRequirementsImportDialog } from "./SystemRequirementsImportDialog";

interface SystemRequirementsModuleProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function SystemRequirementsModule({ productId, companyId, disabled = false }: SystemRequirementsModuleProps) {
  const { lang } = useTranslation();
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch product name for AI suggestions
  const { data: productName } = useQuery({
    queryKey: ['product-name', productId],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('name').eq('id', productId).single();
      return data?.name || '';
    },
    enabled: !!productId,
  });
  const [editingRequirement, setEditingRequirement] = useState<RequirementSpecification | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const baselineLock = useBaselineLockError();

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['requirement-specifications', productId, 'system'],
    queryFn: () => requirementSpecificationsService.getByProductAndType(productId, 'system'),
    enabled: !!productId
  });

  // Auto-open a system requirement when navigated from the Traceability Matrix
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

  // Fetch valid user need IDs for missing link detection
  const { data: validUserNeedIds = [] } = useQuery({
    queryKey: ['valid-user-need-ids', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_needs')
        .select('user_need_id')
        .eq('product_id', productId);
      if (error) throw error;
      return (data || []).map(un => un.user_need_id);
    },
    enabled: !!productId
  });

  // Fetch SWR and HWR that derive from system requirements (reverse traceability)
  const { data: derivedByMap = {} } = useQuery({
    queryKey: ['sysr-derived-by', productId],
    queryFn: async () => {
      const [swrRes, hwrRes] = await Promise.all([
        requirementSpecificationsService.getByProductAndType(productId, 'software'),
        requirementSpecificationsService.getByProductAndType(productId, 'hardware'),
      ]);
      const map: Record<string, { id: string; type: 'software' | 'hardware' }[]> = {};
      for (const swr of swrRes) {
        if (!swr.traces_to) continue;
        const ids = swr.traces_to.split(',').map(s => s.trim()).filter(Boolean);
        for (const sysrId of ids) {
          if (!map[sysrId]) map[sysrId] = [];
          map[sysrId].push({ id: swr.requirement_id, type: 'software' });
        }
      }
      for (const hwr of hwrRes) {
        if (!hwr.traces_to) continue;
        const ids = hwr.traces_to.split(',').map(s => s.trim()).filter(Boolean);
        for (const sysrId of ids) {
          if (!map[sysrId]) map[sysrId] = [];
          map[sysrId].push({ id: hwr.requirement_id, type: 'hardware' });
        }
      }
      return map;
    },
    enabled: !!productId
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return requirementSpecificationsService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'system'] });
      queryClient.invalidateQueries({ queryKey: ['linked-reqs-for-user-needs', productId] });
      toast.success(lang('systemRequirements.toast.updateSuccess'));
    },
    onError: (error) => {
      if (isBaselineLockError(error) && editingRequirement) {
        baselineLock.handleError(error, editingRequirement.id, 'system_requirement', editingRequirement.requirement_id || editingRequirement.id);
        return;
      }
      toast.error(lang('systemRequirements.toast.updateError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return requirementSpecificationsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'system'] });
      queryClient.invalidateQueries({ queryKey: ['linked-reqs-for-user-needs', productId] });
      toast.success(lang('systemRequirements.toast.deleteSuccess'));
    },
    onError: () => {
      toast.error(lang('systemRequirements.toast.deleteError'));
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

  const handleDownloadExcel = async () => {
    if (disabled) return;
    toast.success(lang('systemRequirements.toast.exportComingSoon'));
  };

  const handleOpenAISuggestions = () => {
    if (disabled) return;
    setShowAISuggestions(true);
  };


  // Find SYSRs without any downstream SWR/HWR (non-draft only)
  const sysrsWithoutDownstream = requirements.filter(req => {
    const isDraft = req.description?.toLowerCase().startsWith('draft');
    if (isDraft) return false; // drafts are expected to not have downstream yet
    const derived = derivedByMap[req.requirement_id];
    return !derived || derived.length === 0;
  });

  return (
    <div className="space-y-6">
      {/* Traceability gap banner: SYSRs missing SWR/HWR */}
      {sysrsWithoutDownstream.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              {sysrsWithoutDownstream.length} system requirement{sysrsWithoutDownstream.length > 1 ? 's' : ''} without linked SWR/HWR
            </p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              {sysrsWithoutDownstream.map(r => r.requirement_id).join(', ')}
            </p>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {lang('systemRequirements.title')}
              </CardTitle>
              <CardDescription>
                {lang('systemRequirements.description')}
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
                {lang('systemRequirements.exportExcel')}
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenAISuggestions}
                disabled={disabled}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {lang('systemRequirements.aiSuggestions')}
              </Button>
              <AddSystemRequirementDialog
                productId={productId}
                companyId={companyId}
                disabled={disabled}
                productName={productName}
                trigger={
                  <Button disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    {lang('systemRequirements.addRequirement')}
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{lang('systemRequirements.loading')}</div>
            </div>
          ) : requirements.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                {lang('systemRequirements.noRequirements')}
              </div>
              <AddSystemRequirementDialog
                productId={productId}
                companyId={companyId}
                disabled={disabled}
                productName={productName}
                trigger={
                  <Button disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    {lang('systemRequirements.addRequirement')}
                  </Button>
                }
              />
            </div>
          ) : (
            <SystemRequirementsTable
              requirements={requirements}
              disabled={disabled}
              onEditRequirement={handleRowClick}
              validUserNeedIds={validUserNeedIds}
              derivedByMap={derivedByMap}
            />
          )}
        </CardContent>

        <AISuggestionsDialog
          open={showAISuggestions}
          onOpenChange={setShowAISuggestions}
          productId={productId}
          companyId={companyId}
        />
      </Card>

      <EditSystemRequirementDialog
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
        companyId={companyId}
        productName={productName}
      />
      <SystemRequirementsImportDialog
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
