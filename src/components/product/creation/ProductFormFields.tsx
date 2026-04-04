import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpTooltip } from "@/components/product/device/sections/HelpTooltip";
import { ProjectTypeSingleSelect } from "../ProjectTypeSingleSelect";
import { BaseProductSelector } from "../BaseProductSelector";
import { ProductPlatformSelector } from "../ProductPlatformSelector";
import { PlatformBaseProductSelector } from "../PlatformBaseProductSelector";
import { PROJECT_TYPES_BY_CATEGORY } from "@/data/productTypeOptions";
import { PROJECT_TYPE_TOOLTIPS } from "@/data/projectTypeTooltips";
import { marketData } from "@/utils/marketRiskClassMapping";
import { MultiSelect } from "@/components/settings/document-control/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVariationDimensions } from "@/hooks/useVariationDimensions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGenesisRestrictions } from "@/hooks/useGenesisRestrictions";

import { SystemArchitecture } from '@/components/product/business-case/StakeholderProfiler/ArchitectureSelector';

interface FormData {
  name: string;
  description: string;
  projectType: string;
  baseProductId: string | null;
  productPlatform?: string;
  changeDescription?: string;
  projectStartDate?: Date;
  launchDate?: Date;
  isPlatformNewlyCreated?: boolean;
  isBasedonPlatform?: boolean;
  targetMarkets?: string[];
  marketLaunchDates?: Record<string, Date>; // Market code -> Launch date
  variantSelections?: Record<string, string>; // dimensionId -> optionId for variants
  tradeName?: string; // Trade name for variants
  basicUdiDi?: string;
  systemArchitecture?: SystemArchitecture;
}

interface ProductFormFieldsProps {
  selectedProductType: string;
  formData: FormData;
  companyId: string;
  onFormDataChange: (updates: Partial<FormData>) => void;
  baseProductTradeNames?: string[];
}

export function ProductFormFields({
  selectedProductType,
  formData,
  companyId,
  onFormDataChange,
  baseProductTradeNames
}: ProductFormFieldsProps) {
  const { isGenesis, restrictions } = useGenesisRestrictions(companyId);

  const showVariantFields = selectedProductType === 'variant';

  // Load variation dimensions for variant creation
  const {
    dimensions: variantDimensions,
    optionsByDimension,
    loading: dimensionsLoading,
    createOption: createVariantOption
  } = useVariationDimensions(
    showVariantFields ? companyId : undefined
  );

  const [optionDialogState, setOptionDialogState] = React.useState<{
    dimensionId: string;
    dimensionName: string;
  } | null>(null);
  const [newOptionName, setNewOptionName] = React.useState("");
  const [isSavingOption, setIsSavingOption] = React.useState(false);

  // Fetch base product's basic_udi_di and devices with the same basic_udi_di
  const { data: baseProductBasicUdi } = useQuery({
    queryKey: ['baseProductBasicUdi', formData.baseProductId],
    queryFn: async () => {
      if (!formData.baseProductId || selectedProductType !== 'variant') return null;
      const { data, error } = await supabase
        .from('products')
        .select('basic_udi_di')
        .eq('id', formData.baseProductId)
        .single();
      if (error || !data?.basic_udi_di) return null;
      return data.basic_udi_di;
    },
    enabled: !!formData.baseProductId && selectedProductType === 'variant',
  });

  // Fetch all devices with the same basic_udi_di
  const { data: devicesInFamily } = useQuery({
    queryKey: ['devicesInFamily', baseProductBasicUdi, companyId],
    queryFn: async () => {
      if (!baseProductBasicUdi || !companyId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name, version, status, basic_udi_di')
        .eq('company_id', companyId)
        .eq('basic_udi_di', baseProductBasicUdi)
        .order('name', { ascending: true });
      if (error) {
        console.error('Error fetching devices in family:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!baseProductBasicUdi && !!companyId,
  });

  // Validate launch dates when project start date changes
  React.useEffect(() => {
    if (!formData.projectStartDate) return;

    const updates: Partial<FormData> = {};
    let hasInvalidDates = false;

    // Check general launch date
    if (formData.launchDate && formData.launchDate < formData.projectStartDate) {
      updates.launchDate = undefined;
      hasInvalidDates = true;
    }

    // Check market launch dates
    if (formData.marketLaunchDates) {
      const validMarketDates: Record<string, Date> = {};
      Object.entries(formData.marketLaunchDates).forEach(([marketCode, date]) => {
        if (date && date >= formData.projectStartDate!) {
          validMarketDates[marketCode] = date;
        } else {
          hasInvalidDates = true;
        }
      });
      if (Object.keys(validMarketDates).length !== Object.keys(formData.marketLaunchDates).length) {
        updates.marketLaunchDates = validMarketDates;
      }
    }

    if (hasInvalidDates) {
      toast.error('Some launch dates were cleared as they were before the project start date');
      onFormDataChange(updates);
    }
  }, [formData.projectStartDate]);

  // Early return AFTER all hooks
  if (!selectedProductType) return null;

  const getAvailableProjectTypes = () => {
    if (!selectedProductType) return [];
    return PROJECT_TYPES_BY_CATEGORY[selectedProductType as keyof typeof PROJECT_TYPES_BY_CATEGORY] || [];
  };

  const isNameRequired = selectedProductType === 'new_product' || selectedProductType === 'line_extension' || selectedProductType === 'legacy_product' || selectedProductType === 'variant';
  const showBaseProductSelector = selectedProductType === 'existing_product' || selectedProductType === 'variant';
  const showPlatformSelector = selectedProductType === 'line_extension';
  const showProjectTypes = selectedProductType === 'new_product' || selectedProductType === 'existing_product';

  const openVariantOptionDialog = (dimensionId: string, dimensionName: string) => {
    setOptionDialogState({ dimensionId, dimensionName });
    setNewOptionName("");
  };

  const closeVariantOptionDialog = () => {
    if (isSavingOption) return;
    setOptionDialogState(null);
    setNewOptionName("");
  };

  const handleConfirmAddVariantOption = async () => {
    if (!createVariantOption || !optionDialogState) return;
    const trimmedName = newOptionName.trim();
    if (!trimmedName) {
      toast.error("Option name cannot be empty");
      return;
    }

    setIsSavingOption(true);
    try {
      const newOption = await createVariantOption(optionDialogState.dimensionId, trimmedName);
      if (newOption?.id) {
        const currentSelections = formData.variantSelections || {};
        onFormDataChange({
          variantSelections: {
            ...currentSelections,
            [optionDialogState.dimensionId]: newOption.id
          }
        });
        toast.success(`${optionDialogState.dimensionName} option "${trimmedName}" added`);
        closeVariantOptionDialog();
      }
    } catch (error) {
      console.error("Failed to add variant option", error);
      toast.error("Failed to add option");
    } finally {
      setIsSavingOption(false);
    }
  };

  const handlePlatformSelect = (platform: string) => {
    onFormDataChange({
      productPlatform: platform,
      baseProductId: null, // Reset base product when platform changes
      isPlatformNewlyCreated: false // Selecting existing platform
    });
  };

  const handlePlatformCreated = (platform: string, baseProductId: string) => {
    onFormDataChange({
      productPlatform: platform,
      baseProductId: baseProductId,
      isPlatformNewlyCreated: true // Platform was just created
    });
  };

  const handleGenerateTemporaryUdi = () => {
    const now = new Date();
    const datePart = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now
      .getFullYear()
      .toString()}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const tempKey = `tmp-${datePart}-${randomPart}`;
    onFormDataChange({ basicUdiDi: tempKey });
    toast.success(`Temporary Basic UDI-DI generated (${tempKey})`);
  };

  // For line extensions, base product is only required if platform was newly created
  const isBaseProductRequired = selectedProductType === 'line_extension' && formData.isPlatformNewlyCreated;
  const showPlatformBaseProductSelector = showPlatformSelector && formData.productPlatform && formData.isPlatformNewlyCreated;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          {selectedProductType === 'variant' ? 'Variant Name' : 'Device Name'} {isNameRequired ? '*' : '(Optional)'}
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onFormDataChange({ name: e.target.value })}
          placeholder={
            selectedProductType === 'existing_product'
              ? "Leave empty for auto-generated version name"
              : selectedProductType === 'line_extension'
                ? "Enter line extension device name"
                : selectedProductType === 'variant'
                  ? "e.g., Red, Small, 10mm"
                  : "Enter device name"
          }
          required={isNameRequired}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          data-form-type="other"
        />
        {selectedProductType === 'existing_product' && (
          <p className="text-sm text-muted-foreground">
            If left empty, the system will automatically generate a version name (e.g., "Base Device v2")
          </p>
        )}
        {selectedProductType === 'line_extension' && (
          <p className="text-sm text-muted-foreground">
            This will be a new device based on an existing platform
          </p>
        )}
        {selectedProductType === 'variant' && (
          <p className="text-sm text-muted-foreground">
            The full name will be: {devicesInFamily?.find(d => d.id === formData.baseProductId)?.name || 'Base Device'} - {formData.name?.trim() || '<Variant Name>'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFormDataChange({ description: e.target.value })}
          placeholder="Enter device description"
          rows={3}
        />
      </div>

      {/* System Architecture Selector - show for new products */}
      {selectedProductType === 'new_product' && (
        <div className="space-y-2">
          <Label>System Architecture *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onFormDataChange({ systemArchitecture: 'pure_hardware' })}
              className={`flex flex-col items-start gap-1 p-3 rounded-md border transition-all text-left ${
                formData.systemArchitecture === 'pure_hardware'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="font-medium text-sm">No Software Used</span>
              <span className="text-xs text-muted-foreground">Device has no software components</span>
            </button>
            <button
              type="button"
              onClick={() => onFormDataChange({ systemArchitecture: 'hardware_simd' })}
              className={`flex flex-col items-start gap-1 p-3 rounded-md border transition-all text-left ${
                formData.systemArchitecture === 'hardware_simd'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm">SiMD (Software in a Medical Device)</span>
                <HelpTooltip content="Device contains embedded software as a component, but the software itself is not the medical device. This includes firmware, control software, or software embedded in hardware." />
              </div>
              <span className="text-xs text-muted-foreground">Device contains embedded software</span>
            </button>
            <button
              type="button"
              onClick={() => onFormDataChange({ systemArchitecture: 'samd' })}
              className={`flex flex-col items-start gap-1 p-3 rounded-md border transition-all text-left ${
                formData.systemArchitecture === 'samd'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm">Software as a Medical Device (SaMD)</span>
                <HelpTooltip content="Software that is itself a medical device (SaMD) - where the software is intended for medical purposes and functions independently as a medical device." />
              </div>
              <span className="text-xs text-muted-foreground">Software functions as the medical device</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            This determines which regulatory requirements apply to your device
          </p>
        </div>
      )}

      {selectedProductType === 'new_product' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="basicUdiDi">Basic UDI-DI</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="z-[9992] max-w-xs text-sm">
                  Optional identifier used to group devices into the same family. Use a temporary key until the official value is available.
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleGenerateTemporaryUdi}
            >
              Generate temporary Basic UDI-DI
            </Button>
          </div>
          <Input
            id="basicUdiDi"
            value={formData.basicUdiDi || ''}
            onChange={(e) => onFormDataChange({ basicUdiDi: e.target.value })}
            placeholder="e.g., tmp-24112025-1234"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck="false"
            data-form-type="other"
          />
          <p className="text-sm text-muted-foreground">
            Provide the official Basic UDI-DI when you have it, or keep using the generated temporary key to connect devices.
          </p>
        </div>
      )}

      {selectedProductType === 'new_product' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="projectStartDate">Project Start Date</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="z-[9992] max-w-xs text-sm">  
                The date when this device/project was officially established or started.
                This will be used to calculate phase timelines from company templates.
              </TooltipContent>
            </Tooltip>
          </div>
          <input
            id="projectStartDate"
            type="date"
            value={formData.projectStartDate ? formData.projectStartDate.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const dateValue = e.target.value ? new Date(e.target.value) : undefined;
              onFormDataChange({ projectStartDate: dateValue });
            }}
            className="w-full border border-foreground/15 rounded-md p-2"
          />
          <p className="text-sm text-muted-foreground">
            Leave empty to use today's date for timeline calculations
          </p>
        </div>
      )}


      {showPlatformSelector && (
        <div className="space-y-2">
          <Label>Device Platform *</Label>
          <ProductPlatformSelector
            companyId={companyId}
            selectedPlatform={formData.productPlatform}
            onPlatformSelect={handlePlatformSelect}
            onBaseProductSelect={handlePlatformCreated}
          />
          <p className="text-sm text-muted-foreground">
            Select an existing platform or create a new one from a base device
          </p>
        </div>
      )}

      {showPlatformBaseProductSelector && (
        <div className="space-y-2">
          <Label>Base Device *</Label>
          <BaseProductSelector
            companyId={companyId}
            selectedProductId={formData.baseProductId}
            onProductSelect={(productId) =>
              onFormDataChange({ baseProductId: productId })
            }
          />
          <p className="text-sm text-muted-foreground">
            Select the base device to create this platform from
          </p>
        </div>
      )}

      {showBaseProductSelector && selectedProductType === 'existing_product' && (
        <div className="space-y-2">
          <Label>Base Device *</Label>
          <BaseProductSelector
            companyId={companyId}
            selectedProductId={formData.baseProductId}
            onProductSelect={(productId) =>
              onFormDataChange({ baseProductId: productId })
            }
          />
          <p className="text-sm text-muted-foreground">
            All device information will be copied from the selected base device
          </p>
        </div>
      )}

      {showBaseProductSelector && selectedProductType === 'variant' && (
        <div className="space-y-2">
          <Label>Base Device *</Label>
          <BaseProductSelector 
            companyId={companyId}
            selectedProductId={formData.baseProductId}
            onProductSelect={(productId) =>
              onFormDataChange({ baseProductId: productId })
            }
          />
          <p className="text-sm text-muted-foreground">
            Select the base device to create a variant from
          </p>
        </div>
      )}

      {selectedProductType === 'variant' && formData.baseProductId && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="tradeName">Trade Name</Label>
            {devicesInFamily && devicesInFamily.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold mb-2 text-muted-foreground">
                    Devices in same family (Basic UDI-DI: {baseProductBasicUdi || 'N/A'})
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    {devicesInFamily.map((device) => (
                      <li key={device.id} className="text-xs">
                        <span className="font-medium">{device.name}</span>
                        {device.version && (
                          <span className="text-muted-foreground ml-1">v{device.version}</span>
                        )}
                        {device.status && (
                          <span className="text-muted-foreground ml-1">• {device.status}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <Input
            id="tradeName"
            value={formData.tradeName || ''}
            onChange={(e) => onFormDataChange({ tradeName: e.target.value })}
            placeholder="Enter trade name"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            data-form-type="other"
          />
          <p className="text-sm text-muted-foreground">
            Trade name for this variant (inherited from base device if not specified)
          </p>
        </div>
      )}

      {showVariantFields && formData.baseProductId && (
        <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
          <Label className="text-base font-medium">Variant Options</Label>
          {dimensionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading dimensions...</p>
          ) : variantDimensions.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">
              <p>No variant dimensions available.{' '}
                <a
                  href="/settings?tab=portfolio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Configure dimensions in Settings →
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {variantDimensions.map((dim) => {
                const options = optionsByDimension[dim.id] || [];
                const selectedOptionId = formData.variantSelections?.[dim.id] || '__none__';

                return (
                  <div key={dim.id} className="flex flex-col gap-2 sm:flex-row sm:items-center" onClick={(e) => e.stopPropagation()}>
                    <Label className="w-32 text-sm">{dim.name}:</Label>
                    <div className="flex flex-1 items-center gap-2">
                      <Select
                        value={selectedOptionId}
                        onValueChange={(value) => {
                          const currentSelections = formData.variantSelections || {};
                          onFormDataChange({
                            variantSelections: {
                              ...currentSelections,
                              [dim.id]: value === '__none__' ? undefined : value
                            }
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={`Select ${dim.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {options.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                        onClick={() => openVariantOptionDialog(dim.id, dim.name)}
                      >
                        Add option
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Select options for each dimension to define this variant
          </p>
        </div>
      )}

      <Dialog open={!!optionDialogState} onOpenChange={(open) => {
        if (!open) {
          closeVariantOptionDialog();
        }
      }}>
        <DialogContent className="z-[9995]">
          <DialogHeader>
            <DialogTitle>
              Add {optionDialogState?.dimensionName} option
            </DialogTitle>
            <DialogDescription>
              Enter the name of the new option to make it available immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="newVariantOption">Option name</Label>
            <Input
              id="newVariantOption"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              placeholder={`e.g. ${optionDialogState?.dimensionName === 'Color' ? 'Green' : 'New option'}`}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeVariantOptionDialog} disabled={isSavingOption}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmAddVariantOption} disabled={isSavingOption}>
              {isSavingOption ? "Adding..." : "Add option"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* {showBaseProductSelector && formData.baseProductId && (
        <div className="space-y-2">
          <Label htmlFor="changeDescription">Change Description</Label>
          <Textarea
            id="changeDescription"
            value={formData.changeDescription || ''}
            onChange={(e) => onFormDataChange({ changeDescription: e.target.value })}
            placeholder="Describe what changes are being made in this device upgrade..."
            rows={3}
          />
          <p className="text-sm text-muted-foreground">
            Describe the specific changes, improvements, or modifications being made
          </p>
        </div>
      )} */}

      {showProjectTypes && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Project Type *</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="z-[9992] max-w-xs text-sm">
                  Select the type of project or activity this device will involve.
              </TooltipContent>
            </Tooltip>
          </div>
          <ProjectTypeSingleSelect
            availableTypes={getAvailableProjectTypes()}
            selectedType={formData.projectType}
            onSelectionChange={(type) =>
              onFormDataChange({ projectType: type })
            }
            tooltips={PROJECT_TYPE_TOOLTIPS}
          />
          <p className="text-sm text-muted-foreground">
            Required for all device types to help with timeline planning
          </p>
        </div>
      )}

      {selectedProductType === 'new_product' && formData.projectType === 'New Product Development (NPD)' && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isBasedonPlatform"
              checked={formData.isBasedonPlatform || false}
              onCheckedChange={(checked) => {
                onFormDataChange({
                  isBasedonPlatform: checked as boolean,
                  productPlatform: checked ? formData.productPlatform : undefined,
                  baseProductId: checked ? formData.baseProductId : null,
                  isPlatformNewlyCreated: checked ? formData.isPlatformNewlyCreated : false
                });
              }}
            />
              <Label htmlFor="isBasedonPlatform" className="flex items-center gap-2">
              Create device based on existing platform
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    Select this option if you want to create a new device that inherits from an existing platform.
                    This will copy platform documents and settings to your new device.
                  </p>
                </TooltipContent>
              </Tooltip>
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Leave unchecked to create a completely new device from scratch
          </p>
        </div>
      )}

      {selectedProductType === 'new_product' && formData.projectType === 'New Product Development (NPD)' && formData.isBasedonPlatform && (
        <div className="space-y-2">
          <Label>Device Platform *</Label>
          <ProductPlatformSelector
            companyId={companyId}
            selectedPlatform={formData.productPlatform}
            onPlatformSelect={(platform) => {
              onFormDataChange({
                productPlatform: platform,
                baseProductId: null, // Reset base product when platform changes
                isPlatformNewlyCreated: false // Selecting existing platform
              });
            }}
            onBaseProductSelect={(platform, baseProductId) => {
              onFormDataChange({
                productPlatform: platform,
                baseProductId: baseProductId,
                isPlatformNewlyCreated: true // Platform was just created
              });
            }}
          />
          <p className="text-sm text-muted-foreground">
            Select an existing platform or create a new one from a base device
          </p>
        </div>
      )}

      {selectedProductType === 'new_product' && formData.projectType === 'New Product Development (NPD)' && formData.isBasedonPlatform && formData.productPlatform && formData.isPlatformNewlyCreated && (
        <div className="space-y-2">
          <Label>Base Device *</Label>
          <BaseProductSelector
            companyId={companyId}
            selectedProductId={formData.baseProductId}
            onProductSelect={(productId) =>
              onFormDataChange({ baseProductId: productId })
            }
          />
          <p className="text-sm text-muted-foreground">
            Select the base device to create this platform from
          </p>
        </div>
      )}

      {/* General Launch Date - Always show for non-variants */}
      {/* {selectedProductType !== 'variant' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="launchDate">
              {selectedProductType === 'legacy_product' ? 'Launch Date *' : 'Estimated Launch Date *'}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  {selectedProductType === 'legacy_product'
                    ? 'The date when this device was originally launched to market.'
                    : 'The estimated date when this device will be launched to market. This helps with project planning and milestone tracking.'
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <input
            id="launchDate"
            type="date"
            value={formData.launchDate ? formData.launchDate.toISOString().split('T')[0] : ''}
            min={
              formData.projectStartDate 
                ? formData.projectStartDate.toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]
            }
            onChange={(e) => {
              const dateValue = e.target.value ? new Date(e.target.value) : undefined;
              // Validate that launch date is not before project start date
              if (dateValue && formData.projectStartDate) {
                if (dateValue < formData.projectStartDate) {
                  toast.error('Launch date cannot be before project start date');
                  return;
                }
              }
              onFormDataChange({ launchDate: dateValue });
            }}
            className="w-full border border-foreground/15 rounded-md p-2"
          />
          <p className="text-sm text-muted-foreground">
            {formData.projectStartDate 
              ? `Launch date must be on or after project start date (${formData.projectStartDate.toISOString().split('T')[0]})`
              : 'Required for all device types to help with timeline planning and used as a fallback if market dates are not provided.'
            }
          </p>
        </div>
      )} */}

      {/* Target Markets - Hide for variants */}
      {selectedProductType !== 'variant' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Target Markets *</Label>
            {isGenesis && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                <Lock className="h-3 w-3" />
                {restrictions.maxMarkets} market limit
              </span>
            )}
          </div>
          <div className="relative z-[10000]">
            {isGenesis ? (
              // Single market selection for Genesis users
              <Select
                value={formData.targetMarkets?.[0] || ''}
                onValueChange={(value) => {
                  const selected = value ? [value] : [];
                  const currentMarketDates = formData.marketLaunchDates || {};
                  const updatedMarketDates: Record<string, Date> = {};
                  selected.forEach(marketCode => {
                    if (currentMarketDates[marketCode]) {
                      updatedMarketDates[marketCode] = currentMarketDates[marketCode];
                    }
                  });

                  const validMarketDates = Object.values(updatedMarketDates).filter(
                    (date): date is Date => date instanceof Date
                  );
                  const earliestMarketDate = validMarketDates.length > 0
                    ? new Date(Math.min(...validMarketDates.map(d => d.getTime())))
                    : undefined;

                  onFormDataChange({
                    targetMarkets: selected,
                    marketLaunchDates: updatedMarketDates,
                    launchDate: earliestMarketDate
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target market..." />
                </SelectTrigger>
                <SelectContent>
                  {marketData.map(market => (
                    <SelectItem key={market.code} value={market.code}>
                      {market.name} ({market.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              // Multi-select for non-Genesis users
              <MultiSelect
                options={marketData.map(market => ({
                  value: market.code,
                  label: `${market.name} (${market.code})`
                }))}
                selected={formData.targetMarkets || []}
                onChange={(selected) => {
                  const currentMarketDates = formData.marketLaunchDates || {};
                  const updatedMarketDates: Record<string, Date> = {};
                  selected.forEach(marketCode => {
                    if (currentMarketDates[marketCode]) {
                      updatedMarketDates[marketCode] = currentMarketDates[marketCode];
                    }
                  });

                  // Update Estimated Launch Date to the earliest market launch date
                  const validMarketDates = Object.values(updatedMarketDates).filter(
                    (date): date is Date => date instanceof Date
                  );
                  const earliestMarketDate = validMarketDates.length > 0
                    ? new Date(Math.min(...validMarketDates.map(d => d.getTime())))
                    : undefined;

                  onFormDataChange({
                    targetMarkets: selected,
                    marketLaunchDates: updatedMarketDates,
                    launchDate: earliestMarketDate
                  });
                }}
                placeholder="Select target markets..."
              />
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {isGenesis
              ? `Genesis plan allows ${restrictions.maxMarkets} target market. Upgrade to Helix OS for multiple markets.`
              : "Select the markets where you plan to launch this device"
            }
          </p>
        </div>
      )}

      {/* Market-specific Launch Dates */}
      {selectedProductType !== 'variant' && formData.targetMarkets && formData.targetMarkets.length > 0 && (
        <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">
            {selectedProductType === 'legacy_product' ? 'Market Launch Dates *' : 'Estimated Market Launch Dates *'}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="z-[9992] max-w-xs text-sm">
                {selectedProductType === 'legacy_product'
                  ? 'Set the actual launch date for each selected market when this device was originally launched.'
                  : 'Set the estimated launch date for each selected market. Each market can have its own launch timeline.'}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-3">
            {formData.targetMarkets.map(marketCode => {
              const market = marketData.find(m => m.code === marketCode);
              const marketName = market?.name || marketCode;
              const marketLaunchDate = formData.marketLaunchDates?.[marketCode];

              return (
                <div key={marketCode} className="space-y-1.5">
                  <Label htmlFor={`launchDate-${marketCode}`} className="text-sm font-medium">
                    {marketName} ({marketCode})
                  </Label>
                  <input
                    id={`launchDate-${marketCode}`}
                    type="date"
                    value={marketLaunchDate ? marketLaunchDate.toISOString().split('T')[0] : ''}
                    min={
                      selectedProductType === 'legacy_product'
                        ? undefined
                        : formData.projectStartDate
                          ? formData.projectStartDate.toISOString().split('T')[0]
                          : new Date().toISOString().split('T')[0]
                    }
                    onChange={(e) => {
                      const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                      // Validate that market launch date is not before project start date (skip for legacy devices)
                      if (dateValue && formData.projectStartDate && selectedProductType !== 'legacy_product') {
                        if (dateValue < formData.projectStartDate) {
                          toast.error(`Launch date for ${marketName} cannot be before project start date`);
                          return;
                        }
                      }
                      const updatedMarketDates = {
                        ...(formData.marketLaunchDates || {}),
                        [marketCode]: dateValue
                      };
                      // Remove undefined dates
                      if (!dateValue) {
                        delete updatedMarketDates[marketCode];
                      }
                      
                      // Update Estimated Launch Date to the earliest market launch date
                      const validMarketDates = Object.values(updatedMarketDates).filter(
                        (date): date is Date => date instanceof Date
                      );
                      const earliestMarketDate = validMarketDates.length > 0
                        ? new Date(Math.min(...validMarketDates.map(d => d.getTime())))
                        : undefined;
                      
                      onFormDataChange({
                        marketLaunchDates: updatedMarketDates,
                        launchDate: earliestMarketDate
                      });
                    }}
                    className="w-full border border-foreground/15 rounded-md p-2 text-sm"
                    required
                  />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Each market requires a launch date. Make sure to provide a date for every selected market to continue.
          </p>
        </div>
      )}
    </div>
  );
}