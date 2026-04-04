import React, { useState, useEffect } from 'react';
import { useFieldGovernance } from '@/hooks/useFieldGovernance';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IntendedPurposeSection } from './sections/IntendedPurposeSection';
import { 
  useProductDefinition, 
  useUpdateProductDefinition, 
  useModelVariantStats,
  useCreateDefinitionOverride,
  useRemoveDefinitionOverride 
} from '@/hooks/useProductDefinition';
import { useFieldScopeState } from '@/hooks/useFieldScopeState';
import { ApplyToAllDialog } from '@/components/product/definition/ApplyToAllDialog';
import { InheritanceIndicator } from '@/components/product/definition/InheritanceIndicator';
import { CustomDefinitionDialog } from '@/components/product/definition/CustomDefinitionDialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ApplyToOption, ProductDefinitionData } from '@/services/productDefinitionService';

interface IntendedPurposeSectionWithInheritanceProps {
  productId: string;
  companyId: string;
  productName?: string;
  // Original props from IntendedPurposeSection
  onIntendedUseChange?: (value: string) => void;
  onIntendedPurposeDataChange?: (value: any) => void;
  onContraindicationsChange?: (value: string[]) => void;
  onIntendedUsersChange?: (value: string[]) => void;
  onClinicalBenefitsChange?: (value: string[]) => void;
  onUserInstructionsChange?: (value: any) => void;
  isLoading?: boolean;
  aiSuggestions?: any[];
  onAcceptAISuggestion?: (fieldType: string, suggestion: string) => void;
}

export function IntendedPurposeSectionWithInheritance({
  productId,
  companyId,
  productName,
  onIntendedUseChange,
  onIntendedPurposeDataChange,
  onContraindicationsChange,
  onIntendedUsersChange,
  onClinicalBenefitsChange,
  onUserInstructionsChange,
  isLoading,
  aiSuggestions,
  onAcceptAISuggestion
}: IntendedPurposeSectionWithInheritanceProps) {
  const { getSection } = useFieldGovernance(productId);
  const governanceRecord = getSection('intended_use');
  const { data: definition, isLoading: defLoading } = useProductDefinition(productId);
  const { data: variantStats } = useModelVariantStats(definition?.modelId);
  const updateMutation = useUpdateProductDefinition(productId);
  const createOverrideMutation = useCreateDefinitionOverride(productId);
  const removeOverrideMutation = useRemoveDefinitionOverride(productId);

  // Check if product belongs to a family via basic_udi_di
  const { data: productBasicUdi } = useQuery({
    queryKey: ['product-basic-udi', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('basic_udi_di')
        .eq('id', productId)
        .single();
      return (data as any)?.basic_udi_di as string | null;
    },
    enabled: !!productId,
  });

  const belongsToFamily = !!definition?.modelId || !!productBasicUdi;

  const { getFieldScope, setFieldScope, overrides } = useFieldScopeState(
    productId,
    belongsToFamily
  );

  // Build fieldScopes record from overrides for passing to child
  const fieldScopes: Record<string, 'individual' | 'product_family'> = {};
  Object.keys(overrides).forEach(key => {
    fieldScopes[key] = overrides[key];
  });

  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ field: string; value: any } | null>(null);
  const [useCustomDefinition, setUseCustomDefinition] = useState(false);

  useEffect(() => {
    if (definition) {
      setUseCustomDefinition(definition.hasOverride);
    }
  }, [definition]);

  const handleFieldChange = (field: string, value: any) => {
    // If product has a model and no override, show apply dialog
    if (definition?.modelId && !definition.hasOverride && !useCustomDefinition) {
      setPendingUpdate({ field, value });
      setShowApplyDialog(true);
      return;
    }

    // Otherwise, just update normally
    applyUpdate(field, value, 'variant-only');
  };

  const applyUpdate = async (field: string, value: any, applyTo: ApplyToOption) => {
    const updateData: ProductDefinitionData = {};
    
    // Map field to data structure
    if (field === 'clinicalPurpose') {
      updateData.intended_use = value;
    } else if (field === 'intendedPurposeData') {
      updateData.intended_purpose_data = value;
    } else if (field === 'contraindications') {
      updateData.contraindications = value;
    } else if (field === 'intendedUsers') {
      updateData.intended_users = value;
    } else if (field === 'modeOfAction') {
      updateData.mode_of_action = value;
    } else if (field === 'warnings') {
      updateData.warnings = value;
    } else if (field === 'precautions') {
      updateData.precautions = value;
    }

    await updateMutation.mutateAsync({ data: updateData, applyTo });
    
    // Also call the original onChange handlers
    if (field === 'clinicalPurpose' && onIntendedUseChange) {
      onIntendedUseChange(value);
    }
  };

  const handleApplyDialogConfirm = (applyTo: ApplyToOption) => {
    if (pendingUpdate) {
      applyUpdate(pendingUpdate.field, pendingUpdate.value, applyTo);
      setPendingUpdate(null);
    }
    setShowApplyDialog(false);
  };

  const handleToggleCustomDefinition = async (checked: boolean) => {
    if (checked && !definition?.hasOverride) {
      // Show dialog to create override
      setShowCustomDialog(true);
    } else if (!checked && definition?.hasOverride) {
      // Remove override and revert to model
      await removeOverrideMutation.mutateAsync();
      setUseCustomDefinition(false);
    } else {
      setUseCustomDefinition(checked);
    }
  };

  const handleCustomDialogConfirm = async (reason: string) => {
    // Create override with current values and reason
    const updateData: ProductDefinitionData = {
      intended_use: definition?.intended_use || '',
      intended_purpose_data: definition?.intended_purpose_data,
      intended_users: definition?.intended_users,
      mode_of_action: definition?.mode_of_action || '',
      contraindications: definition?.contraindications,
      warnings: definition?.warnings || '',
      precautions: definition?.precautions || ''
    };

    await createOverrideMutation.mutateAsync({ data: updateData, reason });
    setUseCustomDefinition(true);
    setShowCustomDialog(false);
  };

  if (defLoading) {
    return <div>Loading definition data...</div>;
  }

  const variantCount = variantStats?.totalVariants ? variantStats.totalVariants - 1 : 0;
  const isProcessing = updateMutation.isPending || createOverrideMutation.isPending || removeOverrideMutation.isPending;

  return (
    <>
      {definition?.modelId && (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Definition Inheritance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {variantStats && variantStats.totalVariants > 1 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This variant is part of "{definition.modelName}" with {variantStats.totalVariants} total variants.
                  {variantStats.inheritingVariants > 0 && ` ${variantStats.inheritingVariants} inheriting from model.`}
                  {variantStats.overriddenVariants > 0 && ` ${variantStats.overriddenVariants} with custom definitions.`}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="custom-definition" className="text-sm">
                  Use custom definition for this variant
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable to create variant-specific values instead of inheriting from model
                </p>
              </div>
              <Switch
                id="custom-definition"
                checked={useCustomDefinition}
                onCheckedChange={handleToggleCustomDefinition}
                disabled={isProcessing}
              />
            </div>
            
            {definition && (
              <InheritanceIndicator
                isInherited={definition.isInherited}
                hasOverride={definition.hasOverride}
                modelName={definition.modelName}
                overrideReason={definition.overrideReason}
                size="md"
              />
            )}
          </CardContent>
        </Card>
      )}

      <IntendedPurposeSection
        intendedUse={definition?.intended_use || ''}
        intendedPurposeData={definition?.intended_purpose_data || {}}
        contraindications={Array.isArray(definition?.contraindications) ? definition.contraindications : []}
        intendedUsers={Array.isArray(definition?.intended_users) ? definition.intended_users : []}
        onIntendedUseChange={(value) => handleFieldChange('clinicalPurpose', value)}
        onIntendedPurposeDataChange={(value) => handleFieldChange('intendedPurposeData', value)}
        onContraindicationsChange={(value) => handleFieldChange('contraindications', value)}
        onIntendedUsersChange={(value) => handleFieldChange('intendedUsers', value)}
        onClinicalBenefitsChange={onClinicalBenefitsChange}
        onUserInstructionsChange={onUserInstructionsChange}
        isLoading={isLoading || isProcessing}
        aiSuggestions={aiSuggestions}
        onAcceptAISuggestion={onAcceptAISuggestion}
        companyId={companyId}
        productName={productName}
        hasModel={belongsToFamily}
        fieldScopes={fieldScopes}
        onFieldScopeChange={(fieldKey, scope) => setFieldScope(fieldKey, scope)}
        governanceStatus={governanceRecord?.status}
        governanceDesignReviewId={governanceRecord?.design_review_id}
        governanceVerdictComment={governanceRecord?.verdict_comment}
        governanceApprovedAt={governanceRecord?.approved_at}
        productId={productId}
      />

      {definition?.modelId && (
        <>
          <ApplyToAllDialog
            open={showApplyDialog}
            onOpenChange={setShowApplyDialog}
            modelName={definition.modelName}
            variantCount={variantCount}
            fieldName={pendingUpdate?.field || 'this field'}
            onApply={handleApplyDialogConfirm}
            isLoading={isProcessing}
          />

          <CustomDefinitionDialog
            open={showCustomDialog}
            onOpenChange={setShowCustomDialog}
            fieldName="product definition"
            onConfirm={handleCustomDialogConfirm}
            isLoading={isProcessing}
          />
        </>
      )}
    </>
  );
}
