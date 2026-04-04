import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, HelpCircle, CheckCircle, AlertCircle, Database, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UDIConfigurationSetup } from "./UDIConfigurationSetup";
import { UDIWorkflowWizard } from "./UDIWorkflowWizard";
import { EUDAMEDLookupDialog } from "./EUDAMEDLookupDialog";
import { useTranslation } from '@/hooks/useTranslation';

import { useUDIConfiguration } from "@/hooks/useUDIConfiguration";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type UDIContext = 'overview' | 'basic-udi' | 'product-udi' | 'management';

interface UDIInformationSectionProps {
  companyId: string;
  productId?: string;
  productData?: any;
  basicUdiDi?: string;
  udiDi?: string;
  udiPi?: string;
  gtin?: string;
  onBasicUdiDiChange?: (value: string) => void;
  onUdiDiChange?: (value: string) => void;
  onUdiPiChange?: (value: string) => void;
  onGtinChange?: (value: string) => void;
  onMarketAuthorizationHolderChange?: (value: string) => void;
  onRegistrationNumberChange?: (value: string) => void;
  isLoading?: boolean;
}

export function UDIInformationSection({
  companyId,
  productId,
  productData,
  basicUdiDi = '',
  udiDi = '',
  udiPi = '',
  gtin = '',
  onBasicUdiDiChange,
  onUdiDiChange,
  onUdiPiChange,
  onGtinChange,
  onMarketAuthorizationHolderChange,
  onRegistrationNumberChange,
  isLoading = false,
}: UDIInformationSectionProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const { configuration, isLoading: isConfigLoading, validateUDICode, getUDIFormatInfo, refetch } = useUDIConfiguration(companyId);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [showTraditionalInputs, setShowTraditionalInputs] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentUdiContext, setCurrentUdiContext] = useState<UDIContext>('overview');

  // Fetch UDI statistics
  const { data: basicUdiCount = 0 } = useQuery({
    queryKey: ['basic-udi-count', companyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('basic_udi_di_groups')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: productUdiCount = 0 } = useQuery({
    queryKey: ['product-udi-count', companyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .not('udi_di', 'is', null);
      if (error) throw error;
      return count || 0;
    },
  });

  // Mutation to import EUDAMED data as a UDI-DI variant (Single Source of Truth)
  // IMPORTANT: This hook must be called before any early returns to follow React's rules of hooks
  const importEudamedVariantMutation = useMutation({
    mutationFn: async (device: any) => {
      if (!productId) throw new Error('Product ID required for EUDAMED import');
      
      const basicUdiDiCode = device.basic_udi_di_code;
      const udiDiCode = device.udi_di;
      
      if (!basicUdiDiCode && !udiDiCode) {
        throw new Error('No UDI codes found in EUDAMED data');
      }

      // Step 1: Find or create Basic UDI-DI group
      let basicUdiDiGroupId: string | null = null;
      
      if (basicUdiDiCode) {
        // Check if group already exists
        const { data: existingGroup } = await supabase
          .from('basic_udi_di_groups')
          .select('id')
          .eq('company_id', companyId)
          .eq('basic_udi_di', basicUdiDiCode)
          .maybeSingle();

        if (existingGroup) {
          basicUdiDiGroupId = existingGroup.id;
        } else {
          // Create new Basic UDI-DI group from EUDAMED data
          const { data: newGroup, error: groupError } = await supabase
            .from('basic_udi_di_groups')
            .insert({
              company_id: companyId,
              basic_udi_di: basicUdiDiCode,
              internal_reference: `EUDAMED-${Date.now()}`,
              issuing_agency: 'GS1', // Default, can be updated later
              company_prefix: basicUdiDiCode.match(/^(\d+)/)?.[1] || '',
              check_character: basicUdiDiCode.slice(-1),
              intended_purpose: device.intended_purpose || null,
              risk_class: device.risk_class || null,
            })
            .select('id')
            .single();

          if (groupError) {
            console.error('Error creating Basic UDI-DI group:', groupError);
            throw groupError;
          }
          basicUdiDiGroupId = newGroup.id;
        }
      }

      // Step 2: Create UDI-DI variant if we have the UDI-DI code and a group
      if (udiDiCode && basicUdiDiGroupId) {
        // Check if variant already exists
        const { data: existingVariant } = await supabase
          .from('product_udi_di_variants')
          .select('id')
          .eq('product_id', productId)
          .eq('generated_udi_di', udiDiCode)
          .maybeSingle();

        if (!existingVariant) {
          // Extract item reference from UDI-DI (typically last few digits before check digit)
          const itemReference = udiDiCode.slice(-5, -1) || '0001';
          
          const { error: variantError } = await supabase
            .from('product_udi_di_variants')
            .insert({
              product_id: productId,
              basic_udi_di_group_id: basicUdiDiGroupId,
              packaging_level: 'each', // Default to "Each" level
              item_reference: itemReference,
              package_level_indicator: 0,
              generated_udi_di: udiDiCode,
            });

          if (variantError) {
            console.error('Error creating UDI-DI variant:', variantError);
            throw variantError;
          }
        }
      }

      return { basicUdiDiGroupId, udiDiCode, basicUdiDiCode };
    },
    onSuccess: (result) => {
      // Invalidate all UDI-related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['product-udi', productId] });
      queryClient.invalidateQueries({ queryKey: ['udi-di-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['basic-udi-count', companyId] });
      queryClient.invalidateQueries({ queryKey: ['product-udi-count', companyId] });
      
      toast.success(lang('deviceIdentification.udi.eudamedImportSuccess'));
    },
    onError: (error) => {
      console.error('EUDAMED import failed:', error);
      toast.error(lang('deviceIdentification.udi.eudamedImportError'));
    },
  });

  const calculateCompletion = () => {
    const fields = [basicUdiDi, udiDi, udiPi, gtin];
    const filledFields = fields.filter(field => field && field.trim().length > 0).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const handleUDIValidation = (field: string, value: string) => {
    if (configuration.isConfigured && value.trim()) {
      const validation = validateUDICode(value);
      setValidationErrors(prev => ({
        ...prev,
        [field]: validation.valid ? '' : validation.error || ''
      }));
    } else {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleUdiDiChange = (value: string) => {
    onUdiDiChange?.(value);
    handleUDIValidation('udiDi', value);
  };

  const handleBasicUdiDiChange = (value: string) => {
    onBasicUdiDiChange?.(value);
    handleUDIValidation('basicUdiDi', value);
  };

  const handleConfigurationComplete = async () => {
    console.log('Configuration completed, refreshing UDI configuration...');
    setSetupCompleted(true);
    await refetch();
    console.log('UDI configuration refreshed, setup completed');
  };

  // Show loading skeleton while configuration is loading to prevent flash
  if (isConfigLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[100px] w-full rounded-lg" />
      </div>
    );
  }

  if (!configuration.isConfigured && !setupCompleted) {
    return (
      <UDIConfigurationSetup 
        companyId={companyId}
        productData={productData}
        onConfigurationComplete={handleConfigurationComplete}
      />
    );
  }


  const handleDeviceFound = (device: any) => {
    // Import EUDAMED data as UDI-DI variant (Single Source of Truth)
    // This replaces the legacy approach of writing to product.udi_di / product.basic_udi_di
    if (productId) {
      importEudamedVariantMutation.mutate(device);
    } else {
      // If no product ID, just notify the user to use UDI Management
      toast.info('Please use UDI Management to import this device after saving the product.');
    }
  };

  const handleOrganizationFound = (orgData: any) => {
    console.log('Organization found:', orgData);
    if (orgData.name && onMarketAuthorizationHolderChange) {
      onMarketAuthorizationHolderChange(orgData.name);
    }
    if (orgData.id_srn && onRegistrationNumberChange) {
      onRegistrationNumberChange(orgData.id_srn);
    }
    toast.success(lang('deviceIdentification.udi.manufacturerPopulated').replace('{name}', orgData.name));
  };

  // Side panel action handlers

  // Side panel action handlers
  const handleSidePanelCreateBasic = () => {
    // Scroll to wizard and trigger basic-udi step
    const wizardElement = document.querySelector('[data-udi-wizard]');
    wizardElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSidePanelGenerateProduct = () => {
    const wizardElement = document.querySelector('[data-udi-wizard]');
    wizardElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSidePanelOpenRegistry = () => {
    const wizardElement = document.querySelector('[data-udi-wizard]');
    wizardElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* UDI Workflow Wizard */}
        <div data-udi-wizard>
          <UDIWorkflowWizard 
            companyId={companyId} 
            productId={productId}
            productData={productData}
            currentBasicUdiDi={basicUdiDi}
            onDeviceFound={handleDeviceFound}
            onOrganizationFound={handleOrganizationFound}
            onBasicUdiDiChange={handleBasicUdiDiChange}
            onStepChange={(step) => {
              // Map wizard steps to side panel context
              const contextMap: Record<string, UDIContext> = {
                'selector': 'overview',
                'basic-udi': 'basic-udi',
                'product-udi': 'product-udi',
                'management': 'management',
                'configuration': 'overview'
              };
              setCurrentUdiContext(contextMap[step] || 'overview');
            }}
          />
        </div>

      {/* Traditional UDI Input Fields - Optional for manual entry */}
      {showTraditionalInputs && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{lang('deviceIdentification.udi.manualEntryTitle')}</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {calculateCompletion()}% {lang('deviceIdentification.udi.completed')}
                </span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${calculateCompletion()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm text-muted-foreground">
              {lang('deviceIdentification.udi.manualEntryDescription')}
            </div>

            {getUDIFormatInfo() && (
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <strong>{lang('deviceIdentification.udi.yourUdiFormat')}:</strong> {getUDIFormatInfo().format} - {getUDIFormatInfo().description}
                  <br />
                  <strong>{lang('deviceIdentification.udi.structure')}:</strong> {getUDIFormatInfo().structure}
                  <br />
                  <strong>{lang('deviceIdentification.udi.example')}:</strong> <code className="bg-blue-100 px-1 rounded">{getUDIFormatInfo().example}</code>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="basic-udi-di">{lang('deviceIdentification.udi.basicUdiDiLabel')}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>{lang('deviceIdentification.udi.basicUdiDiTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    id="basic-udi-di"
                    value={basicUdiDi}
                    onChange={(e) => handleBasicUdiDiChange(e.target.value)}
                    placeholder={getUDIFormatInfo() ? getUDIFormatInfo().example : "e.g., 12345678901234"}
                    className={`pr-8 ${validationErrors?.basicUdiDi ? 'border-red-500' : ''}`}
                  />
                  {isLoading && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                {validationErrors?.basicUdiDi && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.basicUdiDi}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="udi-di">{lang('deviceIdentification.udi.udiDiLabel')}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>{lang('deviceIdentification.udi.udiDiTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    id="udi-di"
                    value={udiDi}
                    onChange={(e) => handleUdiDiChange(e.target.value)}
                    placeholder={getUDIFormatInfo() ? getUDIFormatInfo().example : "e.g., (01)47964367965424"}
                    className={`pr-8 ${validationErrors?.udiDi ? 'border-red-500' : ''}`}
                  />
                  {isLoading && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                {validationErrors?.udiDi && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.udiDi}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="udi-pi">{lang('deviceIdentification.udi.udiPiLabel')}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>{lang('deviceIdentification.udi.udiPiTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    id="udi-pi"
                    value={udiPi}
                    onChange={(e) => onUdiPiChange?.(e.target.value)}
                    placeholder="e.g., (10)ABC123 or (17)230615"
                    className="pr-8"
                  />
                  {isLoading && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="gtin">{lang('deviceIdentification.udi.gtinLabel')}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>{lang('deviceIdentification.udi.gtinTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    id="gtin"
                    value={gtin}
                    onChange={(e) => onGtinChange?.(e.target.value)}
                    placeholder="e.g., 00123456789012"
                    className="pr-8"
                  />
                  {isLoading && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

    </div>
  );
}