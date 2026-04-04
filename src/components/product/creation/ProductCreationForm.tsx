import { supabase } from '@/integrations/supabase/client';
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProductTypeSelector } from "./ProductTypeSelector";
import { ProductFormFields } from "./ProductFormFields";
import { createNewProduct, createLineExtension, createExistingProductVersion, DeviceCreationProgress } from "@/services/projectCreationService.tsx";
import { createProductFromPlatform } from "@/services/platformProductCreationService";
import { toast } from "sonner";
import { PlatformSelector } from "./PlatformSelector";
import { useProductLimits } from "@/hooks/useProductLimits";
import { PlanLimitWarningModal } from "@/components/subscription/PlanLimitWarningModal";
import { ProductUpdateService } from "@/services/productUpdateService";
import { marketData } from "@/utils/marketRiskClassMapping";
import { EnhancedProductMarket } from "@/utils/enhancedMarketRiskClassMapping";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Package, FolderTree, Layers, FileText, Link2, Settings, Lock, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useGenesisRestrictions } from "@/hooks/useGenesisRestrictions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProductCreationFormProps {
  companyId: string;
  onProductCreated: (productId: string, projectId?: string) => void;
  onCancel: () => void;
}

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

export function ProductCreationForm({
  companyId,
  onProductCreated,
  onCancel
}: ProductCreationFormProps) {
  const { lang } = useTranslation();
  const [selectedProductType, setSelectedProductType] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    projectType: '',
    baseProductId: null,
    productPlatform: undefined,
    changeDescription: '',
    projectStartDate: undefined,
    launchDate: undefined,
    isPlatformNewlyCreated: false,
    isBasedonPlatform: false,
    targetMarkets: [],
    marketLaunchDates: {},
    variantSelections: {},
    tradeName: '',
    basicUdiDi: '',
    systemArchitecture: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [creationProgress, setCreationProgress] = useState<DeviceCreationProgress | null>(null);

  const { checkProductLimit, limitCheck, isLoading: limitLoading } = useProductLimits();
  const { isGenesis, deviceLimitReached, restrictions, currentDeviceCount, isLoading: genesisLoading } = useGenesisRestrictions(companyId);

  // Track previous baseProductId to detect when it changes
  const prevBaseProductIdRef = React.useRef<string | null>(null);
  const [lastPopulatedName, setLastPopulatedName] = React.useState<string>('');

  // Fetch base product details when selected for variant
  const { data: baseProductDetails } = useQuery({
    queryKey: ['baseProductDetails', formData.baseProductId],
    queryFn: async () => {
      if (!formData.baseProductId || selectedProductType !== 'variant') return null;
      const { data, error } = await supabase
        .from('products')
        .select('name, trade_name, eudamed_trade_names')
        .eq('id', formData.baseProductId)
        .single();
      if (error) {
        console.error('Error fetching base product details:', error);
        return null;
      }
      return data;
    },
    enabled: !!formData.baseProductId && selectedProductType === 'variant',
  });

  const baseProductTradeNames = useMemo(() => {
    const names = new Set<string>();
    const addFromString = (value?: string | null) => {
      if (!value) return;
      value
        .split(/[,;\n]/)
        .map((v) => v.trim())
        .filter(Boolean)
        .forEach((v) => names.add(v));
    };
    const ingestValue = (value: any) => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (typeof entry === 'string') {
            addFromString(entry);
          } else if (typeof entry === 'object' && entry) {
            ingestValue(entry);
          }
        });
        return;
      }
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          ingestValue(parsed);
          return;
        } catch {
          addFromString(value);
          return;
        }
      }
      if (typeof value === 'object') {
        if (Array.isArray(value.trade_names)) {
          ingestValue(value.trade_names);
        } else if (typeof value.trade_names === 'string') {
          addFromString(value.trade_names);
        } else {
          Object.values(value).forEach(ingestValue);
        }
      }
    };

    ingestValue(baseProductDetails?.trade_name);
    ingestValue(baseProductDetails?.eudamed_trade_names);

    return Array.from(names);
  }, [baseProductDetails]);

  // Auto-populate name and trade name when base product is selected for variant
  // Update when baseProductId changes or when baseProductDetails loads
  useEffect(() => {
    if (selectedProductType === 'variant' && baseProductDetails && formData.baseProductId) {
      const newName = baseProductDetails.name || '';
      const newTradeName = baseProductDetails.trade_name || '';
      
      // Check if baseProductId has changed
      const baseProductIdChanged = prevBaseProductIdRef.current !== formData.baseProductId;
      
      setFormData(prev => {
        // If baseProductId changed, always update the name and trade name
        // Otherwise, only update if fields are empty or match the last populated name
        const shouldUpdateName = baseProductIdChanged || 
                                 !prev.name || 
                                 prev.name === lastPopulatedName;
        
        const shouldUpdateTradeName = baseProductIdChanged || 
                                      !prev.tradeName;
        
        return {
          ...prev,
          name: shouldUpdateName ? newName : prev.name,
          tradeName: shouldUpdateTradeName ? newTradeName : prev.tradeName
        };
      });
      
      // Update tracking
      prevBaseProductIdRef.current = formData.baseProductId;
      setLastPopulatedName(newName);
    }
  }, [baseProductDetails, selectedProductType, formData.baseProductId, lastPopulatedName]);

  const handleProductTypeSelect = (productType: string) => {
    setSelectedProductType(productType);
    // Auto-select project type for line extension
    if (productType === 'line_extension') {
      setFormData(prev => ({ 
        ...prev, 
        projectType: 'Line Extension', 
        baseProductId: null,
        productPlatform: undefined,
        isPlatformNewlyCreated: false
      }));
    } else if (productType === 'existing_product') {
      setFormData(prev => ({ 
        ...prev, 
        projectType: 'Product Improvement / Feature Enhancement', 
        baseProductId: null,
        productPlatform: undefined,
        isPlatformNewlyCreated: false
      }));
    } else if (productType === 'variant') {
      setFormData(prev => ({ 
        ...prev, 
        projectType: '', 
        baseProductId: null,
        productPlatform: undefined,
        isPlatformNewlyCreated: false,
        variantSelections: {},
        name: '',
        tradeName: '',
        basicUdiDi: ''
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        projectType: '', 
        baseProductId: null,
        productPlatform: undefined,
        isPlatformNewlyCreated: false,
        basicUdiDi: productType === 'new_product' ? prev.basicUdiDi : ''
      }));
    }
  };

  const handleFormDataChange = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductType) {
      toast.error('Please select a product type');
      return;
    }

    // Check product limits first (only for new products, line extensions, and legacy products)
    // if (selectedProductType === 'new_product' || selectedProductType === 'line_extension' || selectedProductType === 'legacy_product') {
    //   const limitResult = await checkProductLimit(companyId);
    //   if (limitResult && !limitResult.allowed) {
    //     // setShowLimitWarning(true);
    //     return;
    //   }
    // }

    // Validate based on product type
    if ((selectedProductType === 'new_product' || selectedProductType === 'line_extension' || selectedProductType === 'legacy_product') && !formData.name.trim()) {
      toast.error('Device name is required');
      return;
    }

    if (selectedProductType === 'existing_product' && !formData.baseProductId) {
      toast.error('Please select a base device');
      return;
    }

    if (selectedProductType === 'variant') {
      if (!formData.baseProductId) {
        toast.error('Please select a base device');
        return;
      }
      // Variant dimension selections are optional — variant is linked via parent_product_id
    }

    if (selectedProductType === 'line_extension') {
      if (!formData.productPlatform) {
        toast.error('Please select or create a device platform');
        return;
      }
      // Only require base product if platform was newly created
      if (formData.isPlatformNewlyCreated && !formData.baseProductId) {
        toast.error('Please select a base device for the new platform');
        return;
      }
    }

    if (selectedProductType === 'new_product' && !formData.projectType) {
      toast.error('Please select a project type for new devices');
      return;
    }

    if (selectedProductType === 'new_product' && !formData.systemArchitecture) {
      toast.error('Please select a system architecture');
      return;
    }

    if (selectedProductType === 'new_product' && formData.projectType === 'New Product Development (NPD)' && formData.isBasedonPlatform && !formData.productPlatform) {
      toast.error('Please select or create a device platform');
      return;
    }

    if (selectedProductType === 'new_product' && formData.projectType === 'New Product Development (NPD)' && formData.isBasedonPlatform && formData.isPlatformNewlyCreated && !formData.baseProductId) {
      toast.error('Please select a base device for the new platform');
      return;
    }

    if (selectedProductType === 'existing_product' && !formData.projectType) {
      toast.error('Please select a project type for device upgrades');
      return;
    }

    // Launch date validation (skip for variants)
    if (selectedProductType !== 'variant') {
      // If markets are selected, each market must have a launch date
      if (formData.targetMarkets && formData.targetMarkets.length > 0) {
        const missingDates = formData.targetMarkets.filter(
          marketCode => !formData.marketLaunchDates?.[marketCode]
        );
        if (missingDates.length > 0) {
          const marketNames = missingDates.map(code => {
            const market = marketData.find(m => m.code === code);
            return market?.name || code;
          }).join(', ');
          toast.error(`Please select launch dates for: ${marketNames}`);
          return;
        }
        // Use earliest market launch date as general launch date for product creation
        const marketDates = Object.values(formData.marketLaunchDates || {}).filter(Boolean) as Date[];
        if (marketDates.length > 0) {
          formData.launchDate = new Date(Math.min(...marketDates.map(d => d.getTime())));
        }
      } else {
        // If no markets selected, general launch date is required
        if (!formData.launchDate) {
          const dateLabel = selectedProductType === 'legacy_product' ? 'launch date' : 'estimated launch date';
          toast.error(`Please select ${selectedProductType === 'legacy_product' ? 'a' : 'an'} ${dateLabel}`);
          return;
        }
      }

      // Determine the launch date to use for product creation
      const launchDateToUse = formData.launchDate || 
        (formData.marketLaunchDates && Object.values(formData.marketLaunchDates).length > 0
          ? new Date(Math.min(...Object.values(formData.marketLaunchDates).map(d => d.getTime())))
          : undefined);

      if (!launchDateToUse) {
        toast.error('Please select a launch date');
        return;
      }
    }

    setIsCreating(true);
    setCreationProgress(null);

    try {
      let result;
      const sanitizedBasicUdiDi = formData.basicUdiDi?.trim() || undefined;
      
      // Determine the launch date to use for product creation (skip for variants)
      const launchDateToUse = selectedProductType !== 'variant' ? (
        formData.launchDate || 
        (formData.marketLaunchDates && Object.values(formData.marketLaunchDates).length > 0
          ? new Date(Math.min(...Object.values(formData.marketLaunchDates).map(d => d.getTime())))
          : undefined)
      ) : undefined;
      
      if (selectedProductType === 'new_product') {
        if (formData.isBasedonPlatform && formData.productPlatform) {
          result = await createProductFromPlatform({
            name: formData.name,
            description: formData.description,
            company_id: companyId,
            platform_name: formData.productPlatform,
            project_types: [formData.projectType]
            ,
            basic_udi_di: sanitizedBasicUdiDi
          });
        } else {
          result = await createNewProduct(
            {
              name: formData.name,
              description: formData.description,
              companyId,
              projectTypes: [formData.projectType],
              launchDate: launchDateToUse,
              projectStartDate: formData.projectStartDate,
              productPlatform: formData.productPlatform,
              basicUdiDi: sanitizedBasicUdiDi,
              systemArchitecture: formData.systemArchitecture
            },
            (progress) => setCreationProgress(progress)
          );
        }
      } else if (selectedProductType === 'line_extension') {
        result = await createLineExtension(
          {
            name: formData.name,
            description: formData.description,
            parentProductId: formData.baseProductId || null, // Can be null for existing platforms
            companyId,
            projectTypes: [formData.projectType],
            productPlatform: formData.productPlatform!,
            launchDate: launchDateToUse,
            projectStartDate: formData.projectStartDate
          },
          (progress) => setCreationProgress(progress)
        );
      } else if (selectedProductType === 'existing_product') {
        result = await createExistingProductVersion({
          baseProductId: formData.baseProductId!,
          projectName: formData.name || undefined,
          projectDescription: formData.description,
          projectTypes: [formData.projectType],
          companyId,
          launchDate: launchDateToUse
        });
      } else if (selectedProductType === 'legacy_product') {
        // Create simple legacy product without projects
        const { data: product, error } = await supabase
          .from('products')
          .insert({
            name: formData.name,
            description: formData.description,
            company_id: companyId,
            actual_launch_date: launchDateToUse.toISOString().split('T')[0],
            launch_status: 'launched',
            status: 'approved',
            device_type: 'Legacy Device',
            project_types: ['Legacy Device'],
            basic_udi_di: sanitizedBasicUdiDi || null
          })
          .select('id')
          .single();

        if (error) {
          throw error;
        }

        // Assign to Post-Market Surveillance phase
        const { data: postMarketPhase } = await supabase
          .from('company_chosen_phases')
          .select('company_phases!inner(id, name)')
          .eq('company_id', companyId)
          .eq('position', 11)
          .single();

        if (postMarketPhase?.company_phases) {
          await supabase
            .from('lifecycle_phases')
            .insert({
              product_id: product.id,
              phase_id: postMarketPhase.company_phases.id,
              name: postMarketPhase.company_phases.name,
              is_current_phase: true,
              status: 'In Progress'
            });
          
          await supabase
            .from('products')
            .update({ current_lifecycle_phase: postMarketPhase.company_phases.name })
            .eq('id', product.id);
        }

        result = {
          success: true,
          productId: product.id
        };
      } else if (selectedProductType === 'variant') {
        // Get base product details
        const { data: baseProduct, error: baseProductError } = await supabase
          .from('products')
          .select('id, basic_udi_di, company_id, name, trade_name, model_reference, device_category, status, model_id, project_types, sibling_group_id')
          .eq('id', formData.baseProductId!)
          .single();

        if (baseProductError || !baseProduct) {
          throw new Error('Failed to fetch base product details');
        }

        // Basic UDI-DI is optional — copy if available, otherwise leave null

        // Build variant name - must be unique per company due to DB constraint (company_id, name)
        // Resolve selected option labels for a meaningful suffix
        let optionLabels: string[] = [];
        if (formData.variantSelections && Object.keys(formData.variantSelections).length > 0) {
          const optionIds = Object.values(formData.variantSelections).filter(v => v && v !== '__none__');
          if (optionIds.length > 0) {
            const { data: options } = await (supabase as any)
              .from('variation_dimension_options')
              .select('value')
              .in('id', optionIds);
            optionLabels = (options || []).map((o: any) => o.value);
          }
        }
        const rawName = formData.name.trim();
        let variantName: string;
        if (rawName) {
          // User typed a variant name — compose as "Master - VariantName"
          variantName = `${baseProduct.name} - ${rawName}`;
        } else if (optionLabels.length > 0) {
          variantName = `${baseProduct.name} - ${optionLabels.join(' / ')}`;
        } else {
          // Fallback: count existing variants for sequential naming
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('basic_udi_di', baseProduct.basic_udi_di)
            .eq('is_archived', false);
          const nextNum = (count || 1) + 1;
          variantName = `${baseProduct.name} (Variant ${nextNum})`;
        }
        const variantTradeName = formData.tradeName?.trim() || baseProduct.trade_name || null;
        const projectTypes = Array.isArray(baseProduct.project_types) && baseProduct.project_types.length > 0
          ? baseProduct.project_types
          : ['Variant'];

        // Create new product (sibling) with same basic_udi_di
        const { data: newProduct, error: newProductError } = await supabase
          .from('products')
          .insert({
            company_id: companyId,
            name: variantName,
            trade_name: variantTradeName,
            basic_udi_di: baseProduct.basic_udi_di,
            model_reference: baseProduct.model_reference || null,
            device_category: baseProduct.device_category || null,
            status: baseProduct.status || 'Planning',
            is_archived: false,
            model_id: baseProduct.model_id || null,
            actual_launch_date: null,
            launch_status: 'pre_launch',
            parent_product_id: formData.baseProductId,
            parent_relationship_type: 'variant',
            sibling_group_id: baseProduct.sibling_group_id || null,
            project_types: projectTypes,
            is_variant: true,
          })
          .select('id')
          .single();

        if (newProductError || !newProduct) {
          throw new Error('Failed to create variant product');
        }

        // Flag base device as master (idempotent)
        await supabase
          .from('products')
          .update({ is_master_device: true })
          .eq('id', formData.baseProductId);

        // Create variant record in product_variants table
        const { data: newVariant, error: variantError } = await supabase
          .from('product_variants')
          .insert({
            product_id: newProduct.id,
            name: variantName,
            description: formData.description.trim() || null,
            status: 'active'
          })
          .select('id')
          .single();

        if (variantError) {
          console.error('Error creating product_variants record:', variantError);
          throw new Error(`Failed to create variant record: ${variantError.message}`);
        }

        if (!newVariant || !newVariant.id) {
          throw new Error('Failed to create variant record: No variant ID returned');
        }

        // Set variant options in product_variant_values table
        if (formData.variantSelections && Object.keys(formData.variantSelections).length > 0) {
          const variantValueInserts = [];
          
          for (const [dimensionId, optionId] of Object.entries(formData.variantSelections)) {
            if (optionId && optionId !== '' && optionId !== '__none__') {
              variantValueInserts.push({
                product_variant_id: newVariant.id,
                dimension_id: dimensionId,
                option_id: optionId
              });
            }
          }

          if (variantValueInserts.length > 0) {
            const { error: valueError } = await supabase
              .from('product_variant_values')
              .insert(variantValueInserts);

            if (valueError) {
              console.error('Error inserting variant values:', valueError);
              // Log but don't fail the whole operation - variant record is already created
              toast.warning('Variant created but some option values may not have been saved');
            } else {
              console.log(`Successfully inserted ${variantValueInserts.length} variant option values`);
            }
          }
        }

        result = {
          success: true,
          productId: newProduct.id
        };
      }

      if (result?.success && (result.productId || result.projectId)) {
        const productId = result.productId || '';
        
        // Save target markets if provided
        if (formData.targetMarkets && formData.targetMarkets.length > 0) {
          try {
            const markets: EnhancedProductMarket[] = formData.targetMarkets.map(marketCode => {
              const marketInfo = marketData.find(m => m.code === marketCode);
              const marketLaunchDate = formData.marketLaunchDates?.[marketCode];
              
              return {
                code: marketCode,
                name: marketInfo?.name || marketCode,
                selected: true,
                launchDate: marketLaunchDate || formData.launchDate // Fallback to general launch date if market-specific date not set
              } as EnhancedProductMarket;
            });
            
            await ProductUpdateService.updateProductField(
              productId,
              'markets',
              markets,
              companyId
            );
          } catch (marketError) {
            console.error('Error saving target markets:', marketError);
            // Don't fail product creation if markets fail to save
            toast.warning('Device created but target markets could not be saved');
          }
        }

        // Save system architecture if provided (for new products)
        if (selectedProductType === 'new_product' && formData.systemArchitecture) {
          try {
            const { error: archError } = await supabase
              .from('product_reimbursement_strategy')
              .upsert({
                product_id: productId,
                company_id: companyId,
                user_profile: { system_architecture: formData.systemArchitecture }
              }, { onConflict: 'product_id' });

            if (archError) {
              console.error('Error saving system architecture:', archError);
            }
          } catch (archError) {
            console.error('Error saving system architecture:', archError);
          }
        }
        
        onProductCreated(productId, result.projectId);
        toast.success('Device created successfully');
      } else {
        throw new Error(result?.error || 'Failed to create device');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      const message = error instanceof Error ? error.message : 'Failed to create product';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = () => {
    if (!selectedProductType) return false;
    
    // Validate launch dates (not required for variants)
    if (selectedProductType !== 'variant') {
      // If markets are selected, each market must have a launch date
        if (!formData.targetMarkets || formData.targetMarkets.length === 0) {
          return false;
        }
      if (formData.targetMarkets && formData.targetMarkets.length > 0) {
        const allMarketsHaveDates = formData.targetMarkets.every(
          marketCode => !!formData.marketLaunchDates?.[marketCode]
        );
        if (!allMarketsHaveDates) return false;
      } else {
        // If no markets selected, general launch date is required
        if (!formData.launchDate) return false;
      }
    }
    
    // New product requires name, project type, and system architecture
    if (selectedProductType === 'new_product') {
      const hasRequiredFields = formData.name.trim() && formData.projectType && formData.systemArchitecture;
      if (!hasRequiredFields) return false;
      
      // If platform-based creation is selected and NPD is chosen, platform is required
      if (formData.projectType === 'New Product Development (NPD)' && formData.isBasedonPlatform) {
        if (!formData.productPlatform) return false;
        
        // If platform was newly created, base product is required
        if (formData.isPlatformNewlyCreated && !formData.baseProductId) {
          return false;
        }
      }
      
      return true;
    }
    
    // Product upgrade requires base product and project type
    if (selectedProductType === 'existing_product') {
      return !!formData.baseProductId && !!formData.projectType;
    }
    
    // Line extension requires name and platform
    // Base product only required if platform was newly created
    if (selectedProductType === 'line_extension') {
      const hasRequiredFields = formData.name.trim() && formData.productPlatform;
      if (!hasRequiredFields) return false;
      
      // If platform was newly created, base product is required
      if (formData.isPlatformNewlyCreated) {
        return !!formData.baseProductId;
      }
      
      return true;
    }
    
    // Legacy product only requires name and launch date
    if (selectedProductType === 'legacy_product') {
      return formData.name.trim() && !!formData.launchDate;
    }
    
    // Variant requires base device and name (dimension selections are optional)
    if (selectedProductType === 'variant') {
      return !!formData.baseProductId && !!formData.name.trim();
    }

    return false;
  };

  const getButtonText = () => {
    if (isCreating) return 'Creating...';
    
    switch (selectedProductType) {
      case 'new_product':
        return 'Create New Device';
      case 'existing_product':
        return 'Create Device Upgrade';
      case 'line_extension':
        return 'Create Line Extension';
      case 'legacy_product':
        return 'Create Legacy Device';
      case 'variant':
        return 'Create Variant';
      default:
        return 'Create Device';
    }
  };

  // Show loading while checking Genesis restrictions
  if (genesisLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If Genesis device limit reached, show warning and block creation
  if (isGenesis && deviceLimitReached) {
    return (
      <TooltipProvider>
        <div className="space-y-6">
          <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <Lock className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">Device Limit Reached</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              <p className="mb-2">
                Your Genesis plan allows a maximum of <strong>{restrictions.maxDevices} device</strong>.
                You currently have <strong>{currentDeviceCount} device(s)</strong>.
              </p>
              <p>
                To create more devices, please upgrade to <strong>Helix OS</strong> or higher.
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              {lang('common.cancel')}
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">{lang('deviceCreation.deviceType')}</Label>
          <ProductTypeSelector
            selectedProductType={selectedProductType}
            onProductTypeSelect={handleProductTypeSelect}
            isGenesis={isGenesis}
          />
        </div>


        <ProductFormFields
          selectedProductType={selectedProductType}
          formData={formData}
          companyId={companyId}
          onFormDataChange={handleFormDataChange}
          baseProductTradeNames={baseProductTradeNames}
        />

        {/* Progress Section - Shows during device creation */}
        {isCreating && creationProgress && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  creationProgress.percentage === 100 ? 'bg-green-500/20' : 'bg-primary/10'
                }`}>
                  {creationProgress.percentage === 100 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {creationProgress.percentage === 100 ? 'Device Created!' : 'Creating Device'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {creationProgress.percentage === 100
                    ? `${formData.name} is ready`
                    : `Setting up ${formData.name}...`
                  }
                </p>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold transition-colors duration-300 ${
                  creationProgress.percentage === 100 ? 'text-green-500' : 'text-primary'
                }`}>
                  {creationProgress.percentage}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Progress value={creationProgress.percentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {creationProgress.step === 1 && <Package className="h-3 w-3" />}
                  {creationProgress.step === 2 && <Package className="h-3 w-3" />}
                  {creationProgress.step === 3 && <FileText className="h-3 w-3" />}
                  {creationProgress.step === 4 && <FolderTree className="h-3 w-3" />}
                  {creationProgress.step === 5 && <Layers className="h-3 w-3" />}
                  {creationProgress.step === 6 && <Link2 className="h-3 w-3" />}
                  {creationProgress.step === 7 && <Settings className="h-3 w-3" />}
                  {creationProgress.step === 8 && <CheckCircle2 className="h-3 w-3" />}
                  {creationProgress.stepName}
                </span>
                <span>Step {creationProgress.step} of {creationProgress.totalSteps}</span>
              </div>
            </div>

            {/* Step indicators */}
            <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${creationProgress.totalSteps}, minmax(0, 1fr))` }}>
              {Array.from({ length: creationProgress.totalSteps }, (_, i) => i + 1).map((step) => (
                <div
                  key={step}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    step < creationProgress.step
                      ? 'bg-green-500'
                      : step === creationProgress.step
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isCreating}
          >
            {lang('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isCreating || !isFormValid() || limitLoading}
          >
            {getButtonText()}
          </Button>
        </div>
      </form>

      {/* Plan Limit Warning Modal */}
      {limitCheck && (
        <PlanLimitWarningModal
          open={showLimitWarning}
          onOpenChange={setShowLimitWarning}
          currentPlan={limitCheck.planName}
          currentProductCount={limitCheck.currentCount}
          maxProducts={limitCheck.maxAllowed}
          planName={limitCheck.planName}
        />
      )}
    </TooltipProvider>
  );
}
