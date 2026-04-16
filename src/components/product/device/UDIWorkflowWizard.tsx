import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ArrowLeft, Settings, Barcode, Database, Package, FileText, HelpCircle, Info, AlertCircle, CheckCircle, Search, BookOpen, Tag, AlertTriangle, History } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { detectIssuingAgencyFromUDI } from '@/types/issuingAgency';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BasicUDIGenerationWizard } from "./BasicUDIGenerationWizard";
import { UDIGenerationWizard } from "./UDIGenerationWizard";
import { UDIDashboard } from "./UDIDashboard";
import { UDIConfigurationSetup } from "./UDIConfigurationSetup";
import { BasicUDISelector } from "./BasicUDISelector";
import { EUDAMEDLookupDialog } from "./EUDAMEDLookupDialog";
import { UDIPIConfigurationDialog, UDIPIConfig } from "./UDIPIConfigurationDialog";
import { UDIPIConfigurationPage } from "./UDIPIConfigurationPage";
import { DeviceProfile } from "@/utils/udiPiRequirementsEngine";
import { HelpSidebar } from "@/components/help/HelpSidebar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUDIDIVariants } from "@/hooks/useUDIDIVariants";

interface UDIWorkflowWizardProps {
  companyId: string;
  productId?: string;
  productData?: any;
  currentBasicUdiDi?: string;
  onDeviceFound?: (device: any) => void;
  onOrganizationFound?: (orgData: any) => void;
  onStepChange?: (step: WorkflowStep) => void;
  onBasicUdiDiChange?: (value: string) => void;
}

type WorkflowStep = 'selector' | 'basic-udi' | 'product-udi' | 'udi-pi' | 'management' | 'configuration';

interface UDIOption {
  id: WorkflowStep;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  disabled?: boolean;
  requiresProduct?: boolean;
}

export function UDIWorkflowWizard({ 
  companyId, 
  productId, 
  productData,
  currentBasicUdiDi,
  onDeviceFound,
  onOrganizationFound,
  onStepChange,
  onBasicUdiDiChange
}: UDIWorkflowWizardProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('selector');
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [isHelpSidebarOpen, setIsHelpSidebarOpen] = useState(false);
  const [isBasicUDIDialogOpen, setIsBasicUDIDialogOpen] = useState(false);
  const [showUDIPIDialog, setShowUDIPIDialog] = useState(false);
  
  const queryClient = useQueryClient();

  // Get current UDI-PI config from product data
  const currentUdiPiConfig = productData?.udi_pi_config as UDIPIConfig | null;

  // Get product UDI-DI variants to check Step 2 completion
  const { variants: udiDiVariants } = useUDIDIVariants(productId);

  // Field mapping: UDI-PI assessment question names → Device Definition field names
  const UDI_PI_TO_DEVICE_DEFINITION_MAP: Record<string, string> = {
    containsBiologicalMaterial: 'containsHumanAnimalMaterial',
    isCustomFabricated: 'isCustomMade',
    // These fields have same name in both systems
    hasDegradableMaterials: 'hasDegradableMaterials',
    requiresCalibration: 'requiresCalibration',
    hasTimeBasedPerformance: 'hasTimeBasedPerformance',
    hasMultipleComponents: 'hasMultipleComponents',
  };

  // Reverse mapping: Device Definition field names → UDI-PI assessment question names
  const DEVICE_DEFINITION_TO_UDI_PI_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(UDI_PI_TO_DEVICE_DEFINITION_MAP).map(([k, v]) => [v, k])
  );

  // Mutation to save UDI-PI config AND sync assessment answers to device definition
  const saveUdiPiConfigMutation = useMutation({
    mutationFn: async ({ config, assessmentAnswers }: { config: UDIPIConfig; assessmentAnswers?: Record<string, boolean | undefined> }) => {
      if (!productId) throw new Error('Product ID required');
      
      // Build the update object
      const updateData: Record<string, any> = { udi_pi_config: config as any };
      
      // If we have assessment answers, sync them to key_technology_characteristics using mapped field names
      if (assessmentAnswers && Object.keys(assessmentAnswers).length > 0) {
        const currentCharacteristics = productData?.key_technology_characteristics || {};
        const updatedCharacteristics = { ...currentCharacteristics };
        
        // Map assessment answers to Device Definition field names
        for (const [udiPiKey, value] of Object.entries(assessmentAnswers)) {
          if (value !== undefined) {
            // Use mapped field name if available, otherwise use original key
            const deviceDefKey = UDI_PI_TO_DEVICE_DEFINITION_MAP[udiPiKey] || udiPiKey;
            updatedCharacteristics[deviceDefKey] = value;
          }
        }
        
        updateData.key_technology_characteristics = updatedCharacteristics;
      }
      
      const { error } = await supabase
        .from('products')
        .update(updateData as any)
        .eq('id', productId);
      
      if (error) throw error;
      return config;
    },
    onSuccess: () => {
      // Close dialog first to prevent flicker during refetch
      setShowUDIPIDialog(false);
      toast.success('UDI-PI configuration saved');
      // Invalidate after dialog is closed
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['product', productId] });
      }, 100);
    },
    onError: (error) => {
      console.error('Failed to save UDI-PI config:', error);
      toast.error('Failed to save configuration');
    },
  });

  // Notify parent of step changes
  const handleStepChange = (step: WorkflowStep) => {
    setCurrentStep(step);
    onStepChange?.(step);
  };

// Workflow steps (sequential)
  const workflowSteps: UDIOption[] = [
    {
      id: 'basic-udi',
      title: 'Create Basic UDI-DI',
      description: 'Generate regulatory grouping codes for device families (required for EU MDR compliance and FDA registration)',
      icon: <FileText className="h-6 w-6" />,
      badge: 'Step 1',
    },
    {
      id: 'product-udi',
      title: 'Generate Product UDI-DI',
      description: 'Create labeling codes for specific product packaging levels and commercial distribution',
      icon: <Package className="h-6 w-6" />,
      badge: 'Step 2',
      requiresProduct: true,
      disabled: !productId,
    },
    {
      id: 'udi-pi',
      title: 'Configure UDI-PI',
      description: 'Set up production identifiers (lot/batch, serial, dates) for traceability and compliance',
      icon: <Tag className="h-6 w-6" />,
      badge: 'Step 3',
      requiresProduct: true,
      disabled: !productId,
    },
  ];

  const renderUDIEducationalContent = () => (
    <div className="max-w-md space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">What is UDI?</h3>
        <p className="text-xs text-muted-foreground">
          Unique Device Identification (UDI) is a regulatory requirement for medical devices 
          that provides unique identification and key device information.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <AlertCircle className="h-3 w-3 text-orange-500" />
          Regulatory Requirements
        </h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• EU MDR: Required for all medical devices</p>
          <p>• FDA: Mandatory for Class II & III devices</p>
          <p>• Health Canada: Required for Class II-IV</p>
          <p>• TGA Australia: Required for all classes</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm">UDI Components</h3>
        
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <FileText className="h-3 w-3 text-blue-500 mt-0.5" />
            <div>
              <p className="text-xs font-medium">Basic UDI-DI</p>
              <p className="text-xs text-muted-foreground">
                For regulatory databases (EUDAMED, GUDID). Groups device families 
                with same intended purpose and risk classification.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Package className="h-3 w-3 text-green-500 mt-0.5" />
            <div>
              <p className="text-xs font-medium">Product UDI-DI</p>
              <p className="text-xs text-muted-foreground">
                For device labeling and packaging. Unique for each packaging 
                configuration and commercial presentation.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Info className="h-3 w-3 text-purple-500 mt-0.5" />
            <div>
              <p className="text-xs font-medium">UDI-PI</p>
              <p className="text-xs text-muted-foreground">
                Production identifiers like lot numbers, serial numbers, 
                manufacturing dates, and expiration dates.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <CheckCircle className="h-3 w-3 text-green-500" />
          Issuing Agencies
        </h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• GS1: Global standards (GTIN-14 format)</p>
          <p>• HIBCC: Health Industry Business Communications</p>
          <p>• ICCBBA: International Council for Commonality</p>
        </div>
      </div>

      <div className="pt-2 border-t space-y-2">
        <p className="text-xs text-muted-foreground">
          <strong>Best Practice:</strong> Start with Basic UDI-DI for regulatory 
          compliance, then generate Product UDI-DI for each packaging level.
        </p>
        <Button 
          variant="link" 
          size="sm" 
          className="text-xs text-primary p-0 h-auto"
          onClick={() => setIsHelpSidebarOpen(true)}
        >
          <BookOpen className="h-3 w-3 mr-1" />
          More Help →
        </Button>
      </div>
    </div>
  );

  // Check if we have a valid (non-temporary) Basic UDI-DI
  const hasValidBasicUdiDi = currentBasicUdiDi && !currentBasicUdiDi.startsWith('tmp-');

  // Detect if this is an EUDAMED legacy product that needs MDR transition
  const productLevelUdiDiGlobal = (productData as any)?.udi_di as string | undefined;
  const productLevelBasicUdiDi = (productData as any)?.basic_udi_di as string | undefined;
  const detectedAgency = detectIssuingAgencyFromUDI(productLevelBasicUdiDi || productLevelUdiDiGlobal || currentBasicUdiDi || '');
  const isEudamedLegacy = detectedAgency === 'EUDAMED' && (!!productLevelUdiDiGlobal || !!productLevelBasicUdiDi);
  
  // Check for legacy UDI data (already migrated)
  const legacyUdi = (productData as any)?.key_features?.legacy_udi as {
    basic_udi_di?: string;
    udi_di?: string;
    issuing_agency?: string;
    migrated_at?: string;
  } | undefined;

  const renderStepSelector = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Barcode className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">UDI Management</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Follow the steps below to create and manage your Unique Device Identifiers (UDI).
        </p>
      </div>

      {/* MDD → MDR Transition Banner */}
      {isEudamedLegacy && !legacyUdi && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800 font-semibold">MDD → MDR Transition Required</AlertTitle>
          <AlertDescription className="text-amber-700 space-y-2">
            <p>
              This product's UDI codes are <strong>EUDAMED-allocated</strong> (legacy MDD/AIMDD). 
              Under the <strong>EU MDR</strong>, you must register with an accredited issuing agency 
              (GS1, HIBCC, or ICCBBA) and generate new UDI identifiers.
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="border-amber-400 text-amber-800 hover:bg-amber-100"
              onClick={() => setShowConfigDialog(true)}
            >
              <Settings className="h-4 w-4 mr-1.5" />
              Start MDR Transition
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* UDI Generation Workflow Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">📋 UDI Generation Workflow</span>
          <span className="text-xs text-muted-foreground">Complete steps in order</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {workflowSteps.map((option, index) => {
            const isBasicUdiConfigured = option.id === 'basic-udi' && hasValidBasicUdiDi;
            const productLevelUdiDi = (productData as any)?.udi_di as string | undefined;
            const isProductUdiConfigured = option.id === 'product-udi' && (udiDiVariants.length > 0 || !!productLevelUdiDi);
            const isStep2Ready = option.id === 'product-udi' && hasValidBasicUdiDi;
            const isUdiPiConfigured = option.id === 'udi-pi' && currentUdiPiConfig && Object.values(currentUdiPiConfig).some(c => c.enabled);
            const isStepConfigured = isBasicUdiConfigured || isProductUdiConfigured || isUdiPiConfigured;
            const isEudamedLegacyStep = isStepConfigured && isEudamedLegacy && !legacyUdi && (option.id === 'basic-udi' || option.id === 'product-udi');
            
            return (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] relative ${
                  option.disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${isEudamedLegacyStep ? 'border-amber-400 border-2 bg-amber-50/30' : isStepConfigured ? 'border-green-500 border-2 bg-green-50/30' : ''} ${
                  isStep2Ready && option.id === 'product-udi' ? 'border-primary/50' : ''
                }`}
                onClick={() => {
                  if (option.disabled) return;
                  handleStepChange(option.id);
                }}
              >
                {/* Step Badge */}
                <div className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-semibold ${
                  isEudamedLegacyStep
                    ? 'bg-amber-500 text-white'
                    : isStepConfigured 
                    ? 'bg-green-500 text-white' 
                    : isStep2Ready && option.id === 'product-udi'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {isEudamedLegacyStep ? '⚠ Needs MDR Update' : isStepConfigured ? '✓ Complete' : option.badge}
                </div>
                
                <CardHeader className="text-center space-y-4 pt-8">
                  <div className={`flex items-center justify-center p-3 rounded-full mx-auto w-fit ${
                    isEudamedLegacyStep ? 'bg-amber-100 text-amber-600' : isStepConfigured ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
                  }`}>
                    {isEudamedLegacyStep ? <AlertTriangle className="h-6 w-6" /> : isStepConfigured ? <CheckCircle className="h-6 w-6" /> : option.icon}
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    
                    {/* Show current Basic UDI-DI inside this card */}
                    {option.id === 'basic-udi' && hasValidBasicUdiDi && (
                      <div className={`mt-3 p-2 rounded-lg border ${isEudamedLegacyStep ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex items-center justify-center gap-2">
                          <code className={`font-mono text-sm font-medium ${isEudamedLegacyStep ? 'text-amber-700' : 'text-green-700'}`}>
                            {currentBasicUdiDi}
                          </code>
                        </div>
                        <Badge variant="outline" className={`text-xs mt-1 ${isEudamedLegacyStep ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          From EUDAMED
                        </Badge>
                      </div>
                    )}
                    {/* Legacy (MDD) Basic UDI-DI after transition */}
                    {option.id === 'basic-udi' && legacyUdi?.basic_udi_di && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center justify-center gap-1.5">
                          <History className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">Legacy (MDD)</span>
                        </div>
                        <code className="font-mono text-xs text-muted-foreground">
                          {legacyUdi.basic_udi_di}
                        </code>
                      </div>
                    )}

                    {/* Show generated Product UDI-DI codes inside this card */}
                    {option.id === 'product-udi' && udiDiVariants.length > 0 && (
                      <div className={`mt-3 p-2 rounded-lg border ${isEudamedLegacyStep ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex flex-col items-center gap-1">
                          <code className={`font-mono text-xs font-medium ${isEudamedLegacyStep ? 'text-amber-700' : 'text-green-700'}`}>
                            {udiDiVariants[0].generated_udi_di}
                          </code>
                          {udiDiVariants.length > 1 && (
                            <Badge variant="outline" className={`text-xs ${isEudamedLegacyStep ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                              +{udiDiVariants.length - 1} more variants
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fallback: show product-level UDI-DI from EUDAMED */}
                    {option.id === 'product-udi' && udiDiVariants.length === 0 && productLevelUdiDi && (
                      <div className={`mt-3 p-2 rounded-lg border ${isEudamedLegacyStep ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex flex-col items-center gap-1">
                          <code className={`font-mono text-xs font-medium ${isEudamedLegacyStep ? 'text-amber-700' : 'text-green-700'}`}>
                            {productLevelUdiDi}
                          </code>
                          <Badge variant="outline" className={`text-xs ${isEudamedLegacyStep ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            From EUDAMED
                          </Badge>
                        </div>
                      </div>
                    )}
                    {/* Legacy (MDD) UDI-DI after transition */}
                    {option.id === 'product-udi' && legacyUdi?.udi_di && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center justify-center gap-1.5">
                          <History className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">Legacy (MDD)</span>
                        </div>
                        <code className="font-mono text-xs text-muted-foreground">
                          {legacyUdi.udi_di}
                        </code>
                      </div>
                    )}

                    {/* Show UDI-PI configuration summary */}
                    {option.id === 'udi-pi' && currentUdiPiConfig && (
                      <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {currentUdiPiConfig.lot_batch?.enabled && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Lot/Batch</Badge>
                          )}
                          {currentUdiPiConfig.serial_number?.enabled && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Serial</Badge>
                          )}
                          {currentUdiPiConfig.expiration_date?.enabled && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Exp Date</Badge>
                          )}
                          {currentUdiPiConfig.manufacturing_date?.enabled && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Mfg Date</Badge>
                          )}
                          {currentUdiPiConfig.software_version?.enabled && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Software</Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {option.requiresProduct && !productId && (
                      <div className="flex items-center justify-center gap-1">
                        <Badge variant="outline" className="text-xs text-orange-600">
                          Requires Product
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Product-Specific Feature</p>
                                <p className="text-xs">
                                  This feature requires a specific product to be selected.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Navigate to a specific product page to access this feature.
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    {option.description}
                  </p>
                  {!option.disabled && (
                    <div className="flex items-center justify-center mt-4">
                      <Button variant="ghost" size="sm" className="group">
                        {isStepConfigured ? 'Edit' : 'Configure'}
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* UDI Registry Section - Different visual treatment */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">📊 UDI Registry</span>
        </div>
        
        <div 
          className="flex items-center justify-between p-4 bg-muted/50 border rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
          onClick={() => handleStepChange('management')}
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-background border">
              <Database className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Manage UDI Codes</p>
              <p className="text-sm text-muted-foreground">
                View, edit, and organize all your generated UDI codes
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Open Registry
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-center">
        <Button
          variant="outline"
          onClick={() => setShowConfigDialog(true)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          UDI Configuration Settings
        </Button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic-udi':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Basic UDI-DI Generation</h2>
                <Badge variant="secondary">Regulatory</Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Basic UDI-DI Purpose</p>
                        <p className="text-xs">
                          Used for regulatory database submissions (EUDAMED, GUDID) and groups 
                          device families with identical intended purpose and risk classification.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Required before device registration and market authorization.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-8 w-8"
                  onClick={() => setIsHelpSidebarOpen(true)}
                >
                  <BookOpen className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </Button>
              </div>
              <p className="text-muted-foreground">
                Create Basic UDI-DI codes for regulatory database entries and device family grouping.
                These codes are essential for EU MDR compliance and FDA registration processes.
              </p>
            </div>

            {/* Current Basic UDI-DI - Show if exists */}
            {currentBasicUdiDi && !currentBasicUdiDi.startsWith('tmp-') && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-6">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <code className="font-mono font-medium bg-white px-2 py-0.5 rounded border">
                    {currentBasicUdiDi}
                  </code>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    From EUDAMED
                  </Badge>
                </div>
              </div>
            )}

            {/* Basic UDI-DI Selector - Only show when product is available */}
            {productId && (
              <div className="mb-6">
                <BasicUDISelector
                  companyId={companyId}
                  productId={productId}
                  currentBasicUdiDi={currentBasicUdiDi || productData?.basic_udi_di || ''}
                  onAssigned={(basicUdiDi) => {
                    onBasicUdiDiChange?.(basicUdiDi);
                  }}
                  onCreateNew={() => {
                    setIsBasicUDIDialogOpen(true);
                  }}
                />
              </div>
            )}

            {/* EUDAMED Lookup Option */}
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Search EUDAMED Registry</p>
                    <p className="text-xs text-muted-foreground">
                      Find existing Basic UDI-DI codes from the EU database
                    </p>
                  </div>
                </div>
                <EUDAMEDLookupDialog
                  onDeviceFound={(device) => {
                    if (device.basic_udi_di_code) {
                      toast.success(`Found: ${device.basic_udi_di_code}`);
                    }
                    onDeviceFound?.(device);
                  }}
                  onOrganizationFound={(org) => onOrganizationFound?.(org)}
                />
              </div>
            </div>

            {/* Dialog controlled externally */}
            <BasicUDIGenerationWizard 
              companyId={companyId}
              productId={productId}
              productData={productData}
              externalOpen={isBasicUDIDialogOpen}
              onExternalOpenChange={setIsBasicUDIDialogOpen}
              onSuccess={(basicUdiDi) => {
                onBasicUdiDiChange?.(basicUdiDi);
              }}
            />
          </div>
        );

      case 'product-udi':
        return productId ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Product UDI-DI Generation</h2>
                <Badge variant="secondary">Labeling</Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Product UDI-DI Purpose</p>
                        <p className="text-xs">
                          Used for device labeling and packaging. Each packaging configuration 
                          requires a unique Product UDI-DI for supply chain tracking and labeling.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Required on all device labels and packaging for commercial distribution.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-8 w-8"
                  onClick={() => setIsHelpSidebarOpen(true)}
                >
                  <BookOpen className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </Button>
              </div>
              <p className="text-muted-foreground">
                Generate UDI-DI codes for specific product packaging levels and labeling requirements.
                These codes must appear on all device labels and packaging for commercial distribution.
              </p>
            </div>
            <UDIGenerationWizard
              productId={productId}
              companyId={companyId}
              currentBasicUdiDi={currentBasicUdiDi}
              onClose={() => handleStepChange('selector')}
            />
          </div>
        ) : null;

      case 'udi-pi':
        return productId ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Configure Production Identifiers (UDI-PI)</h2>
                <Badge variant="secondary">Traceability</Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">UDI-PI Purpose</p>
                        <p className="text-xs">
                          Production identifiers (PI) complement the UDI-DI with variable data 
                          like lot/batch numbers, serial numbers, and date codes for full traceability.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Required for lot tracking, recalls, and post-market surveillance.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-muted-foreground">
                Set up production identifiers (lot/batch, serial numbers, dates) for traceability and compliance.
                These identifiers appear alongside the UDI-DI on device labels.
              </p>
            </div>

            {/* Current UDI-PI Summary */}
            {currentUdiPiConfig && Object.values(currentUdiPiConfig).some(c => c.enabled) && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-6">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Current Configuration:</span>
                  <div className="flex flex-wrap gap-1">
                    {currentUdiPiConfig.lot_batch?.enabled && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Lot/Batch</Badge>
                    )}
                    {currentUdiPiConfig.serial_number?.enabled && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Serial</Badge>
                    )}
                    {currentUdiPiConfig.expiration_date?.enabled && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Exp Date</Badge>
                    )}
                    {currentUdiPiConfig.manufacturing_date?.enabled && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Mfg Date</Badge>
                    )}
                    {currentUdiPiConfig.software_version?.enabled && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Software</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            <UDIPIConfigurationPage
              companyId={companyId}
              productId={productId}
              productData={productData}
              currentConfig={currentUdiPiConfig}
              onSave={(config, assessmentAnswers) => saveUdiPiConfigMutation.mutate({ config, assessmentAnswers })}
            />
          </div>
        ) : null;

      case 'management':
        return (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">UDI Management Dashboard</h2>
                <Badge variant="secondary">Management</Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">UDI Management Features</p>
                        <p className="text-xs">
                          Centralized dashboard to view, edit, and organize all your UDI codes.
                          Track compliance status and manage regulatory submissions.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Essential for maintaining regulatory compliance and audit readiness.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-muted-foreground">
                View, organize, and manage all your generated UDI codes in one place.
                Monitor compliance status and prepare for regulatory submissions.
              </p>
            </div>
            <UDIDashboard companyId={companyId} />
          </div>
        );

      default:
        return renderStepSelector();
    }
  };

  const renderBackButton = () => {
    if (currentStep === 'selector') return null;

    return (
      <Button
        variant="outline"
        onClick={() => handleStepChange('selector')}
        className="flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Overview
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {renderBackButton()}
      {renderStepContent()}

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <UDIConfigurationSetup
            companyId={companyId}
            productData={productData}
            onConfigurationComplete={() => setShowConfigDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* UDI-PI Configuration Dialog */}
      <UDIPIConfigurationDialog
        open={showUDIPIDialog}
        onOpenChange={setShowUDIPIDialog}
        currentConfig={currentUdiPiConfig}
        onSave={(config, assessmentAnswers) => saveUdiPiConfigMutation.mutate({ config, assessmentAnswers })}
        deviceProfile={{
          // Use market-specific riskClass (from Regulatory tab) if available, fall back to top-level class
          deviceClass: (() => {
            if (Array.isArray(productData?.markets)) {
              const selectedMarket = productData.markets.find((m: any) => m.selected && m.riskClass);
              if (selectedMarket?.riskClass) return selectedMarket.riskClass;
            }
            return productData?.class;
          })(),
          isImplantable: productData?.key_technology_characteristics?.isImplantable || 
                         productData?.device_type?.toLowerCase()?.includes('implant'),
          isReusable: productData?.key_technology_characteristics?.isReusable,
          isSterile: productData?.key_technology_characteristics?.isDeliveredSterile,
          isSingleUse: productData?.key_technology_characteristics?.isSingleUse || 
                       productData?.device_type?.toLowerCase()?.includes('consumable'),
          hasSoftware: productData?.key_technology_characteristics?.containsSoftware || 
                       productData?.device_type?.toLowerCase()?.includes('software'),
          hasExpirationDate: productData?.key_technology_characteristics?.hasExpirationDate,
          targetMarkets: Array.isArray(productData?.markets) 
            ? productData.markets.filter((m: any) => m.selected).map((m: any) => m.code)
            : [],
          // Pre-fill assessment questions from device definition using mapped field names (bidirectional sync)
          containsBiologicalMaterial: productData?.key_technology_characteristics?.containsHumanAnimalMaterial,
          hasDegradableMaterials: productData?.key_technology_characteristics?.hasDegradableMaterials,
          requiresCalibration: productData?.key_technology_characteristics?.requiresCalibration,
          hasTimeBasedPerformance: productData?.key_technology_characteristics?.hasTimeBasedPerformance,
          isCustomFabricated: productData?.key_technology_characteristics?.isCustomMade,
          hasMultipleComponents: productData?.key_technology_characteristics?.hasMultipleComponents,
        }}
      />

      {/* Help Sidebar */}
      <HelpSidebar 
        open={isHelpSidebarOpen} 
        onOpenChange={setIsHelpSidebarOpen}
        contextTopic="udi"
      />
    </div>
  );
}