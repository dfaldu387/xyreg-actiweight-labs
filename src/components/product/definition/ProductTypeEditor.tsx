import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Pencil, Save, X, AlertTriangle, Check, Target } from 'lucide-react';
import { PRODUCT_TYPE_OPTIONS, PROJECT_TYPES_BY_CATEGORY } from '@/data/productTypeOptions';
import { PROJECT_TYPE_TOOLTIPS } from '@/data/projectTypeTooltips';
import { ProductUpdateService } from '@/services/productUpdateService';
import { validateProductTypeChange, getProductTypeFromProjectTypes } from '@/utils/productTypeValidation';
import { ProductType, getProductTypeLabel } from '@/utils/productTypeDetection';
import { ProjectTypeMultiSelect } from '../ProjectTypeMultiSelect';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getExpectedPhaseForProjectTypes, cleanPhaseName } from '@/utils/projectTypePhaseMapping';
import { ProductBundleOverview } from './ProductBundleOverview';

interface ProductTypeEditorProps {
  productId: string;
  currentProductType: ProductType;
  currentProjectTypes: string[];
  product: any;
  companyId?: string;
  companyName?: string;
  onUpdate?: () => void;
}

export function ProductTypeEditor({ 
  productId,
  currentProductType, 
  currentProjectTypes,
  product,
  companyId,
  companyName,
  onUpdate 
}: ProductTypeEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState<ProductType>(currentProductType);
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>(currentProjectTypes || []);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const currentOption = PRODUCT_TYPE_OPTIONS.find(opt => opt.id === currentProductType);
  const IconComponent = currentOption?.icon;

  // Fetch current lifecycle phase
  const { data: currentPhase } = useQuery({
    queryKey: ['product-current-phase', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('lifecycle_phases')
        .select('id, name, phase_id, company_phases(name)')
        .eq('product_id', productId)
        .eq('is_current_phase', true)
        .maybeSingle();
      return data;
    }
  });

  // Determine phase display
  const getPhaseDisplay = () => {
    if (currentPhase?.company_phases?.name) {
      return {
        name: cleanPhaseName(currentPhase.company_phases.name),
        source: 'Active Phase',
        isActual: true
      };
    }
    const expectedPhase = getExpectedPhaseForProjectTypes(currentProjectTypes);
    return {
      name: expectedPhase,
      source: currentProjectTypes[0] || 'Project Type',
      isActual: false
    };
  };

  const phaseDisplay = getPhaseDisplay();

  const handleEdit = () => {
    setIsEditing(true);
    setSelectedType(currentProductType);
    setSelectedProjectTypes(currentProjectTypes || []);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedType(currentProductType);
    setSelectedProjectTypes(currentProjectTypes || []);
  };

  const handleSave = async () => {
    // Validate the changes
    const validation = validateProductTypeChange(
      currentProductType,
      selectedType,
      selectedProjectTypes,
      product
    );

    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join('\n'),
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await ProductUpdateService.updateProductType(
        productId,
        selectedType,
        selectedProjectTypes,
        product.company_id
      );

      toast({
        title: "Product Type Updated",
        description: `Successfully updated to ${getProductTypeLabel(selectedType)}`,
      });

      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating product type:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update product type. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType as ProductType);
    // Auto-select default project type for the category
    const defaultTypes = PROJECT_TYPES_BY_CATEGORY[newType as keyof typeof PROJECT_TYPES_BY_CATEGORY];
    if (defaultTypes && defaultTypes.length > 0) {
      setSelectedProjectTypes([defaultTypes[0]]);
    }
  };

  const validation = validateProductTypeChange(
    currentProductType,
    selectedType,
    selectedProjectTypes,
    product
  );

  if (!isEditing) {
    // View Mode
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Product Classification</h3>
            <p className="text-sm text-muted-foreground">
              Product type and project categories
            </p>
          </div>
          <Button onClick={handleEdit} variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Three-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Left: Product Type */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {IconComponent && (
                <div className={`w-12 h-12 rounded-lg ${currentOption?.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className={`h-6 w-6 ${currentOption?.color}`} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium mb-1">{getProductTypeLabel(currentProductType)}</div>
                <div className="text-sm text-muted-foreground">{currentOption?.descriptionKey}</div>
              </div>
            </div>

            {/* Current Project Types */}
            {currentProjectTypes && currentProjectTypes.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Project Types</Label>
                <div className="flex flex-wrap gap-2">
                  {currentProjectTypes.map(type => (
                    <Badge key={type} variant="secondary">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle: Current Milestone/Phase */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center flex-shrink-0">
                <Target className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Current Milestone
                </div>
                <div className="font-semibold flex items-center gap-2">
                  {phaseDisplay.name}
                  {phaseDisplay.isActual && (
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {phaseDisplay.isActual ? 'Active Phase' : `Based on: ${phaseDisplay.source}`}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Bundle - Always render */}
          <div className="space-y-4">
            <ProductBundleOverview 
              productId={productId} 
              companyId={companyId || ''} 
              companyName={companyName || ''}
            />
          </div>
        </div>
      </Card>
    );
  }

  // Edit Mode
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Edit Product Classification</h3>
          <p className="text-sm text-muted-foreground">
            Change product type and project categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} size="sm" disabled={isSaving || !validation.isValid}>
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Validation Warnings */}
        {validation.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Product Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Product Type *</Label>
          <RadioGroup value={selectedType} onValueChange={handleTypeChange}>
            <div className="space-y-3">
              {PRODUCT_TYPE_OPTIONS.map(option => {
                const OptionIcon = option.icon;
                return (
                  <div
                    key={option.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedType === option.id
                        ? `${option.bgColor} border-current`
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleTypeChange(option.id)}
                  >
                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg ${option.bgColor} flex items-center justify-center`}>
                        <OptionIcon className={`h-5 w-5 ${option.color}`} />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={option.id} className="font-medium cursor-pointer">
                          {getProductTypeLabel(option.id as ProductType)}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.descriptionKey}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>

        {/* Project Types Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Project Types *</Label>
          <ProjectTypeMultiSelect
            availableTypes={PROJECT_TYPES_BY_CATEGORY[selectedType as keyof typeof PROJECT_TYPES_BY_CATEGORY] || []}
            selectedTypes={selectedProjectTypes}
            onSelectionChange={setSelectedProjectTypes}
            tooltips={PROJECT_TYPE_TOOLTIPS}
          />
          <p className="text-sm text-muted-foreground">
            Select the types of projects or activities this product involves
          </p>
        </div>

        {/* Validation Errors */}
        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}
