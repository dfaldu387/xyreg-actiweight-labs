import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Plus, Download, AlertTriangle, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

import { UserNeedsService } from "@/services/userNeedsService";
import { useBaselineLockError, isBaselineLockError } from "@/hooks/useBaselineLockError";
import { BaselineLockDialog } from "@/components/change-control/BaselineLockDialog";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";
import { useProductDetails } from "@/hooks/useProductDetails";
import { UserNeedsTable } from "./UserNeedsTable";
import { AddUserNeedDialog } from "./AddUserNeedDialog";
import { EditUserNeedDialog } from "./EditUserNeedDialog";
import { UserNeedsSuggestions } from "./UserNeedsSuggestions";
import { ExcelExportService } from "@/utils/excelExport";
import { useTranslation } from "@/hooks/useTranslation";
import { generateUserNeedsURSHtml } from "@/utils/userNeedsDocumentGenerator";
import { SaveContentAsDocCIDialog } from "@/components/shared/SaveContentAsDocCIDialog";
import { supabase } from "@/integrations/supabase/client";
import type { UserNeed, CreateUserNeedRequest, UpdateUserNeedRequest } from "./types";
import { UserNeedsImportDialog } from "./UserNeedsImportDialog";

interface UserNeedsModuleProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function UserNeedsModule({ productId, companyId, disabled = false }: UserNeedsModuleProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [editingUserNeed, setEditingUserNeed] = useState<UserNeed | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [showURSDialog, setShowURSDialog] = useState(false);
  const baselineLock = useBaselineLockError();

  // Fetch product details for AI suggestions
  const { data: productData } = useProductDetails(productId);

  // Fetch company name for URS document generation
  const { data: company } = useQuery({
    queryKey: ['company-name', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { 
    data: userNeeds = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['user-needs', productId],
    queryFn: () => UserNeedsService.getUserNeeds(productId),
  });

  // Query SYSRs to detect traceability gaps
  const { data: allSysrs = [] } = useQuery({
    queryKey: ['requirement-specifications', productId, 'system'],
    queryFn: () => requirementSpecificationsService.getByProductAndType(productId, 'system'),
  });

  // Find UNs with no linked SYSRs
  const unsWithoutSysrs = userNeeds.filter(un => {
    return !allSysrs.some(sysr => 
      sysr.traces_to && sysr.traces_to.split(',').map((s: string) => s.trim()).includes(un.user_need_id)
    );
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserNeedRequest) => {
      return await UserNeedsService.createUserNeed(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-needs', productId] });
      toast.success(lang('userNeeds.toast.createSuccess'));
    },
    onError: (error) => {
      console.error('Failed to create user need:', error);
      toast.error(lang('userNeeds.toast.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserNeedRequest }) => {
      return await UserNeedsService.updateUserNeed(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-needs', productId] });
      toast.success(lang('userNeeds.toast.updateSuccess'));
    },
    onError: (error) => {
      if (isBaselineLockError(error) && editingUserNeed) {
        baselineLock.handleError(error, editingUserNeed.id, 'user_need', editingUserNeed.user_need_id || editingUserNeed.id);
        return;
      }
      console.error('Failed to update user need:', error);
      toast.error(lang('userNeeds.toast.updateError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await UserNeedsService.deleteUserNeed(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-needs', productId] });
      toast.success(lang('userNeeds.toast.deleteSuccess'));
    },
    onError: (error) => {
      console.error('Failed to delete user need:', error);
      toast.error(lang('userNeeds.toast.deleteError'));
    },
  });

  const handleAddUserNeed = async (data: { description: string; status: 'Met' | 'Not Met'; category?: string }) => {
    if (disabled) return;
    await createMutation.mutateAsync({
      product_id: productId,
      company_id: companyId,
      description: data.description,
      status: data.status,
      category: data.category || 'General'
    });
  };

  const handleUserNeedAdded = () => {
    if (disabled) return;
    queryClient.invalidateQueries({ queryKey: ['user-needs', productId] });
    queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'system'] });
    setIsAddDialogOpen(false);
  };

  const handleRowClick = (userNeed: UserNeed) => {
    if (disabled) return;
    setEditingUserNeed(userNeed);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUserNeed = async (id: string, data: UpdateUserNeedRequest) => {
    if (disabled) return;
    await updateMutation.mutateAsync({ id, data });
  };

  const handleDeleteUserNeed = async (id: string) => {
    if (disabled) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleDownloadExcel = async () => {
    if (disabled) return;
    try {
      const data = ExcelExportService.formatUserNeedsForExport(userNeeds);
      await ExcelExportService.exportToExcel([data], `User_Needs_${productData?.name || 'Product'}`);
      toast.success(lang('userNeeds.toast.exportSuccess'));
    } catch (error) {
      console.error('Failed to export user needs:', error);
      toast.error(lang('userNeeds.toast.exportError'));
    }
  };

  const handleOpenAISuggestions = () => {
    if (disabled) return;
    setShowAISuggestions(true);
  };

  const handleOpenAddDialog = () => {
    if (disabled) return;
    setIsAddDialogOpen(true);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            {lang('userNeeds.loadError')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Traceability gap banner */}
      {unsWithoutSysrs.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              {unsWithoutSysrs.length} user need{unsWithoutSysrs.length > 1 ? 's' : ''} without linked system requirements
            </p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              {unsWithoutSysrs.map(un => un.user_need_id).join(', ')}
            </p>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{lang('userNeeds.title')}</CardTitle>
              <CardDescription>
                {lang('userNeeds.description')}
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
                onClick={() => setShowURSDialog(true)}
                disabled={disabled || userNeeds.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate URS
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadExcel}
                disabled={disabled || userNeeds.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {lang('userNeeds.exportExcel')}
              </Button>
              {productData && (
                <Button
                  variant="outline"
                  onClick={handleOpenAISuggestions}
                  disabled={disabled}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {lang('userNeeds.aiSuggestions')}
                </Button>
              )}
              <Button onClick={handleOpenAddDialog} disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                {lang('userNeeds.addUserNeed')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{lang('userNeeds.loading')}</div>
            </div>
          ) : userNeeds.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                {lang('userNeeds.noUserNeeds')}
              </div>
              <Button onClick={handleOpenAddDialog} disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                {lang('userNeeds.addUserNeed')}
              </Button>
            </div>
          ) : (
            <UserNeedsTable
              userNeeds={userNeeds}
              isLoading={isLoading}
              onEditUserNeed={handleRowClick}
              disabled={disabled}
            />
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions Dialog */}
      {productData && (
        <UserNeedsSuggestions
          productId={productId}
          companyId={companyId}
          productData={productData}
          onAddUserNeed={handleAddUserNeed}
          open={showAISuggestions}
          onOpenChange={setShowAISuggestions}
          isLoading={createMutation.isPending}
        />
      )}

      <AddUserNeedDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        productId={productId}
        companyId={companyId}
        onUserNeedAdded={handleUserNeedAdded}
        disabled={disabled}
      />

      <EditUserNeedDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (disabled && open) return;
          setIsEditDialogOpen(open);
        }}
        userNeed={editingUserNeed}
        onSave={handleUpdateUserNeed}
        onDelete={handleDeleteUserNeed}
        isLoading={updateMutation.isPending || deleteMutation.isPending}
        disabled={disabled}
        companyId={companyId}
      />
      <UserNeedsImportDialog
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
      {company?.name && (
        <SaveContentAsDocCIDialog
          open={showURSDialog}
          onOpenChange={setShowURSDialog}
          title="User Needs Specification (URS)"
          htmlContent={generateUserNeedsURSHtml(userNeeds, productData?.name || 'Product', company.name)}
          templateIdKey={`URS-UN-${productId}`}
          companyId={companyId}
          companyName={company.name}
          productId={productId}
          defaultScope="device"
        />
      )}
    </div>
  );
}