import React, { useState, memo, useCallback, useMemo } from 'react';
import { RichTextField } from '@/components/shared/RichTextField';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, X, Link2, Package, Edit, Check, Clock } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { ConditionalDeviceCharacteristics } from './ConditionalDeviceCharacteristics';
import { ProductPlatformSelector } from '../../ProductPlatformSelector';
import { BaseProductSelector } from '../../BaseProductSelector';
import { HelpTooltip } from './HelpTooltip';
import { SoftwareClassificationSection } from './SoftwareClassificationSection';
import { DeviceCharacteristics } from '@/types/client.d';
import { DeviceComponentsSection } from '../DeviceComponentsSection';
import { Device3DModel } from '@/types';
import { detectProductType, type ProductType } from '@/utils/productTypeDetection';
import { markdownToHtml } from '@/utils/markdownToHtml';
import { DeviceCategorySelector } from '../../DeviceCategorySelector';
import { ProductModelSelector } from '../../ProductModelSelector';
import { DeviceMediaUpload } from '../DeviceMediaUpload';
import { Device3DViewer } from '../Device3DViewer';
import { MediaHeader } from '../../MediaHeader';
import { Device3DModelUpload } from '../Device3DModelUpload';
import { CircularProgress } from '@/components/common/CircularProgress';
import { ProductVariationsSection } from './ProductVariationsSection';
import { StorageSterilityHandlingSection } from './StorageSterilityHandlingSection';
import { StorageSterilityHandlingData } from '@/types/storageHandling';
import { FieldSuggestion, productDefinitionAIService } from '@/services/productDefinitionAIService';
import { Sparkles } from 'lucide-react';
import { AISuggestionReviewDialog } from '@/components/product/ai-assistant/AISuggestionReviewDialog';

interface DeviceComponent {
  name: string;
  description: string;
}
interface DeviceOverviewSectionProps {
  productName: string;
  tradeName?: string;
  modelReference?: string;
  deviceType?: string | DeviceCharacteristics;
  deviceCategory?: string;
  description?: string;
  keyFeatures?: string[];
  deviceComponents?: DeviceComponent[];
  images?: string[];
  videos?: string[];
  models3D?: Device3DModel[];
  onProductNameChange: (value: string) => void;
  onTradeNameChange?: (value: string) => void;
  onModelReferenceChange?: (value: string) => void;
  onDeviceTypeChange?: (value: string | DeviceCharacteristics) => void;
  onDeviceCategoryChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
  onKeyFeaturesChange?: (value: string[]) => void;
  onDeviceComponentsChange?: (value: DeviceComponent[]) => void;
  onImagesChange?: (value: string[]) => void;
  onVideosChange?: (value: string[]) => void;
  onModels3DChange?: (value: Device3DModel[]) => void;
  primaryRegulatoryType?: string;
  coreDeviceNature?: string;
  isActiveDevice?: boolean;
  keyTechnologyCharacteristics?: DeviceCharacteristics;
  onPrimaryRegulatoryTypeChange?: (value: string) => void;
  onCoreDeviceNatureChange?: (value: string) => void;
  onIsActiveDeviceChange?: (value: boolean) => void;
  onKeyTechnologyCharacteristicsChange?: (value: DeviceCharacteristics) => void;
  isLoading?: boolean;
  progress?: number;
  // Product type detection props
  project_types?: string[];
  is_line_extension?: boolean;
  parent_product_id?: string;
  base_product_name?: string;
  product_platform?: string;
  hasLineExtensions?: boolean;
  hasProductUpgrades?: boolean;
  // Platform editing props
  company_id?: string;
  productId?: string;
  onProductPlatformChange?: (platform: string) => void;
  onBaseProductSelect?: (productId: string) => void;
  onPlatformAndBaseSelect?: (platform: string, baseProductId: string) => void;
  // IVD-specific props
  specimenType?: string;
  testingEnvironment?: string;
  analyticalPerformance?: string[];
  clinicalPerformance?: string[];
  onSpecimenTypeChange?: (value: string) => void;
  onTestingEnvironmentChange?: (value: string) => void;
  onAnalyticalPerformanceChange?: (value: string[]) => void;
  onClinicalPerformanceChange?: (value: string[]) => void;
  // Additional characteristics props
  anatomicalLocation?: string;
  onAnatomicalLocationChange?: (value: string) => void;
  // Additional props
  intendedUse?: string;
  // EMDN props
  emdnCategoryId?: string;
  emdnCode?: string;
  emdnDescription?: string;
  onEmdnChange?: (categoryId: string, code: string, description: string) => void;
  // Storage & Handling props
  storageSterilityHandling?: StorageSterilityHandlingData;
  onStorageSterilityHandlingChange?: (data: StorageSterilityHandlingData) => void;
  // UDI-DI props  
  udiDi?: string;
  basicUdiDi?: string;
  onUdiDiChange?: (value: string) => void;
  onBasicUdiDiChange?: (value: string) => void;
  // Product data for auto-population
  productData?: any;
  // AI suggestions props
  aiSuggestions?: FieldSuggestion[];
  onAcceptAISuggestion?: (fieldType: string, suggestion: string) => void;
}
function DeviceOverviewSectionComponent({
  productName,
  tradeName,
  modelReference,
  deviceType,
  deviceCategory,
  description,
  keyFeatures = [],
  deviceComponents = [],
  images = [],
  videos = [],
  models3D = [],
  onProductNameChange,
  onTradeNameChange,
  onModelReferenceChange,
  onDeviceTypeChange,
  onDeviceCategoryChange,
  onDescriptionChange,
  onKeyFeaturesChange,
  onDeviceComponentsChange,
  onImagesChange,
  onVideosChange,
  onModels3DChange,
  primaryRegulatoryType,
  coreDeviceNature,
  isActiveDevice,
  keyTechnologyCharacteristics = {},
  onPrimaryRegulatoryTypeChange,
  onCoreDeviceNatureChange,
  onIsActiveDeviceChange,
  onKeyTechnologyCharacteristicsChange,
  isLoading = false,
  progress = 0,
  // Product type detection props
  project_types,
  is_line_extension,
  parent_product_id,
  base_product_name,
  product_platform,
  hasLineExtensions,
  hasProductUpgrades,
  // Platform editing props
  company_id,
  productId,
  onProductPlatformChange,
  onBaseProductSelect,
  onPlatformAndBaseSelect,
  // IVD-specific props
  specimenType,
  testingEnvironment,
  analyticalPerformance,
  clinicalPerformance,
  onSpecimenTypeChange,
  onTestingEnvironmentChange,
  onAnalyticalPerformanceChange,
  onClinicalPerformanceChange,
  // Additional characteristics props
  anatomicalLocation = '',
  onAnatomicalLocationChange,
  // Additional props
  intendedUse,
  // EMDN props
  emdnCategoryId,
  emdnCode,
  emdnDescription,
  onEmdnChange,
  // Storage & Handling props
  storageSterilityHandling,
  onStorageSterilityHandlingChange,
  // UDI-DI props
  udiDi,
  basicUdiDi,
  onUdiDiChange,
  onBasicUdiDiChange,
  // Product data for auto-population
  productData,
  // AI suggestions props
  aiSuggestions = [],
  onAcceptAISuggestion
}: DeviceOverviewSectionProps) {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const navigate = useNavigate();
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share' || returnTo === 'gap-analysis';

  // Debug EMDN props
  React.useEffect(() => {
    console.log('🔧 DeviceOverviewSection EMDN Debug:', {
      emdnCategoryId,
      emdnCode,
      emdnDescription,
      hasProductData: !!productData,
      productDataKeys: productData ? Object.keys(productData) : []
    });
  }, [emdnCategoryId, emdnCode, emdnDescription, productData]);
  
  const handleImageSelect = (imageUrl: string) => {
    console.log('🔄 [DeviceOverviewSection] handleImageSelect called with URL:', imageUrl);
    console.log('🔄 [DeviceOverviewSection] Current images array:', images);
    console.log('🔄 [DeviceOverviewSection] onImagesChange function:', typeof onImagesChange);
    
    if (onImagesChange) {
      const newImages = [...(images || []), imageUrl];
      console.log('🔄 [DeviceOverviewSection] New images array:', newImages);
      onImagesChange(newImages);
      console.log('🔄 [DeviceOverviewSection] onImagesChange called successfully');
    } else {
      console.error('❌ [DeviceOverviewSection] onImagesChange is not available');
    }
  };

  // Fetch company data for Google search
  const { data: companyData } = useQuery<{ name?: string }>({
    queryKey: ['company', company_id],
    queryFn: async () => {
      if (!company_id) return {};
      
      const { data, error } = await supabase
        .from('companies')
        .select('name')
        .eq('id', company_id)
        .single();
      
      if (error) {
        console.error('Error fetching company data:', error);
        return {};
      }
      
      return data || {};
    },
    enabled: !!company_id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Local state for managing new entries
  
  const [isEditingBaseProduct, setIsEditingBaseProduct] = useState(false);

  // Local state for SaMD and SiMD checkboxes with optimistic updates
  const [localKeyTechnologyCharacteristics, setLocalKeyTechnologyCharacteristics] = useState<DeviceCharacteristics>(keyTechnologyCharacteristics || {});

  // Local state to track which specific field is being saved
  const [savingField, setSavingField] = useState<string | null>(null);

  // AI loading states
  const [aiLoadingStates, setAiLoadingStates] = useState<Set<string>>(new Set());
  const [activeAiButton, setActiveAiButton] = useState<string | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState<{
    fieldLabel: string;
    fieldKey: string;
    original: string;
    suggested: string;
  } | null>(null);

  // Sync local state with props when they change from external sources
  React.useEffect(() => {
    setLocalKeyTechnologyCharacteristics(keyTechnologyCharacteristics || {});
  }, [keyTechnologyCharacteristics]);


  // Detect product type
  const productType = detectProductType({
    project_types,
    is_line_extension,
    parent_product_id
  });

  // Memoize device type parsing to prevent recalculation
  const deviceCharacteristics = useMemo((): DeviceCharacteristics => {
    if (!deviceType) {
      return {};
    }
    if (typeof deviceType === 'object') {
      return deviceType as DeviceCharacteristics;
    }

    // Try to parse string as JSON
    try {
      const parsed = JSON.parse(deviceType as string);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    } catch (e) {
      console.log('Device type is not a valid JSON string:', deviceType);
    }

    // If the device type is a string but not a JSON string, it's from the old dropdown
    if (typeof deviceType === 'string') {
      const typeString = deviceType as string;
      return {
        isImplantable: typeString === 'Implantable',
        isActive: typeString === 'Active',
        isNonInvasive: typeString === 'Non-invasive',
        isInVitroDiagnostic: typeString === 'In Vitro Diagnostic',
        isSoftwareMobileApp: typeString === 'Software'
      };
    }
    return {};
  }, [deviceType]);

  // Stable input change handlers
  const handleProductNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onProductNameChange(e.target.value);
  }, [onProductNameChange]);
  
  const handleTradeNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onTradeNameChange?.(e.target.value);
  }, [onTradeNameChange]);
  const handleModelReferenceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onModelReferenceChange?.(e.target.value);
  }, [onModelReferenceChange]);
  const handleDeviceCategoryChange = useCallback((value: string) => {
    onDeviceCategoryChange?.(value);
  }, [onDeviceCategoryChange]);
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onDescriptionChange?.(e.target.value);
  }, [onDescriptionChange]);

  // Handle device characteristics change with stable reference
  const handleDeviceCharacteristicsChange = useCallback((characteristics: DeviceCharacteristics) => {
    onDeviceTypeChange?.(characteristics);
  }, [onDeviceTypeChange]);



  // Helper functions for device indicator display
  const getBaseProductDisplay = (): string => {
    switch (productType) {
      case 'new_product':
      case 'line_extension':
        return 'N/A';
      case 'existing_product':
        return base_product_name || 'Not specified';
      default:
        return 'N/A';
    }
  };
  const getProductPlatformDisplay = (): string => {
    switch (productType) {
      case 'new_product':
        if (hasLineExtensions) {
          return product_platform ? `${product_platform} (Original)` : 'Required (used as platform)';
        }
        return product_platform || 'N/A';
      case 'line_extension':
        return product_platform || 'Not specified';
      case 'legacy_product':
        return product_platform || 'Not specified';
      case 'existing_product':
        return 'N/A';
      default:
        return 'N/A';
    }
  };
  const handleBaseProductEdit = () => {
    setIsEditingBaseProduct(true);
  };

  // Help tooltip definitions
  const tooltipDefinitions = {
    'device-category': 'High-level device group for internal organization. Select the category that best describes your device type to help organize your product portfolio.',
    'medical-device': 'A medical device as defined under the Medical Device Regulation (MDR 2017/745) for products intended for human use.',
    'ivd': 'An in vitro diagnostic medical device as defined under the In Vitro Diagnostic Regulation (IVDR 2017/746) for diagnostic testing performed outside the human body.',
    'system-procedure-pack': 'A combination of devices which are packaged together and placed on the market with the purpose of being used for a specific medical purpose.',
    'non-invasive': 'A device that does not penetrate the body through any orifice or surface.',
    'invasive': 'A device that penetrates the body through a natural orifice (e.g., mouth, nose) or the surface of the eye.',
    'surgically-invasive': 'A device that penetrates the body through a surgical procedure or incision.',
    'implantable': 'A device intended to be surgically introduced and remain in the body for 30 days or more.',
    'isActive': 'The device depends on a source of energy, like electricity, to function. This does not include energy generated by the human body or gravity.',
    'isSoftwareAsaMedicalDevice': 'Software that is itself a medical device (SaMD) - where the software is intended for medical purposes and functions independently as a medical device.',
    'isSoftwareMobileApp': 'Device contains embedded software as a component, but the software itself is not the medical device. This includes firmware, control software, or software embedded in hardware.',
    'isIntendedToBeSterile': 'The device is supplied in a sterile state and is intended to be used without prior sterilization by the user.',
    'hasMeasuringFunction': 'The device is intended to measure a physiological or anatomical parameter quantitatively (e.g., a thermometer, blood pressure monitor).',
    'incorporatesMedicinalSubstance': 'The device includes a drug that has an ancillary (secondary) action to the main function of the device.',
    'containsHumanAnimalMaterial': 'The device is manufactured using non-viable tissues, cells, or their derivatives of human or animal origin.',
    'isSingleUse': 'The device is intended to be used on an individual patient during a single procedure and then disposed of.',
    'isReusable': 'The device is intended to be reprocessed (e.g., cleaned, disinfected, sterilized) between uses on different patients.',
    'isCustomMade': 'The device is made in accordance with a written prescription from an authorized person for the sole use of a particular patient.',
    'isAccessoryToMedicalDevice': 'An article which, whilst not being a medical device itself, is intended by its manufacturer to be used together with one or more particular medical devices.'
  };

  // Handle checkbox changes for key technology characteristics with optimistic updates
  const handleCharacteristicChange = useCallback((key: keyof DeviceCharacteristics, checked: boolean) => {
    console.log('🔧 handleCharacteristicChange called:', {
      key,
      checked,
      hasCallback: !!onKeyTechnologyCharacteristicsChange
    });
    console.log('🔧 Current keyTechnologyCharacteristics:', keyTechnologyCharacteristics);
    console.log('🔧 Current localKeyTechnologyCharacteristics:', localKeyTechnologyCharacteristics);

    // Set loading state for this specific field
    setSavingField(key);

    // Optimistic update - update local state immediately for visual feedback
    const newLocalCharacteristics = {
      ...localKeyTechnologyCharacteristics,
      [key]: checked
    };

    // Handle mutual exclusivity for all three software options
    if (key === 'isSoftwareAsaMedicalDevice' && checked) {
      newLocalCharacteristics.isSoftwareMobileApp = false;
      newLocalCharacteristics.noSoftware = false;
    } else if (key === 'isSoftwareMobileApp' && checked) {
      newLocalCharacteristics.isSoftwareAsaMedicalDevice = false;
      newLocalCharacteristics.noSoftware = false;
    } else if (key === 'noSoftware' && checked) {
      newLocalCharacteristics.isSoftwareAsaMedicalDevice = false;
      newLocalCharacteristics.isSoftwareMobileApp = false;
    }

    // Handle mutual exclusivity for reusable/single-use
    if (key === 'isReusable' && checked) {
      newLocalCharacteristics.isSingleUse = false;
    } else if (key === 'isSingleUse' && checked) {
      newLocalCharacteristics.isReusable = false;
    }
    console.log('🔧 Setting local state to:', newLocalCharacteristics);
    setLocalKeyTechnologyCharacteristics(newLocalCharacteristics);
    if (!onKeyTechnologyCharacteristicsChange) {
      console.error('❌ onKeyTechnologyCharacteristicsChange is not defined!');
      setSavingField(null); // Clear loading state on error
      return;
    }
    console.log('🔧 Calling onKeyTechnologyCharacteristicsChange with:', newLocalCharacteristics);
    onKeyTechnologyCharacteristicsChange(newLocalCharacteristics);
    
    // Clear loading state after a short delay to show the save completed
    setTimeout(() => {
      setSavingField(null);
    }, 1000);
  }, [localKeyTechnologyCharacteristics, onKeyTechnologyCharacteristicsChange]);

  // Handle string changes for key technology characteristics
  const handleCharacteristicStringChange = useCallback((key: keyof DeviceCharacteristics, value: string) => {
    if (!onKeyTechnologyCharacteristicsChange) return;
    onKeyTechnologyCharacteristicsChange({
      ...keyTechnologyCharacteristics,
      [key]: value
    });
  }, [keyTechnologyCharacteristics, onKeyTechnologyCharacteristicsChange]);

  // Handle number changes for key technology characteristics
  const handleCharacteristicNumberChange = useCallback((key: keyof DeviceCharacteristics, value: number | undefined) => {
    if (!onKeyTechnologyCharacteristicsChange) return;
    onKeyTechnologyCharacteristicsChange({
      ...keyTechnologyCharacteristics,
      [key]: value
    });
  }, [keyTechnologyCharacteristics, onKeyTechnologyCharacteristicsChange]);

  // Helper functions for AI loading states
  const setAiLoading = useCallback((fieldType: string, isLoading: boolean) => {
    setAiLoadingStates(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(fieldType);
        setActiveAiButton(fieldType);
      } else {
        newSet.delete(fieldType);
        setActiveAiButton(currentActive => {
          const shouldClear = currentActive === fieldType;
          return shouldClear ? null : currentActive;
        });
      }
      return newSet;
    });
  }, []);

  const isAiLoading = useCallback((fieldType: string) => {
    return aiLoadingStates.has(fieldType);
  }, [aiLoadingStates]);

  const isAiButtonDisabled = useCallback((fieldType: string) => {
    return activeAiButton !== null && activeAiButton !== fieldType;
  }, [activeAiButton]);

  // Get contextual help text for surface area based on anatomical location
  const getSurfaceAreaHelpText = useCallback((location: string) => {
    const locationSpecificText = {
      'skin_surface': 'The total area of the device touching the skin is a primary input for the toxicological risk assessment. This helps determine potential exposure to substances that may leach from the device.',
      'body_orifices': 'The device\'s surface area in contact with mucosal membranes is essential for calculating exposure. Mucosal surfaces have different absorption characteristics than intact skin.',
      'wounded_skin': 'Critical measurement needed. The compromised skin barrier makes the contact area an even more important parameter for safety assessment as absorption rates are significantly higher.',
      'cardiovascular_system': 'For devices like catheters or stents, the blood-contacting surface area is a key parameter for both biocompatibility and toxicological risk assessment.',
      'central_nervous_system': 'For any device in this highest-risk category (e.g., electrodes, shunts), the surface area is mandatory information due to the critical nature of neural tissue.',
      'circulatory_system': 'Similar to cardiovascular devices, the blood-contacting surface area must be known to assess exposure to potentially harmful substances.',
      'teeth': 'For restorative materials or orthodontic devices with long-term contact, the surface area is needed to assess long-term exposure to leached substances from the device.',
      'oral_cavity': 'This involves contact with mucosal membranes, so the device\'s surface area is required to calculate potential exposure through oral absorption.',
      'ear_canal': 'The surface area of any component residing in the ear canal is needed for the risk assessment, particularly for long-term or implanted devices.',
      'nasal_cavity': 'Nasal mucosa has high absorption potential, making surface area a critical parameter for assessing exposure to device materials.',
      'pharynx': 'Contact with pharyngeal tissues requires surface area measurement due to the absorptive nature of these mucosal surfaces.',
      'lacrimal_duct': 'The surface area contacting tear ducts and surrounding tissues is needed for toxicological assessment of ophthalmic devices.',
      'vagina_cervix': 'Vaginal and cervical tissues have significant absorption capacity, requiring precise surface area measurement for safety assessment.',
      'urethra': 'Urethral contact requires surface area measurement to assess potential absorption and local tissue effects.',
      'rectum': 'Rectal mucosa has high absorption potential, making surface area a critical measurement for safety evaluation.',
      'other': 'The surface area of device contact is needed regardless of the specific location to complete the toxicological risk assessment per ISO 10993-17.'
    };

    const specificText = locationSpecificText[location as keyof typeof locationSpecificText];
    return specificText ? 
      `${specificText} This is a required input for the toxicological risk assessment (ISO 10993-17) to ensure patient safety.` :
      'Provide the total surface area (in cm²) of the device that contacts the body. This is a required input for the toxicological risk assessment (ISO 10993-17) to ensure patient safety.';
  }, []);

  // Handle sterility changes with dependency logic
  const handleSterilityChange = useCallback((key: 'isNonSterile' | 'isDeliveredSterile' | 'canBeSterilized', checked: boolean) => {
    if (!onKeyTechnologyCharacteristicsChange) return;
    
    // Set loading state for this specific field
    setSavingField(key);
    
    if (key === 'isNonSterile' && checked) {
      // If non-sterile is selected, disable and uncheck the other two
      onKeyTechnologyCharacteristicsChange({
        ...keyTechnologyCharacteristics,
        isNonSterile: true,
        isDeliveredSterile: false,
        canBeSterilized: false
      });
    } else if (key === 'isNonSterile' && !checked) {
      // If non-sterile is unchecked, just update that field
      onKeyTechnologyCharacteristicsChange({
        ...keyTechnologyCharacteristics,
        isNonSterile: false
      });
    } else {
      // For other sterility options, update normally
      onKeyTechnologyCharacteristicsChange({
        ...keyTechnologyCharacteristics,
        [key]: checked
      });
    }
    
    // Clear loading state after a short delay
    setTimeout(() => {
      setSavingField(null);
    }, 1000);
  }, [keyTechnologyCharacteristics, onKeyTechnologyCharacteristicsChange]);

  // Calculate category completion
  const getIdentificationCompletion = () => {
    // Core required fields
    const coreFields = [productName?.trim(), modelReference?.trim(), deviceCategory?.trim(), product_platform?.trim()];
    const coreCompleted = coreFields.filter(Boolean).length;
    
    // Optional field (trade name) - worth additional points
    const optionalCompleted = tradeName?.trim() ? 1 : 0;
    
    // Base completion from core fields (80%) + bonus from optional field (20%)
    const baseCompletion = (coreCompleted / coreFields.length) * 80;
    const bonusCompletion = optionalCompleted * 20;
    
    return Math.round(baseCompletion + bonusCompletion);
  };
  const getRegulatoryCompletion = () => {
    const anatomicalLocationValue = keyTechnologyCharacteristics?.anatomicalLocation?.trim() || anatomicalLocation?.trim();
    const fields = [primaryRegulatoryType?.trim(), coreDeviceNature?.trim(), anatomicalLocationValue && anatomicalLocationValue !== 'not_defined' ? anatomicalLocationValue : null, isActiveDevice !== undefined ? 'defined' : null];
    const completed = fields.filter(Boolean).length;
    return Math.round(completed / 4 * 100);
  };
  const getTechnicalCompletion = () => {
    // Count completed categories (6 total): each category gets 1 point when at least 1 option is selected
    const completedCategories = [];

    // 1. Software classification (1 point if EXACTLY ONE software option is selected)
    const softwareOptions = [localKeyTechnologyCharacteristics.isSoftwareAsaMedicalDevice, localKeyTechnologyCharacteristics.isSoftwareMobileApp, localKeyTechnologyCharacteristics.noSoftware];
    const softwareTrueCount = softwareOptions.filter(Boolean).length;
    if (softwareTrueCount === 1) {
      completedCategories.push('software');
    }

    // 2. Key technology characteristics (1 point if at least 1 option is selected)
    const keyTechOptions = [localKeyTechnologyCharacteristics.hasMeasuringFunction, localKeyTechnologyCharacteristics.isReusable, localKeyTechnologyCharacteristics.incorporatesMedicinalSubstance, localKeyTechnologyCharacteristics.containsHumanAnimalMaterial, localKeyTechnologyCharacteristics.isSingleUse, localKeyTechnologyCharacteristics.isCustomMade, localKeyTechnologyCharacteristics.isAccessoryToMedicalDevice];
    if (keyTechOptions.some(Boolean)) {
      completedCategories.push('keyTechnology');
    }

    // 3. Sterility requirements (1 point if EXACTLY ONE sterility option is selected)
    const sterilityOptions = [localKeyTechnologyCharacteristics.isNonSterile, localKeyTechnologyCharacteristics.isDeliveredSterile, localKeyTechnologyCharacteristics.canBeSterilized];
    const sterilityTrueCount = sterilityOptions.filter(Boolean).length;
    if (sterilityTrueCount === 1) {
      completedCategories.push('sterility');
    }

    // 4. Power sources (1 point if at least 1 option is selected)
    const powerOptions = [localKeyTechnologyCharacteristics.isBatteryPowered, localKeyTechnologyCharacteristics.isMainsPowered, localKeyTechnologyCharacteristics.isManualOperation, localKeyTechnologyCharacteristics.isWirelessCharging];
    if (powerOptions.some(Boolean)) {
      completedCategories.push('power');
    }

    // 5. Connectivity (1 point if at least 1 option is selected)
    const connectivityOptions = [localKeyTechnologyCharacteristics.hasBluetooth, localKeyTechnologyCharacteristics.hasWifi, localKeyTechnologyCharacteristics.hasCellular, localKeyTechnologyCharacteristics.hasUsb, localKeyTechnologyCharacteristics.hasNoConnectivity];
    if (connectivityOptions.some(Boolean)) {
      completedCategories.push('connectivity');
    }

    // 6. AI/ML features (1 point if at least 1 option is selected)
    const aiMlOptions = [localKeyTechnologyCharacteristics.hasImageAnalysis, localKeyTechnologyCharacteristics.hasPredictiveAnalytics, localKeyTechnologyCharacteristics.hasNaturalLanguageProcessing, localKeyTechnologyCharacteristics.hasPatternRecognition, localKeyTechnologyCharacteristics.hasNoAiMlFeatures];
    if (aiMlOptions.some(Boolean)) {
      completedCategories.push('aiml');
    }

    // Total possible categories: 6
    const totalCategories = 6;
    return Math.round(completedCategories.length / totalCategories * 100);
  };
  const getProductDefinitionCompletion = () => {
    const hasFeatures = keyFeatures.length > 0;
    const hasComponents = deviceComponents.length > 0;
    const hasDescription = description && description.trim().length > 0;
    const completed = [hasFeatures, hasComponents, hasDescription].filter(Boolean).length;
    return Math.round(completed / 3 * 100);
  };
  const getMediaCompletion = () => {
    let completedItems = 0;
    let totalItems = 3;
    if (images && images.length > 0) completedItems++;
    if (videos && videos.length > 0) completedItems++;
    if (models3D && models3D.length > 0) completedItems++;
    return Math.round(completedItems / totalItems * 100);
  };
  const getTestingCompletion = () => {
    if (primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)') return 100;
    const fields = [specimenType?.trim(), testingEnvironment?.trim()];
    const hasAnalytical = analyticalPerformance && analyticalPerformance.length > 0;
    const hasClinical = clinicalPerformance && clinicalPerformance.length > 0;
    const completed = [...fields.filter(Boolean), hasAnalytical, hasClinical].filter(Boolean).length;
    return Math.round(completed / 4 * 100);
  };

  const getStorageCompletion = () => {
    if (!storageSterilityHandling) return 0;
    
    let completedItems = 0;
    let totalItems = 4; // Basic required fields
    
    // Storage conditions (temperature range)
    if (storageSterilityHandling.storageTemperatureMin !== undefined && 
        storageSterilityHandling.storageTemperatureMax !== undefined) {
      completedItems++;
    }
    
    // Humidity range
    if (storageSterilityHandling.storageHumidityMin !== undefined && 
        storageSterilityHandling.storageHumidityMax !== undefined) {
      completedItems++;
    }
    
    // Shelf life
    if (storageSterilityHandling.shelfLifeValue && storageSterilityHandling.shelfLifeUnit) {
      completedItems++;
    }
    
    // Environmental controls or handling precautions
    if ((storageSterilityHandling.specialEnvironmentalControls && storageSterilityHandling.specialEnvironmentalControls.length > 0) ||
        (storageSterilityHandling.handlingPrecautions && storageSterilityHandling.handlingPrecautions.length > 0)) {
      completedItems++;
    }
    
    return Math.round((completedItems / totalItems) * 100);
  };

  // Calculate overall completion based on visible accordion categories
  const getOverallGeneralCompletion = () => {
    const categories = [
      getIdentificationCompletion(), 
      getRegulatoryCompletion(), 
      getTechnicalCompletion(), 
      getProductDefinitionCompletion(), 
      getMediaCompletion(),
      getStorageCompletion()
    ];

    // Add IVD testing category if applicable
    if (primaryRegulatoryType === 'In Vitro Diagnostic (IVD)') {
      categories.push(getTestingCompletion());
    }
    const total = categories.reduce((sum, completion) => sum + completion, 0);
    return Math.round(total / categories.length);
  };
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>General Information</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CircularProgress percentage={getOverallGeneralCompletion()} size={40} />
              {/* <span>{getOverallGeneralCompletion()}% complete</span> */}
              {/* <div className="w-16 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{
                  width: `${getOverallGeneralCompletion()}%`
                }}></div>
               </div> */}
            </div>
          </div>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" className="w-full space-y-4">

          {/* Category 1: Device Identification */}
          <AccordionItem value="identification" className="border rounded-lg">
            <AccordionTrigger className="hover:no-underline py-4 px-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <span className="font-semibold">Device Identification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getIdentificationCompletion() >= 75 ? "default" : "secondary"} className="text-xs">
                    {getIdentificationCompletion()}%
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t-0 rounded-b-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={isInGenesisFlow ? `p-3 rounded-lg transition-colors ${productName?.trim() ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="product-name">Device Name</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className='hover:bg-transparent'
                      disabled={isAiLoading('product_name') || isAiButtonDisabled('product_name')}
                      onClick={async () => {
                        if (!onAcceptAISuggestion || !company_id || isAiLoading('product_name')) return;
                        setAiLoading('product_name', true);
                        try {
                          const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                            productName || 'Current Medical Device',
                            'Device Name',
                            'Suggest a proper regulatory-compliant device name based on the device category, EMDN code, and description.',
                            productName || '',
                            'product_name',
                            company_id,
                            'Provide a concise, regulatory-compliant medical device name. Do NOT include trade names or marketing language. 1 line maximum.'
                          );
                          if (response.success && response.suggestions?.[0]) {
                            setPendingSuggestion({
                              fieldLabel: 'Device Name',
                              fieldKey: 'product_name',
                              original: productName || '',
                              suggested: markdownToHtml(response.suggestions[0].suggestion),
                            });
                          }
                        } catch (error) {
                          console.error('AI suggestion error:', error);
                        } finally {
                          setAiLoading('product_name', false);
                        }
                      }}
                    >
                      {isAiLoading('product_name') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                    </Button>
                  </div>
                  <Input
                    id="product-name"
                    value={productName}
                    onChange={handleProductNameChange}
                    placeholder="Enter the full name of the device"
                    disabled={isLoading}
                    maxLength={255}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Official name of the medical device</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="trade-name">Trade Name</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className='hover:bg-transparent'
                      disabled={isAiLoading('trade_name') || isAiButtonDisabled('trade_name')}
                      onClick={async () => {
                        if (!onAcceptAISuggestion || !company_id || isAiLoading('trade_name')) return;
                        setAiLoading('trade_name', true);
                        try {
                          const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                            productName || 'Current Medical Device',
                            'Trade Name',
                            'Suggest a commercial/marketing trade name for this medical device.',
                            tradeName || '',
                            'trade_name',
                            company_id,
                            'Provide a catchy, memorable commercial trade name suitable for marketing. 1 line maximum.'
                          );
                          if (response.success && response.suggestions?.[0]) {
                            setPendingSuggestion({
                              fieldLabel: 'Trade Name',
                              fieldKey: 'trade_name',
                              original: tradeName || '',
                              suggested: markdownToHtml(response.suggestions[0].suggestion),
                            });
                          }
                        } catch (error) {
                          console.error('AI suggestion error:', error);
                        } finally {
                          setAiLoading('trade_name', false);
                        }
                      }}
                    >
                      {isAiLoading('trade_name') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                    </Button>
                  </div>
                  <Input 
                    id="trade-name" 
                    value={tradeName || ''} 
                    onChange={handleTradeNameChange} 
                    placeholder="Enter commercial/marketing name" 
                    disabled={isLoading}
                    maxLength={255}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Commercial name used for marketing purposes</p>
                </div>
                
                {/* UDI-DI and Basic UDI-DI - Read-only, managed in Identification tab */}
                {(udiDi || basicUdiDi) && (
                  <div className="col-span-2 p-3 bg-muted/50 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-2">
                      UDI codes are managed in the Identification → UDI Management tab
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {udiDi && (
                        <div>
                          <span className="text-xs font-medium">UDI-DI</span>
                          <p className="text-sm font-mono text-foreground">{udiDi}</p>
                        </div>
                      )}
                      {basicUdiDi && (
                        <div>
                          <span className="text-xs font-medium">Basic UDI-DI</span>
                          <p className="text-sm font-mono text-foreground">{basicUdiDi}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="device-category">Device Category</Label>
                  <DeviceCategorySelector companyId={company_id || ''} value={deviceCategory || ''} onValueChange={handleDeviceCategoryChange} placeholder="Select device category" />
                </div>
                {(productType === 'line_extension' || productType === 'legacy_product') && (
                  <div>
                    <Label className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-purple-600" />
                      Device Family (Device):
                    </Label>
                    <ProductPlatformSelector
                      companyId={company_id!}
                      selectedPlatform={product_platform}
                      onPlatformSelect={(platform) => {
                        onProductPlatformChange?.(platform);
                      }}
                      onBaseProductSelect={(platform, baseProductId) => {
                        onProductPlatformChange?.(platform);
                        onBaseProductSelect?.(baseProductId);
                      }}
                      onPlatformAndBaseSelect={onPlatformAndBaseSelect}
                      currentProductId={productId}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="model-reference">Device Model/Reference</Label>
                  <ProductModelSelector
                    companyId={company_id || ''}
                    value={modelReference || ''}
                    onValueChange={(val) => onModelReferenceChange?.(val)}
                    placeholder="Select or create model/reference"
                    disabled={isLoading}
                  />
                </div>
              </div>


              {/* Embedded Product Variations section */}
              <div id="product-variations" className="mt-4">
                {productId && company_id && <ProductVariationsSection productId={productId} companyId={company_id} />}
              </div>

              {/* Product Type Indicators */}
              {(productType === 'existing_product' || productType === 'line_extension' || productType === 'legacy_product') && <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Product Relationships</h4>
                  
                  {productType === 'existing_product' && <div className="flex items-center gap-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Link2 className="h-4 w-4 text-blue-600" />
                        Base Product:
                      </Label>
                      {isEditingBaseProduct ? <div className="flex-1 flex gap-2">
                         <BaseProductSelector companyId={company_id!} onProductSelect={productId => {
                    onBaseProductSelect?.(productId);
                    setIsEditingBaseProduct(false);
                  }} />
                        </div> : <div className="flex-1 flex gap-2">
                          <Input value={getBaseProductDisplay()} readOnly className="bg-blue-50 text-blue-700" />
                          <Button variant="outline" size="icon" onClick={handleBaseProductEdit} disabled={!company_id}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>}
                    </div>}
                  
                  
                </div>}
            </AccordionContent>
          </AccordionItem>

          {/* Category 2: Regulatory Classification */}
          <AccordionItem value="regulatory" className="border rounded-lg">
            <AccordionTrigger className="hover:no-underline py-4 px-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <span className="font-semibold">Regulatory Classification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getRegulatoryCompletion() >= 75 ? "default" : "secondary"} className="text-xs">
                    {getRegulatoryCompletion()}%
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t-0 rounded-b-lg p-6">
              <div className="space-y-6">
                <div className="flex items-start gap-8">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Primary Regulatory Type</Label>
                    <RadioGroup value={primaryRegulatoryType || ''} onValueChange={onPrimaryRegulatoryTypeChange} disabled={isLoading} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Medical Device (MDR)" id="medical-device" />
                        <Label htmlFor="medical-device" className="flex items-center gap-2">
                          Medical Device
                          <HelpTooltip content={tooltipDefinitions['medical-device']} />
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="In Vitro Diagnostic (IVD)" id="ivd" />
                        <Label htmlFor="ivd" className="flex items-center gap-2">
                          In Vitro Diagnostic Device
                          <HelpTooltip content={tooltipDefinitions['ivd']} />
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium">System or Procedure Pack</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        checked={keyTechnologyCharacteristics?.isSystemOrProcedurePack || false}
                        onCheckedChange={(checked) => handleCharacteristicChange('isSystemOrProcedurePack', checked)}
                        disabled={isLoading}
                      />
                      <Label className="text-sm font-normal text-muted-foreground">
                        {keyTechnologyCharacteristics?.isSystemOrProcedurePack ? 'Yes' : 'No'}
                      </Label>
                      <HelpTooltip content={tooltipDefinitions['system-procedure-pack']} />
                    </div>
                  </div>
                </div>

                {primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)' && <div>
                    <Label className="text-sm font-medium">Core Device Nature</Label>
                    <RadioGroup value={coreDeviceNature || ''} onValueChange={onCoreDeviceNatureChange} disabled={isLoading} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Non-invasive" id="non-invasive" />
                        <Label htmlFor="non-invasive" className="flex items-center gap-2">
                          Non-invasive
                          <HelpTooltip content={tooltipDefinitions['non-invasive']} />
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Invasive" id="invasive" />
                        <Label htmlFor="invasive" className="flex items-center gap-2">
                          Invasive
                          <HelpTooltip content={tooltipDefinitions['invasive']} />
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Surgically invasive" id="surgically-invasive" />
                        <Label htmlFor="surgically-invasive" className="flex items-center gap-2">
                          Surgically invasive
                          <HelpTooltip content={tooltipDefinitions['surgically-invasive']} />
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Implantable" id="implantable" />
                        <Label htmlFor="implantable" className="flex items-center gap-2">
                          Implantable
                          <HelpTooltip content={tooltipDefinitions['implantable']} />
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>}

                 {/* Anatomical Location - Critical for classification */}
                  {/* Anatomical Location — single source of truth lives on the
                      Classification subtab (and is also editable from Technical
                      Specs). Show a read-only summary here with a jump button
                      so there's no second editor that can drift. */}
                  <div>
                    <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
                      <div className="text-sm">
                        <span className="font-medium">Anatomical Location:</span>{' '}
                        <span className="text-muted-foreground">
                          {(() => {
                            const v = keyTechnologyCharacteristics?.anatomicalLocation;
                            const labels: Record<string, string> = {
                              not_defined: 'Not defined',
                              none: 'No direct body contact',
                              skin_surface: 'Skin surface only',
                              body_orifices: 'Body orifices',
                              wounded_skin: 'Wounded or damaged skin',
                              cardiovascular_system: 'Cardiovascular system',
                              central_nervous_system: 'Central nervous system',
                              circulatory_system: 'Circulatory system',
                              teeth: 'Teeth',
                              oral_cavity: 'Oral cavity',
                              ear_canal: 'Ear canal',
                              nasal_cavity: 'Nasal cavity',
                              pharynx: 'Pharynx',
                              lacrimal_duct: 'Lacrimal duct',
                              vagina_cervix: 'Vagina/cervix',
                              urethra: 'Urethra',
                              rectum: 'Rectum',
                              other: 'Other body location',
                            };
                            return v ? (labels[v] ?? v) : 'Not set';
                          })()}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!productId) return;
                          const params = new URLSearchParams();
                          params.set('tab', 'basics');
                          params.set('subtab', 'classification');
                          params.set('highlight', 'anatomical-location-section');
                          if (returnTo) params.set('returnTo', returnTo);
                          navigate(`/app/product/${productId}/device-information?${params.toString()}`);
                        }}
                        disabled={!productId}
                      >
                        Edit on Classification →
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Single source of truth — edit on the Classification subtab
                      or directly on Technical Specs.
                    </p>
                  </div>

                  {/* Surface Area - ISO 10993-17 requirement */}
                  {keyTechnologyCharacteristics?.anatomicalLocation && 
                   keyTechnologyCharacteristics?.anatomicalLocation !== 'not_defined' && 
                   keyTechnologyCharacteristics?.anatomicalLocation !== 'none' && (
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Surface Area (cm²)
                        <HelpTooltip content={getSurfaceAreaHelpText(keyTechnologyCharacteristics?.anatomicalLocation)} />
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter surface area in cm²"
                        value={keyTechnologyCharacteristics?.surfaceArea || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          handleCharacteristicNumberChange('surfaceArea', value);
                        }}
                        disabled={isLoading}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Required for ISO 10993-17 toxicological risk assessment
                      </p>
                    </div>
                  )}

                  {/* Active Device Status */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Active Device
                      <HelpTooltip content="Device depends on a source of energy (like electricity) to function. This does not include energy generated by the human body or gravity." />
                    </Label>
                     <RadioGroup value={isActiveDevice === true ? "active" : isActiveDevice === false ? "non-active" : ""} onValueChange={value => onIsActiveDeviceChange?.(value === "active")} disabled={isLoading}>
                       <div className="flex items-center space-x-2">
                         <RadioGroupItem value="non-active" id="non-active" />
                         <Label htmlFor="non-active">Non-Active Device</Label>
                       </div>
                       <div className="flex items-center space-x-2">
                         <RadioGroupItem value="active" id="active" />
                         <Label htmlFor="active">Active Device</Label>
                       </div>
                     </RadioGroup>
                  </div>
               </div>
             </AccordionContent>
           </AccordionItem>

          {/* Category 3: Technical Specifications */}
          <AccordionItem value="technical" className="border rounded-lg">
            <AccordionTrigger className="hover:no-underline py-4 px-6 bg-gradient-to-r from-stone-50 to-stone-100 rounded-t-lg">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-stone-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                  <span className="font-semibold">Technical Specifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getTechnicalCompletion() >= 75 ? "default" : "secondary"} className="text-xs">
                    {getTechnicalCompletion()}%
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t-0 rounded-b-lg p-6">
              <div className="space-y-6">
                  <SoftwareClassificationSection localKeyTechnologyCharacteristics={localKeyTechnologyCharacteristics} handleCharacteristicChange={handleCharacteristicChange} isLoading={isLoading} primaryRegulatoryType={primaryRegulatoryType} tooltipDefinitions={tooltipDefinitions} />

                  {/* Key Technology Characteristics */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Key Technology Characteristics</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="hasMeasuringFunction" checked={keyTechnologyCharacteristics.hasMeasuringFunction || false} onCheckedChange={checked => handleCharacteristicChange('hasMeasuringFunction', checked as boolean)} disabled={savingField === 'hasMeasuringFunction'} />
                        <Label htmlFor="hasMeasuringFunction" className="flex items-center gap-2">
                          Has Measuring Function
                          <HelpTooltip content={tooltipDefinitions['hasMeasuringFunction']} />
                          {savingField === 'hasMeasuringFunction' && <Loader2 className="h-4 w-4 animate-spin" />}
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox id="isReusable" checked={keyTechnologyCharacteristics.isReusable || false} onCheckedChange={checked => handleCharacteristicChange('isReusable', checked as boolean)} disabled={savingField === 'isReusable'} />
                        <Label htmlFor="isReusable" className="flex items-center gap-2">
                          Is Reusable
                          <HelpTooltip content={tooltipDefinitions['isReusable']} />
                          {savingField === 'isReusable' && <Loader2 className="h-4 w-4 animate-spin" />}
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox id="incorporatesMedicinalSubstance" checked={keyTechnologyCharacteristics.incorporatesMedicinalSubstance || false} onCheckedChange={checked => handleCharacteristicChange('incorporatesMedicinalSubstance', checked as boolean)} disabled={savingField === 'incorporatesMedicinalSubstance'} />
                        <Label htmlFor="incorporatesMedicinalSubstance" className="flex items-center gap-2">
                          Incorporates Medicinal Substance
                          <HelpTooltip content={tooltipDefinitions['incorporatesMedicinalSubstance']} />
                          {savingField === 'incorporatesMedicinalSubstance' && <Loader2 className="h-4 w-4 animate-spin" />}
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox id="containsHumanAnimalMaterial" checked={keyTechnologyCharacteristics.containsHumanAnimalMaterial || false} onCheckedChange={checked => handleCharacteristicChange('containsHumanAnimalMaterial', checked as boolean)} disabled={savingField === 'containsHumanAnimalMaterial'} />
                        <Label htmlFor="containsHumanAnimalMaterial" className="flex items-center gap-2">
                          Contains Human/Animal Material
                          <HelpTooltip content={tooltipDefinitions['containsHumanAnimalMaterial']} />
                          {savingField === 'containsHumanAnimalMaterial' && <Loader2 className="h-4 w-4 animate-spin" />}
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox id="isSingleUse" checked={keyTechnologyCharacteristics.isSingleUse || false} onCheckedChange={checked => handleCharacteristicChange('isSingleUse', checked as boolean)} disabled={savingField === 'isSingleUse'} />
                        <Label htmlFor="isSingleUse" className="flex items-center gap-2">
                          Single-use Device
                          <HelpTooltip content={tooltipDefinitions['isSingleUse']} />
                          {savingField === 'isSingleUse' && <Loader2 className="h-4 w-4 animate-spin" />}
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox id="isCustomMade" checked={keyTechnologyCharacteristics.isCustomMade || false} onCheckedChange={checked => handleCharacteristicChange('isCustomMade', checked as boolean)} disabled={savingField === 'isCustomMade'} />
                        <Label htmlFor="isCustomMade" className="flex items-center gap-2">
                          Custom-made Device
                          <HelpTooltip content={tooltipDefinitions['isCustomMade']} />
                          {savingField === 'isCustomMade' && <Loader2 className="h-4 w-4 animate-spin" />}
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox id="isAccessoryToMedicalDevice" checked={keyTechnologyCharacteristics.isAccessoryToMedicalDevice || false} onCheckedChange={checked => handleCharacteristicChange('isAccessoryToMedicalDevice', checked as boolean)} disabled={savingField === 'isAccessoryToMedicalDevice'} />
                        <Label htmlFor="isAccessoryToMedicalDevice" className="flex items-center gap-2">
                          Accessory to Medical Device
                          <HelpTooltip content={tooltipDefinitions['isAccessoryToMedicalDevice']} />
                          {savingField === 'isAccessoryToMedicalDevice' && <Loader2 className="h-4 w-4 animate-spin" />}
                        </Label>
                      </div>
                   </div>
                 </div>

                   {/* Sterility Requirements */}
                 <div>
                   <Label className="text-sm font-medium mb-3 block">Sterility Requirements</Label>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-center space-x-2">
                       <Checkbox id="isNonSterile" checked={keyTechnologyCharacteristics.isNonSterile || false} onCheckedChange={checked => handleSterilityChange('isNonSterile', checked as boolean)} disabled={savingField === 'isNonSterile'} />
                       <Label htmlFor="isNonSterile" className="flex items-center gap-2">
                         Non-sterile Device
                         <HelpTooltip content="Device does not require sterility and is not intended to be sterile." />
                         {savingField === 'isNonSterile' && <Loader2 className="h-4 w-4 animate-spin" />}
                       </Label>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Checkbox id="isDeliveredSterile" checked={keyTechnologyCharacteristics.isDeliveredSterile || false} onCheckedChange={checked => handleSterilityChange('isDeliveredSterile', checked as boolean)} disabled={savingField === 'isDeliveredSterile' || keyTechnologyCharacteristics.isNonSterile} />
                       <Label htmlFor="isDeliveredSterile" className={`flex items-center gap-2 ${keyTechnologyCharacteristics.isNonSterile ? 'opacity-50' : ''}`}>
                         Delivered Sterile
                         <HelpTooltip content="Device is provided in a sterile state and ready to use without sterilization." />
                         {savingField === 'isDeliveredSterile' && <Loader2 className="h-4 w-4 animate-spin" />}
                       </Label>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Checkbox id="canBeSterilized" checked={keyTechnologyCharacteristics.canBeSterilized || false} onCheckedChange={checked => handleSterilityChange('canBeSterilized', checked as boolean)} disabled={savingField === 'canBeSterilized' || keyTechnologyCharacteristics.isNonSterile} />
                       <Label htmlFor="canBeSterilized" className={`flex items-center gap-2 ${keyTechnologyCharacteristics.isNonSterile ? 'opacity-50' : ''}`}>
                         Can be Sterilized/Re-sterilized
                         <HelpTooltip content="Device can be sterilized or re-sterilized by the user before use." />
                         {savingField === 'canBeSterilized' && <Loader2 className="h-4 w-4 animate-spin" />}
                       </Label>
                     </div>
                   </div>
                 </div>

                {/* Power Source */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Power Source</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="isBatteryPowered" checked={keyTechnologyCharacteristics.isBatteryPowered || false} onCheckedChange={checked => handleCharacteristicChange('isBatteryPowered', checked as boolean)} disabled={savingField === 'isBatteryPowered'} />
                      <Label htmlFor="isBatteryPowered" className="flex items-center gap-2">
                        Battery Powered
                        <HelpTooltip content="Device operates on battery power" />
                        {savingField === 'isBatteryPowered' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="isMainsPowered" checked={keyTechnologyCharacteristics.isMainsPowered || false} onCheckedChange={checked => handleCharacteristicChange('isMainsPowered', checked as boolean)} disabled={savingField === 'isMainsPowered'} />
                      <Label htmlFor="isMainsPowered" className="flex items-center gap-2">
                        Mains Powered
                        <HelpTooltip content="Device connects to electrical mains" />
                        {savingField === 'isMainsPowered' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="isManualOperation" checked={keyTechnologyCharacteristics.isManualOperation || false} onCheckedChange={checked => handleCharacteristicChange('isManualOperation', checked as boolean)} disabled={savingField === 'isManualOperation'} />
                      <Label htmlFor="isManualOperation" className="flex items-center gap-2">
                        Manual Operation
                        <HelpTooltip content="Device requires no external power" />
                        {savingField === 'isManualOperation' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="isWirelessCharging" checked={keyTechnologyCharacteristics.isWirelessCharging || false} onCheckedChange={checked => handleCharacteristicChange('isWirelessCharging', checked as boolean)} disabled={savingField === 'isWirelessCharging'} />
                      <Label htmlFor="isWirelessCharging" className="flex items-center gap-2">
                        Wireless Charging
                        <HelpTooltip content="Device charges wirelessly" />
                        {savingField === 'isWirelessCharging' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Connectivity Features */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Connectivity Features</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hasBluetooth" checked={keyTechnologyCharacteristics.hasBluetooth || false} onCheckedChange={checked => handleCharacteristicChange('hasBluetooth', checked as boolean)} disabled={savingField === 'hasBluetooth'} />
                      <Label htmlFor="hasBluetooth" className="flex items-center gap-2">
                        Bluetooth
                        <HelpTooltip content="Short-range wireless communication" />
                        {savingField === 'hasBluetooth' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hasWifi" checked={keyTechnologyCharacteristics.hasWifi || false} onCheckedChange={checked => handleCharacteristicChange('hasWifi', checked as boolean)} disabled={savingField === 'hasWifi'} />
                      <Label htmlFor="hasWifi" className="flex items-center gap-2">
                        Wi-Fi
                        <HelpTooltip content="Wireless network connectivity" />
                        {savingField === 'hasWifi' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hasCellular" checked={keyTechnologyCharacteristics.hasCellular || false} onCheckedChange={checked => handleCharacteristicChange('hasCellular', checked as boolean)} disabled={savingField === 'hasCellular'} />
                      <Label htmlFor="hasCellular" className="flex items-center gap-2">
                        Cellular
                        <HelpTooltip content="Mobile network connectivity" />
                        {savingField === 'hasCellular' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hasUsb" checked={keyTechnologyCharacteristics.hasUsb || false} onCheckedChange={checked => handleCharacteristicChange('hasUsb', checked as boolean)} disabled={savingField === 'hasUsb'} />
                      <Label htmlFor="hasUsb" className="flex items-center gap-2">
                        USB
                        <HelpTooltip content="Wired USB connection" />
                        {savingField === 'hasUsb' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hasNoConnectivity" checked={keyTechnologyCharacteristics.hasNoConnectivity || false} onCheckedChange={checked => handleCharacteristicChange('hasNoConnectivity', checked as boolean)} disabled={savingField === 'hasNoConnectivity'} />
                      <Label htmlFor="hasNoConnectivity" className="flex items-center gap-2">
                        No Connectivity
                        <HelpTooltip content="Standalone device with no connectivity" />
                        {savingField === 'hasNoConnectivity' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* AI/ML Features */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">AI/ML Features</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hasImageAnalysis" checked={keyTechnologyCharacteristics.hasImageAnalysis || false} onCheckedChange={checked => handleCharacteristicChange('hasImageAnalysis', checked as boolean)} disabled={savingField === 'hasImageAnalysis'} />
                      <Label htmlFor="hasImageAnalysis" className="flex items-center gap-2">
                        Image Analysis
                        <HelpTooltip content="AI/ML for medical image processing" />
                        {savingField === 'hasImageAnalysis' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hasPredictiveAnalytics" checked={keyTechnologyCharacteristics.hasPredictiveAnalytics || false} onCheckedChange={checked => handleCharacteristicChange('hasPredictiveAnalytics', checked as boolean)} disabled={savingField === 'hasPredictiveAnalytics'} />
                      <Label htmlFor="hasPredictiveAnalytics" className="flex items-center gap-2">
                        Predictive Analytics
                        <HelpTooltip content="AI/ML for predicting outcomes" />
                        {savingField === 'hasPredictiveAnalytics' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hasNaturalLanguageProcessing" checked={keyTechnologyCharacteristics.hasNaturalLanguageProcessing || false} onCheckedChange={checked => handleCharacteristicChange('hasNaturalLanguageProcessing', checked as boolean)} disabled={savingField === 'hasNaturalLanguageProcessing'} />
                      <Label htmlFor="hasNaturalLanguageProcessing" className="flex items-center gap-2">
                        Natural Language Processing
                        <HelpTooltip content="AI/ML for text/voice processing" />
                        {savingField === 'hasNaturalLanguageProcessing' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hasPatternRecognition" checked={keyTechnologyCharacteristics.hasPatternRecognition || false} onCheckedChange={checked => handleCharacteristicChange('hasPatternRecognition', checked as boolean)} disabled={savingField === 'hasPatternRecognition'} />
                      <Label htmlFor="hasPatternRecognition" className="flex items-center gap-2">
                        Pattern Recognition
                        <HelpTooltip content="AI/ML for identifying patterns" />
                        {savingField === 'hasPatternRecognition' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hasNoAiMlFeatures" checked={keyTechnologyCharacteristics.hasNoAiMlFeatures || false} onCheckedChange={checked => handleCharacteristicChange('hasNoAiMlFeatures', checked as boolean)} disabled={savingField === 'hasNoAiMlFeatures'} />
                      <Label htmlFor="hasNoAiMlFeatures" className="flex items-center gap-2">
                        No AI/ML Features
                        <HelpTooltip content="Device does not use AI/ML technologies" />
                        {savingField === 'hasNoAiMlFeatures' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Label>
                    </div>
                  </div>
                </div>
               </div>
             </AccordionContent>
           </AccordionItem>

          {/* Category 4: Product Definition */}
          <AccordionItem value="definition" className="border rounded-lg">
            <AccordionTrigger className="hover:no-underline py-4 px-6 bg-gradient-to-r from-zinc-50 to-zinc-100 rounded-t-lg">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                  <span className="font-semibold">Product Definition</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getProductDefinitionCompletion() >= 75 ? "default" : "secondary"} className="text-xs">
                    {getProductDefinitionCompletion()}%
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t-0 rounded-b-lg p-6">
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="description">Device Description</Label>
                    {description && description.trim().length > 0 && (
                      <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className='hover:bg-transparent'
                      disabled={isAiLoading('product_description') || isAiButtonDisabled('product_description')}
                      onClick={async () => {
                        if (!onAcceptAISuggestion || !company_id || isAiLoading('product_description')) return;

                        setAiLoading('product_description', true);
                        try {
                          const response = await productDefinitionAIService.generateConciseFieldSuggestion(
                            productName || 'Current Medical Device',
                            'Device Description',
                            'Provide a comprehensive description of the medical device including its physical characteristics, materials, dimensions, and key functional features.',
                            description || '',
                            'product_description',
                            company_id,
                            'Provide a detailed description focusing on physical characteristics, materials, dimensions, and functional features. Do NOT mention AI, machine learning, artificial intelligence, or any automated/algorithmic features. 2-4 lines maximum.'
                          );

                          if (response.success && response.suggestions?.[0]) {
                            const suggestion = response.suggestions[0].suggestion;
                            setPendingSuggestion({
                              fieldLabel: 'Device Description',
                              fieldKey: 'product_description',
                              original: description || '',
                              suggested: markdownToHtml(suggestion),
                            });
                          }
                        } catch (error) {
                          console.error('AI suggestion error:', error);
                        } finally {
                          setAiLoading('product_description', false);
                        }
                      }}
                    >
                      {isAiLoading('product_description') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                    </Button>
                  </div>
                  <RichTextField value={description || ''} onChange={(html) => onDescriptionChange?.(html)} placeholder="Enter a detailed description of the device..." minHeight="100px" disabled={isLoading} />
                </div>


              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Category 5: Device Media */}
          <AccordionItem value="media" className="border rounded-lg">
            <AccordionTrigger className="hover:no-underline py-4 px-6 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-t-lg">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">5</div>
                  <span className="font-semibold">Product Media</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getMediaCompletion() >= 75 ? "default" : "secondary"} className="text-xs">
                    {getMediaCompletion()}%
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t-0 rounded-b-lg p-6">
              <div className="space-y-6">
                {/* Device Media Upload */}
                <div>
                  <MediaHeader
                    productName={productName || ''}
                    tradeName={tradeName}
                    companyName={companyData?.name}
                    companyId={company_id}
                    onImageSelect={handleImageSelect}
                    onImagesSelect={(imageUrls) => {
                      console.log('🔄 [DeviceOverviewSection] onImagesSelect called with:', imageUrls);
                      if (onImagesChange) {
                        const newImages = [...(images || []), ...imageUrls];
                        console.log('🔄 [DeviceOverviewSection] Adding multiple images, new array:', newImages);
                        onImagesChange(newImages);
                      }
                    }}
                  />
                  <DeviceMediaUpload 
                    images={images || []} 
                    videos={videos || []} 
                    models3D={models3D || []} 
                    onImagesChange={onImagesChange} 
                    onVideosChange={onVideosChange} 
                    onModels3DChange={onModels3DChange} 
                    disabled={isLoading}
                    onImageDeleted={() => {
                       console.log('🔄 [DeviceOverviewSection] Image deleted, refreshing overview tab');
                    }}
                  />
                </div>

                {/* 3D Models Management */}
                {models3D && models3D.length > 0 && <div>
                    <Label className="text-sm font-medium mb-3 block">3D Model Viewer</Label>
                    <Device3DViewer models={models3D} selectedModelIndex={0} onModelSelect={() => {}} />
                  </div>}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Category 6: Storage & Handling (Non-IVD) or Category 7 (IVD) */}
          <AccordionItem value="storage" className="border rounded-lg">
            <AccordionTrigger className="hover:no-underline py-4 px-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' ? '7' : '6'}
                  </div>
                  <span className="font-semibold">Storage & Handling</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStorageCompletion() >= 75 ? "default" : "secondary"} className="text-xs">
                    {getStorageCompletion()}%
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t-0 rounded-b-lg p-6">
              <StorageSterilityHandlingSection
                data={storageSterilityHandling}
                onChange={onStorageSterilityHandlingChange}
                deviceCharacteristics={keyTechnologyCharacteristics}
                isLoading={isLoading}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Category 6: Testing & Performance (IVD Only) */}
          {primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' && <AccordionItem value="testing" className="border rounded-lg">
              <AccordionTrigger className="hover:no-underline py-4 px-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
                <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">6</div>
                  <span className="font-semibold">Testing & Performance</span>
                </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getTestingCompletion() >= 75 ? "default" : "secondary"} className="text-xs">
                      {getTestingCompletion()}%
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t-0 rounded-b-lg p-6">
                <ConditionalDeviceCharacteristics regulatoryType={primaryRegulatoryType} specimenType={specimenType} testingEnvironment={testingEnvironment} analyticalPerformance={analyticalPerformance} clinicalPerformance={clinicalPerformance} onSpecimenTypeChange={onSpecimenTypeChange} onTestingEnvironmentChange={onTestingEnvironmentChange} onAnalyticalPerformanceChange={onAnalyticalPerformanceChange} onClinicalPerformanceChange={onClinicalPerformanceChange} />
              </AccordionContent>
            </AccordionItem>}

        </Accordion>
      </CardContent>

      {/* AI Suggestion Review Dialog */}
      <AISuggestionReviewDialog
        open={pendingSuggestion !== null}
        onOpenChange={(open) => !open && setPendingSuggestion(null)}
        fieldLabel={pendingSuggestion?.fieldLabel || ''}
        originalContent={pendingSuggestion?.original || ''}
        suggestedContent={pendingSuggestion?.suggested || ''}
        onAccept={(content) => {
          if (pendingSuggestion) {
            const key = pendingSuggestion.fieldKey;
            if (key === 'product_name') {
              onProductNameChange?.(content);
            } else if (key === 'trade_name') {
              onTradeNameChange?.(content);
            } else {
              onDescriptionChange?.(content);
            }
            onAcceptAISuggestion?.(key, content);
          }
          setPendingSuggestion(null);
        }}
        onReject={() => setPendingSuggestion(null)}
      />
    </Card>;
}
export const DeviceOverviewSection = memo(DeviceOverviewSectionComponent);