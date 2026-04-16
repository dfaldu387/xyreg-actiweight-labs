import React, { useEffect, useState, useMemo } from 'react';
import { KeyFeature } from '@/utils/keyFeaturesNormalizer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, GitBranch } from "lucide-react";
import { useDeviceModuleAccess } from "@/hooks/useDeviceModuleAccess";
import { Badge } from "@/components/ui/badge";
import { GeneralTabsSection } from './tabs/general/GeneralTabsSection';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { DEVICES_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { PlanUpgradeRequired } from "@/components/subscription/PlanUpgradeRequired";
import { RestrictedFeatureProvider } from "@/contexts/RestrictedFeatureContext";
import { RestrictedPreviewBanner } from "@/components/subscription/RestrictedPreviewBanner";
import { DeviceOverviewTab } from './DeviceOverviewTab';
import { PurposeTabsSection } from './tabs/purpose/PurposeTabsSection';
import { IdentificationTraceabilitySection } from './IdentificationTraceabilitySection';
import { EnhancedMarketsSection } from './EnhancedMarketsSection';
import { RegulatoryCardsSection } from './RegulatoryCardsSection';
import { UnifiedMarketsRegulatorySection } from './UnifiedMarketsRegulatorySection';
import { NPVAnalysisSection } from './sections/NPVAnalysisSection';
import { useProductFieldSuggestions } from '@/hooks/useProductFieldSuggestions';
import { DeviceCharacteristics, EnhancedProductMarket, IntendedPurposeData } from "@/types/client";
import { StrategicPartners } from './StrategicPartnersSection';
import { Device3DModel } from '@/types';
import { useConditionalForm } from '@/hooks/useConditionalForm';
import { ConditionalDeviceCharacteristics } from './sections/ConditionalDeviceCharacteristics';
import { FieldSuggestion, DeviceContext } from '@/services/productDefinitionAIService';
import { ClassificationProgressIndicator } from './sections/ClassificationProgressIndicator';
import { IVDRClassificationProgressIndicator } from './sections/IVDRClassificationProgressIndicator';
import { IVDRClassificationFieldsSection } from './sections/IVDRClassificationFieldsSection';
import { ClassificationSuggestionsCard } from './ClassificationSuggestionsCard';
import { DeviceClassificationService } from '@/services/DeviceClassificationService';

import { StorageSterilityHandlingSection } from './sections/StorageSterilityHandlingSection';
import { StorageSterilityHandlingData, DEFAULT_STORAGE_STERILITY_HANDLING } from '@/types/storageHandling';
import { useAuth } from '@/context/AuthContext';
import { BundlesTabSection } from './tabs/bundles/BundlesTabSection';
import { VariantsTab } from './tabs/general/VariantsTab';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getDefaultVariantFields } from '@/constants/variantFieldDefaults';
import { InvestorVisibleIcon } from '@/components/ui/investor-visible-badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';


// Tab configuration with menu access keys and descriptions
const createTabConfig = (lang: (key: string) => string) => [
  {
    value: 'overview',
    label: lang('deviceTabs.overview.label'),
    menuAccessKey: DEVICES_MENU_ACCESS.DEVICE_DEFINITION_OVERVIEW,
    description: lang('deviceTabs.overview.description'),
    alwaysVisible: true // Overview is always visible
  },
  {
    value: 'basics',
    label: lang('deviceTabs.general.label'),
    menuAccessKey: DEVICES_MENU_ACCESS.DEVICE_DEFINITION_GENERAL,
    description: lang('deviceTabs.general.description'),
    alwaysVisible: true
  },
  {
    value: 'purpose',
    label: lang('deviceTabs.purpose.label'),
    menuAccessKey: DEVICES_MENU_ACCESS.DEVICE_DEFINITION_PURPOSE,
    description: lang('deviceTabs.purpose.description'),
    alwaysVisible: true
  },
  {
    value: 'markets-regulatory',
    label: lang('deviceTabs.marketsRegulatory.label') || 'Markets & Regulatory',
    menuAccessKey: DEVICES_MENU_ACCESS.DEVICE_DEFINITION_REGULATORY,
    description: lang('deviceTabs.marketsRegulatory.description') || 'Configure target markets, risk classification, and regulatory compliance.',
    alwaysVisible: true
  },
  {
    value: 'identification',
    label: lang('deviceTabs.identification.label'),
    menuAccessKey: DEVICES_MENU_ACCESS.DEVICE_DEFINITION_IDENTIFICATION,
    description: lang('deviceTabs.identification.description'),
    alwaysVisible: false // Only for certain roles
  },
  {
    value: 'bundles',
    label: lang('deviceTabs.bundles.label'),
    menuAccessKey: DEVICES_MENU_ACCESS.DEVICE_DEFINITION_BUNDLES,
    description: lang('deviceTabs.bundles.description'),
    alwaysVisible: true
  },
  {
    value: 'variants',
    label: 'Variants',
    menuAccessKey: DEVICES_MENU_ACCESS.DEVICE_DEFINITION_VARIANTS || DEVICES_MENU_ACCESS.DEVICE_DEFINITION_BUNDLES,
    description: 'Manage product family variants, dimensions, and inheritance.',
    alwaysVisible: true
  },
];

interface Material {
  id: string;
  componentRole: string;
  materialName: string;
  specification: string;
  patientContact: 'Direct Contact' | 'Indirect Contact' | 'No Contact';
  notes?: string;
}

interface DeviceComponent {
  name: string;
  description: string;
  materials?: Material[];
}

interface UserInstructions {
  how_to_use?: string;
  charging?: string;
  maintenance?: string;
}

interface ComprehensiveDeviceInformationProps {
  referenceNumber?: string;
  productName?: string;
  tradeName?: string;
  intendedUse?: string;
  intendedPurposeData?: IntendedPurposeData;
  deviceType?: string | DeviceCharacteristics;
  deviceCategory?: string;
  description?: string;
  modelReference?: string;
  regulatoryStatus?: string;
  keyFeatures?: KeyFeature[];
  deviceComponents?: DeviceComponent[];
  images?: string[];
  videos?: string[];
  basicUdiDi?: string;
  udiDi?: string;
  udiPi?: string;
  gtin?: string;
  modelVersion?: string;
  markets?: EnhancedProductMarket[];
  ceMarkStatus?: string;
  notifiedBody?: string;
  isoCertifications?: string[];
  designFreezeDate?: string | null;
  currentLifecyclePhase?: string;
  projectedLaunchDate?: string | null;
  actualLaunchDate?: string | null;
  conformityAssessmentRoute?: string;
  intendedUsers?: string[];
  clinicalBenefits?: string[];
  userInstructions?: UserInstructions;
  registrationNumber?: string;
  registrationStatus?: string;
  registrationDate?: string | null;
  marketAuthorizationHolder?: string;
  manufacturer?: string;
  manufacturerAddress?: string;
  contraindications?: string[];
  totalNPV?: number;
  project_types?: string[];
  is_line_extension?: boolean;
  parent_product_id?: string;
  base_product_name?: string;
  productPlatform?: string;
  hasLineExtensions?: boolean;
  hasProductUpgrades?: boolean;
  selectedCurrency?: string;
  onCurrencyChange?: (value: string) => void;
  onMarketNPVChange?: (marketCode: string, npvData: any) => void;
  onReferenceNumberChange?: (value: string) => void;
  onProductNameChange?: (value: string) => void;
  onTradeNameChange?: (value: string) => void;
  primaryRegulatoryType?: string;
  onPrimaryRegulatoryTypeChange?: (value: string) => void;
  onModelReferenceChange?: (value: string) => void;
  onDeviceTypeChange?: (value: string | DeviceCharacteristics) => void;
  onDeviceCategoryChange?: (value: string) => void;
  onRegulatoryStatusChange?: (value: string) => void;
  onIntendedUseChange?: (value: string) => void;
  onIntendedPurposeDataChange?: (value: IntendedPurposeData) => void;
  onDescriptionChange?: (value: string) => void;
  onKeyFeaturesChange?: (value: KeyFeature[]) => void;
  onDeviceComponentsChange?: (value: DeviceComponent[]) => void;
  onImagesChange?: (value: string[]) => void;
  onVideosChange?: (value: string[]) => void;
  onBasicUdiDiChange?: (value: string) => void;
  onUdiDiChange?: (value: string) => void;
  onUdiPiChange?: (value: string) => void;
  onGtinChange?: (value: string) => void;
  onModelVersionChange?: (value: string) => void;
  onMarketsChange?: (value: EnhancedProductMarket[]) => void;
  onMarketComponentClassificationChange?: (marketCode: string, components: any) => void;
  onCeMarkStatusChange?: (value: string) => void;
  onNotifiedBodyChange?: (value: string) => void;
  onIsoCertificationsChange?: (value: string[]) => void;
  onDesignFreezeDateChange?: (date: Date | undefined) => void;
  onCurrentLifecyclePhaseChange?: (value: string) => void;
  onProjectedLaunchDateChange?: (date: Date | undefined) => void;
  onConformityAssessmentRouteChange?: (value: string) => void;
  onIntendedUsersChange?: (value: string[]) => void;
  onClinicalBenefitsChange?: (value: string[]) => void;
  onUserInstructionsChange?: (value: UserInstructions) => void;
  onRegistrationNumberChange?: (value: string) => void;
  onRegistrationStatusChange?: (value: string) => void;
  onRegistrationDateChange?: (date: Date | undefined) => void;
  onMarketAuthorizationHolderChange?: (value: string) => void;
  onContraindicationsChange?: (value: string[]) => void;
  progress?: number;
  purposeProgress?: number;
  isLoading?: boolean;
  availableLifecyclePhases?: any[];
  isLoadingPhases?: boolean;
  productId?: string;
  initialTab?: string;
  // New props for phase timeline
  phases?: Array<{
    id: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
    status: string;
    isCurrentPhase?: boolean;
    isOverdue?: boolean;
  }>;
  onPhaseStartDateChange?: (phaseId: string, date: Date | undefined) => void;
  onPhaseEndDateChange?: (phaseId: string, date: Date | undefined) => void;
  companyId?: string;
  models3D?: Device3DModel[];
  onModels3DChange?: (models: Device3DModel[]) => void;
  // Platform editing handlers
  onProductPlatformChange?: (platform: string) => void;
  onBaseProductSelect?: (productId: string) => void;
  onPlatformAndBaseSelect?: (platform: string, baseProductId: string) => void;
  onIsActiveDeviceChange?: (value: boolean) => void;
  isActiveDevice?: boolean;
  coreDeviceNature?: string;
  onCoreDeviceNatureChange?: (value: string) => void;
  keyTechnologyCharacteristics?: DeviceCharacteristics;
  onKeyTechnologyCharacteristicsChange?: (value: DeviceCharacteristics) => void;
  // IVD-specific props
  specimenType?: string;
  testingEnvironment?: string;
  analyticalPerformance?: string[];
  clinicalPerformance?: string[];
  onSpecimenTypeChange?: (value: string) => void;
  onTestingEnvironmentChange?: (value: string) => void;
  onAnalyticalPerformanceChange?: (value: string[]) => void;
  onClinicalPerformanceChange?: (value: string[]) => void;
  // IVDR classification props
  primaryTestCategory?: string;
  ivdrDeviceType?: string;
  controlCalibratorProperties?: string;
  selfTestingSubcategory?: string;
  onPrimaryTestCategoryChange?: (value: string) => void;
  onIvdrDeviceTypeChange?: (value: string) => void;
  onControlCalibratorPropertiesChange?: (value: string) => void;
  onSelfTestingSubcategoryChange?: (value: string) => void;
  // EMDN props
  emdnCategoryId?: string;
  emdnCode?: string;
  emdnDescription?: string;
  onEmdnChange?: (categoryId: string, code: string, description: string) => void;
  // Storage, Sterility & Handling props
  storageSterilityHandling?: StorageSterilityHandlingData;
  onStorageSterilityHandlingChange?: (data: StorageSterilityHandlingData) => void;
  // TRL Level props
  trlLevel?: number | null;
  onTrlLevelChange?: (value: number | null) => void;
  productData?: any;
  // AI suggestions props
  aiSuggestions?: FieldSuggestion[];
  onAcceptAISuggestion?: (fieldType: string, suggestion: string) => void;
  // FDA Search props
  currentFdaCode?: string;
  onFdaCodeSelected?: () => void;
  // Model ID for variants
  model_id?: string | null;
  // Strategic Partners props
  strategicPartners?: StrategicPartners;
  onStrategicPartnersChange?: (partners: StrategicPartners) => void;
  // EUDAMED SSOT locked fields
  eudamedLockedFields?: Record<string, boolean | { locked: true; eudamedValue: boolean | string }>;
  // Product hazards for SSOT linkage in key features
  productHazards?: Array<{ id: string; hazard_id: string; description: string; category?: string }>;
  onAddHazard?: (input: any, requirementIds: string[]) => void;
  // Variant inheritance
  variantInheritance?: {
    isVariant: boolean;
    isMaster: boolean;
    masterDevice: { id: string; name: string } | null;
    getEffectiveValue: (fieldKey: any, localValue: any) => any;
    isFieldInherited: (fieldKey: any) => boolean;
  };
}

export function ComprehensiveDeviceInformation({
  referenceNumber,
  productName,
  tradeName,
  intendedUse,
  intendedPurposeData,
  deviceType,
  deviceCategory,
  description,
  modelReference,
  regulatoryStatus,
  keyFeatures,
  deviceComponents,
  images,
  videos,
  basicUdiDi,
  udiDi,
  udiPi,
  gtin,
  modelVersion,
  markets,
  ceMarkStatus,
  notifiedBody,
  isoCertifications,
  designFreezeDate,
  currentLifecyclePhase,
  projectedLaunchDate,
  actualLaunchDate,
  conformityAssessmentRoute,
  intendedUsers,
  clinicalBenefits,
  userInstructions,
  registrationNumber,
  registrationStatus,
  registrationDate,
  marketAuthorizationHolder,
  manufacturer,
  manufacturerAddress,
  contraindications,
  totalNPV,
  selectedCurrency,
  onCurrencyChange,
  onMarketNPVChange,
  onReferenceNumberChange,
  onProductNameChange,
  onTradeNameChange,
  onModelReferenceChange,
  onDeviceTypeChange,
  onDeviceCategoryChange,
  onRegulatoryStatusChange,
  onIntendedUseChange,
  onIntendedPurposeDataChange,
  onDescriptionChange,
  onKeyFeaturesChange,
  onDeviceComponentsChange,
  onImagesChange,
  onVideosChange,
  onBasicUdiDiChange,
  onUdiDiChange,
  onUdiPiChange,
  onGtinChange,
  onModelVersionChange,
  onMarketsChange,
  onMarketComponentClassificationChange,
  onCeMarkStatusChange,
  onNotifiedBodyChange,
  onIsoCertificationsChange,
  onDesignFreezeDateChange,
  onCurrentLifecyclePhaseChange,
  onProjectedLaunchDateChange,
  onConformityAssessmentRouteChange,
  onIntendedUsersChange,
  onClinicalBenefitsChange,
  onUserInstructionsChange,
  onRegistrationNumberChange,
  onRegistrationStatusChange,
  onRegistrationDateChange,
  onMarketAuthorizationHolderChange,
  onContraindicationsChange,
  progress,
  purposeProgress,
  isLoading,
  availableLifecyclePhases,
  isLoadingPhases,
  productId,
  initialTab = 'overview', // Default to overview tab to show product overview first
  phases,
  onPhaseStartDateChange,
  onPhaseEndDateChange,
  companyId,
  models3D,
  onModels3DChange,
  // Product type detection props
  project_types,
  is_line_extension,
  parent_product_id,
  base_product_name,
  productPlatform,
  hasLineExtensions,
  hasProductUpgrades,
  onProductPlatformChange,
  onBaseProductSelect,
  onPlatformAndBaseSelect,
  onIsActiveDeviceChange,
  isActiveDevice: initialIsActiveDevice,
  keyTechnologyCharacteristics,
  onKeyTechnologyCharacteristicsChange,
  primaryRegulatoryType: initialPrimaryRegulatoryType,
  onPrimaryRegulatoryTypeChange,
  coreDeviceNature: initialCoreDeviceNature,
  onCoreDeviceNatureChange,
  // IVD-specific props
  specimenType: initialSpecimenType,
  testingEnvironment: initialTestingEnvironment,
  analyticalPerformance: initialAnalyticalPerformance,
  clinicalPerformance: initialClinicalPerformance,
  onSpecimenTypeChange,
  onTestingEnvironmentChange,
  onAnalyticalPerformanceChange,
  onClinicalPerformanceChange,
  // IVDR classification props
  primaryTestCategory: initialPrimaryTestCategory,
  ivdrDeviceType: initialIvdrDeviceType,
  controlCalibratorProperties: initialControlCalibratorProperties,
  selfTestingSubcategory: initialSelfTestingSubcategory,
  onPrimaryTestCategoryChange,
  onIvdrDeviceTypeChange,
  onControlCalibratorPropertiesChange,
  onSelfTestingSubcategoryChange,
  // EMDN props
  emdnCategoryId,
  emdnCode,
  emdnDescription,
  onEmdnChange,
  // Storage, Sterility & Handling props
  storageSterilityHandling,
  onStorageSterilityHandlingChange,
  // TRL Level props
  trlLevel,
  onTrlLevelChange,
  productData,
  // AI suggestions props
  aiSuggestions,
  onAcceptAISuggestion,
  // FDA Search props
  currentFdaCode,
  onFdaCodeSelected,
  // Model ID for variants
  model_id,
  // Strategic Partners props
  strategicPartners,
  onStrategicPartnersChange,
  // EUDAMED SSOT locked fields
  eudamedLockedFields,
  // Product hazards for SSOT linkage
  productHazards,
  onAddHazard,
  // Variant inheritance
  variantInheritance,
}: ComprehensiveDeviceInformationProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const TAB_CONFIG = createTabConfig(lang);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user } = useAuth();
  const companyRole = user?.user_metadata?.role;

  // Product field suggestions from Document Studio
  const { suggestions: fieldSuggestionsData, acceptSuggestion, rejectSuggestion } = useProductFieldSuggestions(productId, companyId);
  const handleAcceptFieldSuggestion = (suggestion: any, newValue: string) => {
    acceptSuggestion.mutate(suggestion.id);
  };
  const handleRejectFieldSuggestion = (suggestionId: string) => {
    rejectSuggestion.mutate(suggestionId);
  };

  const { isMenuAccessKeyEnabled, planName, isLoading: isLoadingPlanAccess } = usePlanMenuAccess();
  const { hasAccess: hasDeviceModuleAccess } = useDeviceModuleAccess(productId || null);

  // Check if a tab is enabled based on plan's menu_access
  const isTabEnabled = (menuAccessKey: string): boolean => {
    return isMenuAccessKeyEnabled(menuAccessKey);
  };

  // Helper to get tab config by value
  const getTabConfig = (tabValue: string) => TAB_CONFIG.find(t => t.value === tabValue);

  // Render tab content - shows preview mode if tab is disabled
  const renderTabContent = (tabValue: string, content: React.ReactNode) => {
    const tabConfig = getTabConfig(tabValue);
    if (!tabConfig) return content;

    // Show loading state while checking plan access
    if (isLoadingPlanAccess) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    const isFeatureEnabled = isTabEnabled(tabConfig.menuAccessKey);
    const isRestricted = !isFeatureEnabled;

    if (isRestricted) {
      // Clone the content element to add disabled prop if it's a React element
      const contentWithDisabled = React.isValidElement(content)
        ? React.cloneElement(content as React.ReactElement<any>, { disabled: isRestricted })
        : content;

      return (
        <RestrictedFeatureProvider
          isRestricted={isRestricted}
          planName={planName}
          featureName={tabConfig.label}
        >
          {isRestricted && <RestrictedPreviewBanner className="mt-4" />}
          {contentWithDisabled}
        </RestrictedFeatureProvider>
      );
    }

    return content;
  };

  // Handle tab changes from URL search parameters and normalize for step detection
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const subtabFromUrl = searchParams.get('subtab');
    const sectionFromUrl = searchParams.get('section');
    const returnTo = searchParams.get('returnTo');
    
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    
    // Auto-normalize URL for Venture Blueprint step detection
    // Only when in investor flow and missing subtab/section
    if (returnTo && (returnTo === 'venture-blueprint' || returnTo === 'genesis' || returnTo === 'investor-share' || returnTo === 'gap-analysis')) {
      const newSearchParams = new URLSearchParams(searchParams);
      let needsUpdate = false;
      
      if (tabFromUrl === 'purpose' && !subtabFromUrl) {
        newSearchParams.set('subtab', 'statement');
        needsUpdate = true;
      }
      if (tabFromUrl === 'purpose' && !sectionFromUrl) {
        // Default to intended-use for gap-analysis flow, device-description for others
        newSearchParams.set('section', returnTo === 'gap-analysis' ? 'intended-use' : 'device-description');
        needsUpdate = true;
      }
      if (tabFromUrl === 'general' && !subtabFromUrl) {
        newSearchParams.set('subtab', 'definition');
        needsUpdate = true;
      }
      if (tabFromUrl === 'basics' && !subtabFromUrl) {
        newSearchParams.set('subtab', 'definition');
        needsUpdate = true;
      }
      if (tabFromUrl === 'risk' && !subtabFromUrl) {
        newSearchParams.set('subtab', 'target');
        needsUpdate = true;
      }
      // Note: Do NOT auto-add section=economic-buyer for risk tab
      // This would cause Step 6 (Select Target Markets) to redirect to Step 11 (Profile Economic Buyer)
      
      if (needsUpdate) {
        setSearchParams(newSearchParams, { replace: true });
      }
    }
  }, [searchParams, activeTab, setSearchParams]);

  // Update URL when tab changes - set appropriate defaults for step detection
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', newTab);
    
    // Clear old subtab/section and set defaults for new tab
    newSearchParams.delete('subtab');
    newSearchParams.delete('section');
    
    const returnTo = searchParams.get('returnTo');
    if (returnTo) {
      // Set defaults for Venture Blueprint step detection
      if (newTab === 'purpose') {
        newSearchParams.set('subtab', 'statement');
        newSearchParams.set('section', returnTo === 'gap-analysis' ? 'intended-use' : 'device-description');
      } else if (newTab === 'general') {
        newSearchParams.set('subtab', 'definition');
      } else if (newTab === 'risk') {
        newSearchParams.set('subtab', 'target');
        // Note: Do NOT auto-add section=economic-buyer - let sidebar navigation control this
      }
    }
    
    setSearchParams(newSearchParams);
  };

  // Local state for the new form fields
  const [primaryRegulatoryType, setPrimaryRegulatoryType] = useState<string>(initialPrimaryRegulatoryType || '');
  const [coreDeviceNature, setCoreDeviceNature] = useState<string>(initialCoreDeviceNature || '');
  const [isActiveDevice, setIsActiveDevice] = useState<boolean | undefined>(initialIsActiveDevice);
  const [localKeyTechnologyCharacteristics, setLocalKeyTechnologyCharacteristics] = useState<DeviceCharacteristics>(keyTechnologyCharacteristics || {});


  // IVD-specific state - use initial props or defaults
  const [specimenType, setSpecimenType] = useState<string>(initialSpecimenType || '');
  const [testingEnvironment, setTestingEnvironment] = useState<string>(initialTestingEnvironment || '');
  const [analyticalPerformance, setAnalyticalPerformance] = useState<string[]>(initialAnalyticalPerformance || []);
  const [clinicalPerformance, setClinicalPerformance] = useState<string[]>(initialClinicalPerformance || []);

  // IVDR classification state
  const [primaryTestCategory, setPrimaryTestCategory] = useState<string>(initialPrimaryTestCategory || '');
  const [ivdrDeviceType, setIvdrDeviceType] = useState<string>(initialIvdrDeviceType || '');
  const [controlCalibratorProperties, setControlCalibratorProperties] = useState<string>(initialControlCalibratorProperties || '');
  const [selfTestingSubcategory, setSelfTestingSubcategory] = useState<string>(initialSelfTestingSubcategory || '');

  const [anatomicalLocation, setAnatomicalLocation] = useState<string>('');

  // Initialize conditional form logic
  const conditionalForm = useConditionalForm({ regulatoryType: primaryRegulatoryType });

  // Sync local state with props when they change (async data loading or cache invalidation)
  // IMPORTANT: Reset state unconditionally to handle product switching correctly
  useEffect(() => {
    setLocalKeyTechnologyCharacteristics(keyTechnologyCharacteristics || {});
  }, [keyTechnologyCharacteristics, productId]);

  useEffect(() => {
    setPrimaryRegulatoryType(initialPrimaryRegulatoryType || '');
  }, [initialPrimaryRegulatoryType, productId]);

  useEffect(() => {
    // Reset to undefined if not a boolean (new product), otherwise set to the value
    setIsActiveDevice(typeof initialIsActiveDevice === 'boolean' ? initialIsActiveDevice : undefined);
  }, [initialIsActiveDevice, productId]);

  useEffect(() => {
    setCoreDeviceNature(initialCoreDeviceNature || '');
  }, [initialCoreDeviceNature, productId]);

  // Sync IVD-specific state with props
  useEffect(() => {
    if (initialSpecimenType !== undefined) {
      setSpecimenType(initialSpecimenType);
    }
  }, [initialSpecimenType]);

  useEffect(() => {
    if (initialTestingEnvironment !== undefined) {
      setTestingEnvironment(initialTestingEnvironment);
    }
  }, [initialTestingEnvironment]);

  useEffect(() => {
    if (initialAnalyticalPerformance !== undefined) {
      setAnalyticalPerformance(initialAnalyticalPerformance);
    }
  }, [initialAnalyticalPerformance]);

  useEffect(() => {
    if (initialClinicalPerformance !== undefined) {
      setClinicalPerformance(initialClinicalPerformance);
    }
  }, [initialClinicalPerformance]);

  // Initialize form state from existing data
  useEffect(() => {
    if (deviceType && typeof deviceType === 'object') {
      const deviceTypeObj = deviceType as any;

      // Determine primary regulatory type
      if (deviceTypeObj.isInVitroDiagnostic) {
        setPrimaryRegulatoryType('In Vitro Diagnostic (IVD)');
      } else if (deviceTypeObj.isActiveImplantable) {
        setPrimaryRegulatoryType('Active Implantable Medical Device');
      } else {
        setPrimaryRegulatoryType('Medical Device');
      }

      // Determine core device nature from conflicting data - prioritize most invasive
      if (deviceTypeObj.isImplantable) {
        setCoreDeviceNature('implantable');
      } else if (deviceTypeObj.isSurgicallyInvasive) {
        setCoreDeviceNature('surgically-invasive');
      } else if (deviceTypeObj.isInvasive) {
        setCoreDeviceNature('invasive');
      } else if (deviceTypeObj.isNonInvasive) {
        setCoreDeviceNature('non-invasive');
      }

      // Initialize technology characteristics
      setLocalKeyTechnologyCharacteristics(prev => ({
        ...prev,
        isActive: deviceTypeObj.isActive || false,
        isIntendedToBeSterile: deviceTypeObj.isIntendedToBeSterile || false,
        hasMeasuringFunction: deviceTypeObj.hasMeasuringFunction || false,
        isReusableSurgicalInstrument: deviceTypeObj.isReusableSurgicalInstrument || false,
        incorporatesMedicinalSubstance: deviceTypeObj.incorporatesMedicinalSubstance || false
      }));
    }
  }, [deviceType]);

  // Helper function to extract duration enum from full string
  const getDurationFromString = (durationString?: string): 'transient' | 'short_term' | 'long_term' | undefined => {
    if (!durationString) return undefined;

    // Handle strings with colons and descriptions (e.g., "Long term: Normally intended for continuous use for more than 30 days.")
    const lowercaseString = durationString.toLowerCase();

    if (lowercaseString.includes('transient')) return 'transient';
    // Handle both "short term" (with space) and "short_term" (with underscore)
    if (lowercaseString.includes('short term') || lowercaseString.includes('short_term')) return 'short_term';
    // Handle both "long term" (with space) and "long_term" (with underscore)
    if (lowercaseString.includes('long term') || lowercaseString.includes('long_term')) return 'long_term';

    return undefined;
  };


  // Change handlers
  const handlePrimaryRegulatoryTypeChange = (value: string) => {
    setPrimaryRegulatoryType(value);
    // Call the parent's onChange handler to save the data
    if (onPrimaryRegulatoryTypeChange) {
      onPrimaryRegulatoryTypeChange(value);
    }
  };

  const handleCoreDeviceNatureChange = (value: string) => {
    setCoreDeviceNature(value);
    // Call the parent's onChange handler to save the data
    if (onCoreDeviceNatureChange) {
      onCoreDeviceNatureChange(value);
    }
  };

  const handleIsActiveDeviceChange = (value: boolean) => {
    console.log('Active device toggle changed:', value);
    setIsActiveDevice(value);
    // Call the parent's onChange handler to save the data
    if (onIsActiveDeviceChange) {
      onIsActiveDeviceChange(value);
    }
  };

  const handleKeyTechnologyCharacteristicsChange = (value: DeviceCharacteristics) => {
    setLocalKeyTechnologyCharacteristics(value);
    // Call the parent's onChange handler to save the data (immediate save, no debounce)
    if (onKeyTechnologyCharacteristicsChange) {
      onKeyTechnologyCharacteristicsChange(value);
    }
  };

  // IVD-specific change handlers
  const handleSpecimenTypeChange = (value: string) => {
    setSpecimenType(value);
    onSpecimenTypeChange?.(value);
  };

  const handleTestingEnvironmentChange = (value: string) => {
    setTestingEnvironment(value);
    onTestingEnvironmentChange?.(value);
  };

  const handleAnalyticalPerformanceChange = (value: string[]) => {
    setAnalyticalPerformance(value);
    onAnalyticalPerformanceChange?.(value);
  };

  const handleClinicalPerformanceChange = (value: string[]) => {
    setClinicalPerformance(value);
    onClinicalPerformanceChange?.(value);
  };

  // IVDR classification change handlers
  const handlePrimaryTestCategoryChange = (value: string) => {
    setPrimaryTestCategory(value);
  };

  const handleIvdrDeviceTypeChange = (value: string) => {
    setIvdrDeviceType(value);
  };

  const handleControlCalibratorPropertiesChange = (value: string) => {
    setControlCalibratorProperties(value);
  };

  const handleSelfTestingSubcategoryChange = (value: string) => {
    setSelfTestingSubcategory(value);
  };

  const handleAnatomicalLocationChange = (location: string) => {
    setAnatomicalLocation(location);
  };

  const overviewVariantKeys = useMemo(() => [
    'referenceNumber',
    'variantName',
    'tradeName',
    'emdnCode',
    'modelReference',
    'udiDi',
    'basicUdiDi',
    'intendedPurpose',
    'medicalDeviceType',
    'notifiedBody',
    'designFreezeDate',
    'regulatoryStatusByMarket',
  ] as const, []);

  type OverviewVariantKey = typeof overviewVariantKeys[number];

  const { data: companyVariantFields } = useQuery({
    queryKey: ['company-variant-fields', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('variant_field')
        .eq('id', companyId)
        .single<{ variant_field: Record<string, { enabled?: boolean }> | null }>();

      if (error) {
        console.error('Failed to fetch company variant configuration', error);
        return null;
      }

      return data?.variant_field || null;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch company name for Google Image Search
  const { data: companyData } = useQuery({
    queryKey: ['company-name', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single<{ name: string | null }>();

      if (error) {
        console.error('Failed to fetch company name', error);
        return null;
      }

      return data;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
  });

  const baselineVariantFields = useMemo(() => getDefaultVariantFields(), []);

  const overviewFieldVisibility = useMemo(() => {
    const visibility: Record<OverviewVariantKey, boolean> = {} as Record<OverviewVariantKey, boolean>;
    overviewVariantKeys.forEach((key) => {
      if (companyVariantFields) {
        visibility[key] = companyVariantFields[key]?.enabled !== false;
      } else {
        visibility[key] = baselineVariantFields[key]?.enabled !== false;
      }
    });
    return visibility;
  }, [baselineVariantFields, companyVariantFields, overviewVariantKeys]);

  // Calculate Device Overview Section completion percentage
  const calculateDeviceOverviewProgress = () => {
    const requiredFields = [
      productName?.trim(),                              // 1.1 Device Indicator - Product Name
      modelReference?.trim(),                           // 1.1 Device Indicator - Model Reference
      deviceCategory?.trim(),                           // 1.2 Device Identification - Category
      primaryRegulatoryType?.trim(),                    // 1.3 Primary Regulatory Type
      coreDeviceNature?.trim(),                        // 1.4 Core Device Nature & Invasiveness
      localKeyTechnologyCharacteristics && Object.keys(localKeyTechnologyCharacteristics).length > 0 ? 'has_tech_characteristics' : null, // 1.5 Key Technology & Characteristics
      keyFeatures && keyFeatures.length > 0 ? 'has_features' : null, // 1.6 Key Features
      deviceComponents && deviceComponents.length > 0 ? 'has_components' : null // 1.7 Device Components
      // Note: Device media (1.8) is optional in this calculation
    ];

    const completedFields = requiredFields.filter(field => field !== null && field !== undefined && field !== '').length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const deviceOverviewProgress = calculateDeviceOverviewProgress();

  // Update active tab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);




  return (
    <div className="space-y-4 sm:space-y-6 pt-3">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TooltipProvider>
          <div className="overflow-x-auto w-full bg-muted rounded-md">
          <TabsList className={`inline-flex w-full justify-between gap-2 p-1 bg-transparent xl:grid ${
            companyRole === 'admin' || companyRole === 'business' || companyRole === 'editor' || companyRole === 'viewer' || companyRole === 'consultant' ? 'xl:grid-cols-9' : 'xl:grid-cols-5'
          }`}>
            {TAB_CONFIG.map((tab) => {
              // Check role-based visibility
              const isRoleAllowed = tab.alwaysVisible ||
                (companyRole === 'admin' || companyRole === 'business' || companyRole === 'editor' || companyRole === 'viewer' || companyRole === 'consultant');

              if (!isRoleAllowed) return null;

              // While loading plan access, show tabs in a neutral/loading state
              if (isLoadingPlanAccess) {
                return (
                  <div
                    key={tab.value}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground/50"
                  >
                    <span className="truncate opacity-50">{tab.label}</span>
                  </div>
                );
              }

              const enabled = isTabEnabled(tab.menuAccessKey);

              // Check if this tab should be highlighted as investor-relevant
              const isInvestorFlow = searchParams.get('returnTo') === 'investor-share' || searchParams.get('returnTo') === 'venture-blueprint';
              const isInvestorRelevantTab = tab.value === 'purpose' || tab.value === 'basics';
              const showInvestorIndicator = isInvestorFlow && isInvestorRelevantTab;

              // Check device module access for this sub-tab
              const deviceTabPermMap: Record<string, string> = {
                'overview': 'device-definition.overview',
                'basics': 'device-definition.general',
                'purpose': 'device-definition.purpose',
                'markets-regulatory': 'device-definition.markets-tab',
                'identification': 'device-definition.identification',
                'bundles': 'device-definition.bundles',
                'variants': 'device-definition.variants',
              };
              const devicePermId = deviceTabPermMap[tab.value];
              const hasDeviceAccess = !devicePermId || hasDeviceModuleAccess(devicePermId);

              return (
                <Tooltip key={tab.value}>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value={tab.value}
                      disabled={!hasDeviceAccess}
                      className={cn(
                        "flex items-center gap-1.5",
                        activeTab === tab.value && "bg-white",
                        showInvestorIndicator && "!text-indigo-600 data-[state=active]:!text-indigo-600",
                        !hasDeviceAccess && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {showInvestorIndicator && <InvestorVisibleIcon className="text-indigo-600" />}
                      {!hasDeviceAccess && <Lock className="h-3 w-3 text-muted-foreground" />}
                      {!enabled && hasDeviceAccess && <Lock className="h-3 w-3 text-slate-500" />}
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  {!enabled && (
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">
                          {planName
                            ? `This feature is not available on the ${planName} plan. Upgrade to access it.`
                            : 'Upgrade your plan to access this feature'}
                        </p>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TabsList>
          </div>
        </TooltipProvider>

        <TabsContent value="overview">
          {renderTabContent('overview',
            <DeviceOverviewTab
              referenceNumber={referenceNumber}
              registrationNumber={registrationNumber}
              productName={productName}
              tradeName={tradeName}
              modelReference={modelReference}
              basicUdiDi={basicUdiDi}
              udiDi={udiDi}
              intendedUse={intendedUse}
              deviceCategory={deviceCategory}
              conformityAssessmentRoute={conformityAssessmentRoute}
              notifiedBody={notifiedBody}
              designFreezeDate={designFreezeDate}
              currentLifecyclePhase={currentLifecyclePhase}
              projectedLaunchDate={projectedLaunchDate}
              actualLaunchDate={actualLaunchDate}
              images={images}
              videos={videos}
              markets={markets}
              progress={progress}
              emdnCode={emdnCode}
              companyId={companyId}
              project_types={project_types}
              is_line_extension={is_line_extension}
              parent_product_id={parent_product_id}
              base_product_name={base_product_name}
              productPlatform={productPlatform}
              hasLineExtensions={hasLineExtensions}
              isLoading={isLoading}
              overviewFieldVisibility={overviewFieldVisibility}
              companyName={companyData?.name || ''}
              deviceDefinitionData={{
                productName,
                tradeName,
                referenceNumber,
                modelReference,
                description,
                deviceCategory,
                primaryRegulatoryType,
                coreDeviceNature,
                isActiveDevice,
                keyFeatures,
                deviceComponents,
                emdnCode,
                intendedPurposeData: intendedPurposeData as any,
                contraindications,
                intendedUsers,
                clinicalBenefits,
                userInstructions,
                storageSterilityHandling,
                basicUdiDi,
                udiDi,
                udiPi,
                gtin,
                registrationNumber,
                registrationStatus,
                registrationDate,
                markets,
                ceMarkStatus,
                notifiedBody,
                conformityAssessmentRoute,
                isoCertifications,
                marketAuthorizationHolder,
                manufacturer,
                currentLifecyclePhase,
                designFreezeDate,
                projectedLaunchDate,
                actualLaunchDate,
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="basics">
          {(() => {
            const tabConfig = getTabConfig('basics');
            if (!tabConfig) return (
              <div className="space-y-4">
                <GeneralTabsSection
                  productName={productName}
                  registrationNumber={registrationNumber}
                  onRegistrationNumberChange={onRegistrationNumberChange}
                  onReferenceNumberChange={onReferenceNumberChange}
                  modelReference={modelReference}
                  deviceType={deviceType}
                  deviceCategory={deviceCategory}
                  description={description}
                  intendedUse={intendedUse}
                  keyFeatures={keyFeatures}
                  deviceComponents={deviceComponents}
                  images={images}
                  videos={videos}
                  models3D={models3D}
                  onProductNameChange={onProductNameChange}
                  onModelReferenceChange={onModelReferenceChange}
                  onDeviceTypeChange={onDeviceTypeChange}
                  onDeviceCategoryChange={onDeviceCategoryChange}
                  onDescriptionChange={onDescriptionChange}
                  onKeyFeaturesChange={onKeyFeaturesChange}
                  onDeviceComponentsChange={onDeviceComponentsChange}
                  onImagesChange={onImagesChange}
                  onVideosChange={onVideosChange}
                  onModels3DChange={onModels3DChange}
                  isLoading={isLoading}
                  project_types={project_types}
                  is_line_extension={is_line_extension}
                  parent_product_id={parent_product_id}
                  base_product_name={base_product_name}
                  product_platform={productPlatform}
                  hasLineExtensions={hasLineExtensions}
                  hasProductUpgrades={hasProductUpgrades}
                  company_id={companyId}
                  companyName={companyData?.name}
                  productId={productId}
                  onProductPlatformChange={onProductPlatformChange}
                  onBaseProductSelect={onBaseProductSelect}
                  primaryRegulatoryType={primaryRegulatoryType}
                  onPrimaryRegulatoryTypeChange={handlePrimaryRegulatoryTypeChange}
                  coreDeviceNature={coreDeviceNature}
                  isActiveDevice={isActiveDevice}
                  onCoreDeviceNatureChange={handleCoreDeviceNatureChange}
                  onIsActiveDeviceChange={handleIsActiveDeviceChange}
                  keyTechnologyCharacteristics={localKeyTechnologyCharacteristics}
                  onKeyTechnologyCharacteristicsChange={handleKeyTechnologyCharacteristicsChange}
                  specimenType={specimenType}
                  testingEnvironment={testingEnvironment}
                  analyticalPerformance={analyticalPerformance}
                  clinicalPerformance={clinicalPerformance}
                  onSpecimenTypeChange={handleSpecimenTypeChange}
                  onTestingEnvironmentChange={handleTestingEnvironmentChange}
                  onAnalyticalPerformanceChange={handleAnalyticalPerformanceChange}
                  onClinicalPerformanceChange={handleClinicalPerformanceChange}
                  anatomicalLocation={anatomicalLocation}
                  onAnatomicalLocationChange={handleAnatomicalLocationChange}
                  progress={deviceOverviewProgress}
                  tradeName={tradeName}
                  onTradeNameChange={onTradeNameChange}
                  referenceNumber={referenceNumber}
                  udiDi={udiDi}
                  emdnCode={emdnCode}
                  basicUdiDi={basicUdiDi}
                  onUdiDiChange={onUdiDiChange}
                  onBasicUdiDiChange={onBasicUdiDiChange}
                  emdnCategoryId={emdnCategoryId}
                  emdnDescription={emdnDescription}
                  onEmdnChange={onEmdnChange}
                  storageSterilityHandling={storageSterilityHandling}
                  onStorageSterilityHandlingChange={onStorageSterilityHandlingChange}
                  trlLevel={trlLevel}
                  onTrlLevelChange={onTrlLevelChange}
                  productData={productData}
                  aiSuggestions={aiSuggestions}
                  onAcceptAISuggestion={onAcceptAISuggestion}
                    model_id={model_id}
                    eudamedLockedFields={eudamedLockedFields}
                    clinicalBenefits={clinicalBenefits}
                    onClinicalBenefitsChange={onClinicalBenefitsChange}
                    productHazards={productHazards}
                    onAddHazard={onAddHazard}
                    is_master_device={variantInheritance?.isMaster}
                    variantInheritance={variantInheritance}
                    fieldSuggestions={fieldSuggestionsData}
                    onAcceptFieldSuggestion={handleAcceptFieldSuggestion}
                    onRejectFieldSuggestion={handleRejectFieldSuggestion}
                 />
               </div>
             );

            // Show loading state while checking plan access
            if (isLoadingPlanAccess) {
              return (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                </div>
              );
            }

            const isFeatureEnabled = isTabEnabled(tabConfig.menuAccessKey);
            const isRestricted = !isFeatureEnabled;

            return (
              <RestrictedFeatureProvider
                isRestricted={isRestricted}
                planName={planName}
                featureName="General Information"
              >
                {isRestricted && <RestrictedPreviewBanner className="mt-4" />}
                <div className="space-y-4">
                  <GeneralTabsSection
                    productName={productName}
                    registrationNumber={registrationNumber}
                    onRegistrationNumberChange={onRegistrationNumberChange}
                      onReferenceNumberChange={onReferenceNumberChange}
                    modelReference={modelReference}
                    deviceType={deviceType}
                    deviceCategory={deviceCategory}
                    description={description}
                    intendedUse={intendedUse}
                    keyFeatures={keyFeatures}
                    deviceComponents={deviceComponents}
                    images={images}
                    videos={videos}
                    models3D={models3D}
                    onProductNameChange={onProductNameChange}
                    onModelReferenceChange={onModelReferenceChange}
                    onDeviceTypeChange={onDeviceTypeChange}
                    onDeviceCategoryChange={onDeviceCategoryChange}
                    onDescriptionChange={onDescriptionChange}
                    onKeyFeaturesChange={onKeyFeaturesChange}
                    onDeviceComponentsChange={onDeviceComponentsChange}
                    onImagesChange={onImagesChange}
                    onVideosChange={onVideosChange}
                    onModels3DChange={onModels3DChange}
                    isLoading={isLoading}
                    project_types={project_types}
                    is_line_extension={is_line_extension}
                    parent_product_id={parent_product_id}
                    base_product_name={base_product_name}
                    product_platform={productPlatform}
                    hasLineExtensions={hasLineExtensions}
                    hasProductUpgrades={hasProductUpgrades}
                    company_id={companyId}
                    companyName={companyData?.name}
                    productId={productId}
                    onProductPlatformChange={onProductPlatformChange}
                    onBaseProductSelect={onBaseProductSelect}
                    primaryRegulatoryType={primaryRegulatoryType}
                    onPrimaryRegulatoryTypeChange={handlePrimaryRegulatoryTypeChange}
                    coreDeviceNature={coreDeviceNature}
                    isActiveDevice={isActiveDevice}
                    onCoreDeviceNatureChange={handleCoreDeviceNatureChange}
                    onIsActiveDeviceChange={handleIsActiveDeviceChange}
                    keyTechnologyCharacteristics={localKeyTechnologyCharacteristics}
                    onKeyTechnologyCharacteristicsChange={handleKeyTechnologyCharacteristicsChange}
                    specimenType={specimenType}
                    testingEnvironment={testingEnvironment}
                    analyticalPerformance={analyticalPerformance}
                    clinicalPerformance={clinicalPerformance}
                    onSpecimenTypeChange={handleSpecimenTypeChange}
                    onTestingEnvironmentChange={handleTestingEnvironmentChange}
                    onAnalyticalPerformanceChange={handleAnalyticalPerformanceChange}
                    onClinicalPerformanceChange={handleClinicalPerformanceChange}
                    anatomicalLocation={anatomicalLocation}
                    onAnatomicalLocationChange={handleAnatomicalLocationChange}
                    progress={deviceOverviewProgress}
                    tradeName={tradeName}
                    onTradeNameChange={onTradeNameChange}
                    referenceNumber={referenceNumber}
                    udiDi={udiDi}
                    emdnCode={emdnCode}
                    basicUdiDi={basicUdiDi}
                    onUdiDiChange={onUdiDiChange}
                    onBasicUdiDiChange={onBasicUdiDiChange}
                    emdnCategoryId={emdnCategoryId}
                    emdnDescription={emdnDescription}
                    onEmdnChange={onEmdnChange}
                    storageSterilityHandling={storageSterilityHandling}
                    onStorageSterilityHandlingChange={onStorageSterilityHandlingChange}
                    trlLevel={trlLevel}
                    onTrlLevelChange={onTrlLevelChange}
                    productData={productData}
                    aiSuggestions={aiSuggestions}
                    onAcceptAISuggestion={onAcceptAISuggestion}
                    model_id={model_id}
                    disabled={isRestricted}
                    eudamedLockedFields={eudamedLockedFields}
                    clinicalBenefits={clinicalBenefits}
                    onClinicalBenefitsChange={onClinicalBenefitsChange}
                    productHazards={productHazards}
                    onAddHazard={onAddHazard}
                    is_master_device={variantInheritance?.isMaster}
                    variantInheritance={variantInheritance}
                    fieldSuggestions={fieldSuggestionsData}
                    onAcceptFieldSuggestion={handleAcceptFieldSuggestion}
                    onRejectFieldSuggestion={handleRejectFieldSuggestion}
                  />
                </div>
              </RestrictedFeatureProvider>
            );
          })()}
        </TabsContent>


        <TabsContent value="purpose">
          {(() => {
            const tabConfig = getTabConfig('purpose');
            if (!tabConfig) return (
              <PurposeTabsSection
                productId={productId}
                intendedUse={intendedUse}
                intendedPurposeData={intendedPurposeData}
                contraindications={contraindications}
                intendedUsers={intendedUsers}
                clinicalBenefits={clinicalBenefits}
                userInstructions={userInstructions}
                onIntendedUseChange={onIntendedUseChange}
                onIntendedPurposeDataChange={onIntendedPurposeDataChange}
                onContraindicationsChange={onContraindicationsChange}
                onIntendedUsersChange={onIntendedUsersChange}
                onClinicalBenefitsChange={onClinicalBenefitsChange}
                onUserInstructionsChange={onUserInstructionsChange}
                isLoading={isLoading}
                progress={purposeProgress || 0}
                aiSuggestions={aiSuggestions}
                onAcceptAISuggestion={onAcceptAISuggestion}
                companyId={companyId}
                productName={productName}
                deviceContext={{
                  productName: productName || '',
                  deviceCategory: deviceCategory || '',
                  deviceDescription: description || '',
                  emdnCode: emdnCode || '',
                  emdnDescription: emdnDescription || '',
                  primaryRegulatoryType: primaryRegulatoryType || '',
                  coreDeviceNature: coreDeviceNature || '',
                  keyFeatures: (keyFeatures || []).map(f => typeof f === 'string' ? f : f.name),
                  isActiveDevice: isActiveDevice || false,
                  deviceCharacteristics: keyTechnologyCharacteristics
                }}
                variantInheritance={variantInheritance}
                storageSterilityHandling={storageSterilityHandling}
                deviceCharacteristics={keyTechnologyCharacteristics}
                onStorageSterilityHandlingChange={onStorageSterilityHandlingChange}
              />
            );

            // Show loading state while checking plan access
            if (isLoadingPlanAccess) {
              return (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                </div>
              );
            }

            const isFeatureEnabled = isTabEnabled(tabConfig.menuAccessKey);
            const isRestricted = !isFeatureEnabled;

            return (
              <RestrictedFeatureProvider
                isRestricted={isRestricted}
                planName={planName}
                featureName="Intended Purpose"
              >
                {isRestricted && <RestrictedPreviewBanner className="mt-4" />}
                <PurposeTabsSection
                  productId={productId}
                  intendedUse={intendedUse}
                  intendedPurposeData={intendedPurposeData}
                  contraindications={contraindications}
                  intendedUsers={intendedUsers}
                  clinicalBenefits={clinicalBenefits}
                  userInstructions={userInstructions}
                  onIntendedUseChange={onIntendedUseChange}
                  onIntendedPurposeDataChange={onIntendedPurposeDataChange}
                  onContraindicationsChange={onContraindicationsChange}
                  onIntendedUsersChange={onIntendedUsersChange}
                  onClinicalBenefitsChange={onClinicalBenefitsChange}
                  onUserInstructionsChange={onUserInstructionsChange}
                  isLoading={isLoading}
                  progress={purposeProgress || 0}
                  aiSuggestions={aiSuggestions}
                  onAcceptAISuggestion={onAcceptAISuggestion}
                  companyId={companyId}
                  productName={productName}
                  disabled={isRestricted}
                  deviceContext={{
                    productName: productName || '',
                    deviceCategory: deviceCategory || '',
                    deviceDescription: description || '',
                    emdnCode: emdnCode || '',
                    emdnDescription: emdnDescription || '',
                    primaryRegulatoryType: primaryRegulatoryType || '',
                    coreDeviceNature: coreDeviceNature || '',
                    keyFeatures: (keyFeatures || []).map(f => typeof f === 'string' ? f : f.name),
                    isActiveDevice: isActiveDevice || false,
                    deviceCharacteristics: keyTechnologyCharacteristics
                  }}
                  variantInheritance={variantInheritance}
                  storageSterilityHandling={storageSterilityHandling}
                  deviceCharacteristics={keyTechnologyCharacteristics}
                  onStorageSterilityHandlingChange={onStorageSterilityHandlingChange}
                  fieldSuggestions={fieldSuggestionsData}
                  onAcceptFieldSuggestion={handleAcceptFieldSuggestion}
                  onRejectFieldSuggestion={handleRejectFieldSuggestion}
                />
              </RestrictedFeatureProvider>
            );
          })()}
        </TabsContent>


        <TabsContent value="identification">
          {renderTabContent('identification',
            <IdentificationTraceabilitySection
              companyId={companyId || ''}
              productId={productId}
              basicUdiDi={basicUdiDi}
              udiDi={udiDi}
              udiPi={udiPi}
              gtin={gtin}
              onBasicUdiDiChange={onBasicUdiDiChange}
              onUdiDiChange={onUdiDiChange}
              onUdiPiChange={onUdiPiChange}
              onGtinChange={onGtinChange}
              registrationNumber={registrationNumber}
              registrationStatus={registrationStatus}
              registrationDate={registrationDate}
              marketAuthorizationHolder={marketAuthorizationHolder}
              notifiedBody={notifiedBody}
              ceMarkStatus={ceMarkStatus}
              conformityAssessmentRoute={conformityAssessmentRoute}
              onRegistrationNumberChange={onRegistrationNumberChange}
              onRegistrationStatusChange={onRegistrationStatusChange}
              onRegistrationDateChange={onRegistrationDateChange}
              onMarketAuthorizationHolderChange={onMarketAuthorizationHolderChange}
              onNotifiedBodyChange={onNotifiedBodyChange}
              onCeMarkStatusChange={onCeMarkStatusChange}
              onConformityAssessmentRouteChange={onConformityAssessmentRouteChange}
              isLoading={isLoading}
              productData={productData}
            />
          )}
        </TabsContent>

        <TabsContent value="markets-regulatory">
          {renderTabContent('markets-regulatory',
            <UnifiedMarketsRegulatorySection
              belongsToFamily={variantInheritance?.isVariant || variantInheritance?.isMaster || false}
              markets={markets}
              onMarketsChange={onMarketsChange}
              onMarketComponentClassificationChange={(marketCode, components) => {
                if (onMarketsChange && markets) {
                  const updatedMarkets = markets.map(market => {
                    if (market.code === marketCode) {
                      return { ...market, componentClassification: components };
                    }
                    return market;
                  });
                  onMarketsChange(updatedMarkets);
                }
              }}
              primaryRegulatoryType={primaryRegulatoryType}
              keyTechnologyCharacteristics={localKeyTechnologyCharacteristics}
              onKeyTechnologyCharacteristicsChange={handleKeyTechnologyCharacteristicsChange}
              deviceComponents={deviceComponents}
              productId={productId}
              projectedLaunchDate={projectedLaunchDate}
              productData={productData}
              isLoading={isLoading}
              classificationSuggestions={(() => {
                if (!markets || markets.length === 0) return [];
                const selectedMarketsOnly = markets.filter(market => market.selected);
                if (selectedMarketsOnly.length === 0) return [];
                const classificationInput = {
                  primaryRegulatoryType: primaryRegulatoryType || '',
                  keyTechnologyCharacteristics: localKeyTechnologyCharacteristics || {},
                  coreDeviceNature,
                  invasiveness: coreDeviceNature === 'Invasive' ? 'invasive' as const :
                    coreDeviceNature === 'Non-invasive' ? 'non-invasive' as const :
                      coreDeviceNature === 'Surgically invasive' ? 'surgically_invasive' as const :
                        coreDeviceNature === 'Implantable' ? 'implantable' as const : 'non-invasive' as const,
                  duration: intendedPurposeData?.duration_of_use === '< 60 minutes' || intendedPurposeData?.duration_of_use === '60 minutes to 30 days' ? 'transient' as const :
                    intendedPurposeData?.duration_of_use === 'Temporary (< 30 days)' ? 'short_term' as const : 'long_term' as const,
                  active: isActiveDevice,
                  anatomicalLocation: (localKeyTechnologyCharacteristics as any)?.anatomicalLocation,
                  bodyContact: (localKeyTechnologyCharacteristics as any)?.anatomicalLocation ||
                    (coreDeviceNature === 'Invasive' || coreDeviceNature === 'Surgically invasive' || coreDeviceNature === 'Implantable' ? 'direct' : 'indirect'),
                  sterile: (localKeyTechnologyCharacteristics as any)?.isIntendedToBeSterile,
                  measuring: (localKeyTechnologyCharacteristics as any)?.hasMeasuringFunction,
                  reusableSurgical: localKeyTechnologyCharacteristics?.isReusableSurgicalInstrument,
                  medicinalSubstance: localKeyTechnologyCharacteristics?.incorporatesMedicinalSubstance,
                  energyDelivery: (localKeyTechnologyCharacteristics as any)?.deliversTherapeuticEnergy || (localKeyTechnologyCharacteristics as any)?.deliversDiagnosticEnergy,
                  therapeuticEnergy: (localKeyTechnologyCharacteristics as any)?.deliversTherapeuticEnergy,
                  diagnosticEnergy: (localKeyTechnologyCharacteristics as any)?.deliversDiagnosticEnergy,
                  absorbedByBody: (localKeyTechnologyCharacteristics as any)?.isAbsorbedByBody,
                  containsNanomaterials: (localKeyTechnologyCharacteristics as any)?.containsNanomaterials,
                  primaryTestCategory,
                  ivdrDeviceType,
                  testingEnvironment,
                  controlCalibratorProperties,
                  selfTestingSubcategory,
                  intendedUse
                };
                return DeviceClassificationService.classifyDevice(classificationInput, selectedMarketsOnly);
              })()}
              onClassificationSelected={(marketCode, deviceClass) => {
                if (onMarketsChange && markets && marketCode) {
                  const updatedMarkets = markets.map(market => {
                    if (market.code === marketCode && market.selected) {
                      let riskClass;
                      if (primaryRegulatoryType?.includes('IVD')) {
                        riskClass = deviceClass.match(/Class\s+([ABCD])/)?.[1];
                      } else {
                        riskClass = deviceClass.match(/Class\s+(III|IIb|IIa|I)/)?.[1];
                      }
                      return { ...market, riskClass: riskClass || market.riskClass };
                    }
                    return market;
                  });
                  onMarketsChange(updatedMarkets);
                }
              }}
              emdnCode={emdnCode}
              emdnCategoryId={emdnCategoryId}
              emdnDescription={emdnDescription}
              onEmdnChange={onEmdnChange}
              companyId={companyId}
              currentFdaCode={currentFdaCode}
              onFdaCodeSelected={onFdaCodeSelected}
              coreDeviceNature={coreDeviceNature}
              intendedPurposeData={intendedPurposeData}
              parentProductId={variantInheritance?.masterDevice?.id ?? null}
            />
          )}
        </TabsContent>

        <TabsContent value="bundles">
          {renderTabContent('bundles',
            productId && companyId ? (
              <BundlesTabSection
                productId={productId}
                companyId={companyId}
              />
            ) : null
          )}
        </TabsContent>

        <TabsContent value="variants">
          {renderTabContent('variants',
            <VariantsTab
              productId={productId}
              companyId={companyId}
              is_master_device={variantInheritance?.isMaster}
              parent_product_id={parent_product_id}
            />
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}