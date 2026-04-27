import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ComprehensiveDeviceInformation } from './ComprehensiveDeviceInformation';
import { RiskManagementTab } from './RiskManagementTab';
import { useProductDetails } from '@/hooks/useProductDetails';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DeviceCharacteristics, EnhancedProductMarket, IntendedPurposeData } from '@/types/client';
import { StrategicPartners } from './StrategicPartnersSection';
import { Device3DModel } from '@/types';
import { useStableCallback } from '@/hooks/useStableCallback';
import { debounce } from '@/utils/debounce';
import { normalizeKeyFeatures } from '@/utils/keyFeaturesNormalizer';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { sanitizeProductName } from '@/utils/productName';
import { useEmdnCodes } from '@/hooks/useEmdnCodes';
import { StorageSterilityHandlingData, DEFAULT_STORAGE_STERILITY_HANDLING } from '@/types/storageHandling';
import { FieldSuggestion } from '@/services/productDefinitionAIService';
import { hazardsService } from '@/services/hazardsService';
import { useVariantInheritance } from '@/hooks/useVariantInheritance';
import { FamilySyncStatusWidget } from '@/components/product/variant/FamilySyncStatusWidget';

interface DeviceInformationContainerProps {
  productId: string;
  companyId: string;
  initialTab?: string;
}

interface DeviceComponent {
  name: string;
  description: string;
}

interface UserInstructions {
  how_to_use?: string;
  charging?: string;
  maintenance?: string;
}

export function DeviceInformationContainer({ productId, companyId, initialTab }: DeviceInformationContainerProps) {
   const { data: product } = useProductDetails(productId);
   const { data: emdnCodes = [] } = useEmdnCodes();
   const queryClient = useQueryClient();
   const variantInheritance = useVariantInheritance(productId);

  // Fetch hazards for SSOT linkage in key features
  const { data: productHazards = [] } = useQuery({
    queryKey: ['product-hazards-for-features', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hazards')
        .select('id, hazard_id, description, category')
        .eq('product_id', productId)
        .order('hazard_id', { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: !!productId,
    staleTime: 30_000,
  });

  // Hazard creation from key features dialog
  const createHazardFromFeature = useMutation({
    mutationFn: async ({ input, requirementIds }: { input: any; requirementIds: string[] }) => {
      const hazard = await hazardsService.createHazard(productId, companyId, input, 'GEN');
      if (requirementIds.length > 0) {
        const { traceabilityService } = await import('@/services/traceabilityService');
        await traceabilityService.updateHazardRequirementLinks(hazard.hazard_id, requirementIds);
      }
      return hazard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-hazards-for-features', productId] });
      queryClient.invalidateQueries({ queryKey: ['hazards', productId] });
      toast.success('Hazard created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create hazard');
    },
  });

  const handleAddHazardFromFeature = useCallback((input: any, requirementIds: string[]) => {
    createHazardFromFeature.mutate({ input, requirementIds });
  }, [createHazardFromFeature]);
  
  // Query to check if this product is used as a platform by any line extensions
  const { data: hasLineExtensions = false } = useQuery({
    queryKey: ['product-line-extensions', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('parent_product_id', productId)
        .limit(1);
      
      if (error) {
        return false;
      }
      
      return data && data.length > 0;
    },
    enabled: !!productId
  });

  // Query to check if this product has any product upgrades (products that use this as base)
  const { data: hasProductUpgrades = false } = useQuery({
    queryKey: ['product-upgrades', productId],
    queryFn: async () => {
      // For NPD products, check if there are any products with project_types containing 'existing_product'
      // that might be related to this product as upgrades
      const { data, error } = await supabase
        .from('products')
        .select('id, project_types')
        .not('project_types', 'is', null)
        .limit(10); // Get a reasonable sample
      
      if (error) {
        return false;
      }
      
      // Check if any product has 'existing_product' in their project_types
      const hasUpgrades = data?.some(product => {
        if (!product.project_types) return false;
        
        try {
          // Handle both string and array formats
          const projectTypes = typeof product.project_types === 'string' 
            ? JSON.parse(product.project_types)
            : product.project_types;
          
          return Array.isArray(projectTypes) && projectTypes.includes('existing_product');
        } catch (e) {
          // If parsing fails, check if it's a simple string match
          return typeof product.project_types === 'string' && 
                 product.project_types.includes('existing_product');
        }
      }) || false;
      
      return hasUpgrades;
    },
    enabled: !!productId
  });

  // Query device characteristics from devices table (EUDAMED cross-table lookup)
  // Use any available EUDAMED identifier for the lookup — not just basic_udi_di
  const basicUdiDi = product?.basic_udi_di;
  const eudamedDeviceName = (product as any)?.eudamed_device_name;
  const eudamedIdSrn = (product as any)?.eudamed_id_srn;
  const hasEudamedLink = !!basicUdiDi || !!eudamedDeviceName || !!eudamedIdSrn;

  const { data: deviceCharacteristics } = useQuery({
    queryKey: ['device-characteristics', basicUdiDi, eudamedDeviceName, eudamedIdSrn],
    queryFn: async () => {
      const selectFields = 'measuring, reusable, sterile, single_use, active, sterilization_need, contain_latex, administering_medicine, implantable, applicable_legislation, trade_names, device_name, direct_marking, device_model, basic_udi_di_code, udi_di, manufacturer_id_srn';

      // Try lookup by basic_udi_di_code first
      if (basicUdiDi) {
        const { data, error } = await supabase
          .from('devices')
          .select(selectFields)
          .eq('basic_udi_di_code', basicUdiDi)
          .limit(1)
          .maybeSingle();
        if (!error && data) return data;
      }

      // Fallback: lookup by device_name + manufacturer SRN
      if (eudamedDeviceName && eudamedIdSrn) {
        const { data, error } = await supabase
          .from('devices')
          .select(selectFields)
          .eq('device_name', eudamedDeviceName)
          .eq('manufacturer_id_srn', eudamedIdSrn)
          .limit(1)
          .maybeSingle();
        if (!error && data) return data;
      }

      // Fallback: lookup by device_name only
      if (eudamedDeviceName) {
        const { data, error } = await supabase
          .from('devices')
          .select(selectFields)
          .eq('device_name', eudamedDeviceName)
          .limit(1)
          .maybeSingle();
        if (!error && data) return data;
      }

      return null;
    },
    enabled: hasEudamedLink
  });

  // State for all device information fields
  const [aiSuggestions, setAiSuggestions] = useState<FieldSuggestion[]>([]);
  const [deviceData, setDeviceData] = useState<any>({
    referenceNumber: '',
    productName: '',
    tradeName: '',
    intendedUse: '',
    intendedPurposeData: {} as IntendedPurposeData,
    deviceType: '',
    deviceCategory: '',
    description: '',
    modelReference: '',
    regulatoryStatus: '',
    keyFeatures: [] as any[],
    deviceComponents: [] as DeviceComponent[],
    images: [] as string[],
    videos: [] as string[],
    basicUdiDi: '',
    udiDi: '',
    udiPi: '',
    gtin: '',
    modelVersion: '',
    markets: [] as EnhancedProductMarket[],
    ceMarkStatus: '',
    notifiedBody: '',
    isoCertifications: [] as string[],
    designFreezeDate: null as string | null,
    currentLifecyclePhase: '',
    projectedLaunchDate: null as string | null,
    actualLaunchDate: null as string | null,
    conformityAssessmentRoute: '',
    intendedUsers: [] as string[],
    clinicalBenefits: [] as string[],
    userInstructions: {} as UserInstructions,
    registrationNumber: '',
    registrationStatus: '',
    registrationDate: null as string | null,
    marketAuthorizationHolder: '',
    manufacturer: '',
    manufacturerAddress: '',
    contraindications: [] as string[],
        totalNPV: 0,
        selectedCurrency: 'USD',
         productPlatform: '',
         // Important: do NOT default this to false; undefined means "no choice made yet"
         isActiveDevice: undefined as boolean | undefined,
         keyTechnologyCharacteristics: {} as DeviceCharacteristics,
         primaryRegulatoryType: '',
         coreDeviceNature: '',
          // IVD-specific fields
          specimenType: '',
          testingEnvironment: '',
          analyticalPerformance: [] as string[],
          clinicalPerformance: [] as string[],
          // IVDR classification fields
          primaryTestCategory: '',
          ivdrDeviceType: '',
          controlCalibratorProperties: '',
          selfTestingSubcategory: '',
          // EMDN fields
          emdnCategoryId: '',
          emdnCode: '',
          emdnDescription: '',
          // Storage, Sterility & Handling
          storageSterilityHandling: DEFAULT_STORAGE_STERILITY_HANDLING,
          // TRL Level
          trlLevel: null as number | null,
          // Strategic Partners for Value Map
          strategicPartners: {} as StrategicPartners
  });

  const [isLoading, setIsLoading] = useState(false);

  // Load data when product changes - only run once per product change
  useEffect(() => {
    if (product) {
      // Helper function to safely process videos field
      const processVideos = (videosField: any): string[] => {
        if (!videosField) return [];
        if (Array.isArray(videosField)) return videosField;
        if (typeof videosField === 'string') {
          return videosField.split(',').map(v => v.trim()).filter(Boolean);
        }
        return [];
      };

      // Helper function to convert dates to strings
      const dateToString = (date: string | Date | null | undefined): string | null => {
        if (!date) return null;
        if (typeof date === 'string') return date;
        if (date instanceof Date) return date.toISOString().split('T')[0];
        return null;
      };

      // Helper function to process markets data
      const processMarkets = (marketsData: any): EnhancedProductMarket[] => {
        if (!marketsData) {
          return [];
        }
        
        let markets: any[] = [];
        if (Array.isArray(marketsData)) {
          markets = marketsData;
        } else if (typeof marketsData === 'string') {
          try {
            const parsed = JSON.parse(marketsData);
            markets = Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        
        // Convert to EnhancedProductMarket format and clean template data
        const enhancedMarkets = markets.map(market => {
          // Ensure selected is properly converted to boolean
          const isSelected = market.selected === true || market.selected === 'true' || market.selected === 1;
          
          // Create clean market object without template data
          const cleanMarket: EnhancedProductMarket = {
            code: market.code || '',
            name: market.name || market.code || '',
            selected: isSelected,
            riskClass: market.riskClass,
            regulatoryStatus: market.regulatoryStatus,
            reauditTimeline: market.reauditTimeline,
            customReauditTimeline: market.customReauditTimeline,
            launchDate: market.launchDate,
            certificateNumber: market.certificateNumber,
            certificateType: market.certificateType,
            conformityAssessmentRoute: market.conformityAssessmentRoute,
            clinicalTrialsRequired: market.clinicalTrialsRequired,
            pmcfRequired: market.pmcfRequired,
            customRequirements: market.customRequirements,
            marketLaunchStatus: market.marketLaunchStatus,
            actualLaunchDate: market.actualLaunchDate,

            // IMPORTANT: preserve component-based classification (SiMD / procedure pack)
            componentClassification: market.componentClassification,

            // Economic Buyer Profile fields
            budgetType: market.budgetType,
            buyerType: market.buyerType,
            reimbursementCode: market.reimbursementCode,
            codingStrategy: market.codingStrategy,
            procurementPath: market.procurementPath,
            mhlwCategory: market.mhlwCategory,
            vbpStatus: market.vbpStatus,
            prosthesesListTargeting: market.prosthesesListTargeting,
            prosthesesListGrouping: market.prosthesesListGrouping,
            primaryPayer: market.primaryPayer,

            // Market-specific agent/representative details
            australianSponsor: market.australianSponsor,
            usAgent: market.usAgent,
            euAuthorizedRep: market.euAuthorizedRep,
            canadianImporter: market.canadianImporter,
            brazilianRegistrationHolder: market.brazilianRegistrationHolder,
            chinaLegalAgent: market.chinaLegalAgent,
            japanMAH: market.japanMAH,
            indiaLicense: market.indiaLicense,
            ukResponsiblePerson: market.ukResponsiblePerson,
            swissAuthorizedRep: market.swissAuthorizedRep,
            koreaImporter: market.koreaImporter,

            // Universal importer details
            importerDetails: market.importerDetails,

            // EU Notified Body
            requireNotifiedBody: market.requireNotifiedBody,
            notifiedBody: market.notifiedBody,

            // Regulatory details fields
            udiRequirements: market.udiRequirements,
            localAuthorizedRep: market.localAuthorizedRep,
            approvalExpiryDate: market.approvalExpiryDate,
            pmsRequirement: market.pmsRequirement,
            responsiblePerson: market.responsiblePerson,

            // Classification rule explanation (persisted from assistant)
            classificationRule: market.classificationRule,

            // Strategic Partners (CRITICAL: preserve these arrays to prevent data loss)
            distributionPartners: Array.isArray(market.distributionPartners) ? market.distributionPartners : [],
            clinicalPartners: Array.isArray(market.clinicalPartners) ? market.clinicalPartners : [],
            regulatoryPartners: Array.isArray(market.regulatoryPartners) ? market.regulatoryPartners : []
          };
          
          return cleanMarket;
        });
        
        return enhancedMarkets;
      };

      
      setDeviceData({
        referenceNumber: (product as any).eudamed_reference_number || '',
        productName: sanitizeProductName(product.name) || '',
        tradeName: (product as any).trade_name || 
                   (product as any).eudamed_trade_names || '',
        intendedUse: product.intended_use || '',
        intendedPurposeData: product.intended_purpose_data || {},
        deviceType: typeof product.device_type === 'string' ? product.device_type : '',
        deviceCategory: product.device_category || '',
        description: product.description || '',
        modelReference: product.model_reference || '',
        regulatoryStatus: product.regulatory_status || '',
        keyFeatures: normalizeKeyFeatures(product.key_features),
         deviceComponents: product.device_components || [],
        images: (() => {
          // Check for images in product.images field (the field we're saving to)
          if ((product as any).images) {
            if (Array.isArray((product as any).images)) {
              return (product as any).images.filter(Boolean);
            } else if (typeof (product as any).images === 'string') {
              return (product as any).images.split(',').map(url => url.trim()).filter(Boolean);
            }
          }
          // Fallback to product.image field (legacy support)
          if (product.image) {
            if (Array.isArray(product.image)) {
              return product.image.filter(Boolean);
            } else if (typeof product.image === 'string') {
              return product.image.split(',').map(url => url.trim()).filter(Boolean);
            }
          }
          return [];
        })(),
        videos: processVideos(product.videos),
        basicUdiDi: product.basic_udi_di || '',
        udiDi: product.udi_di || '',
        udiPi: product.udi_pi || '',
        gtin: product.gtin || '',
        modelVersion: product.model_version || '',
        markets: processMarkets(product.markets),
        ceMarkStatus: product.ce_mark_status || '',
        notifiedBody: product.notified_body || '',
        isoCertifications: product.iso_certifications || [],
        designFreezeDate: dateToString(product.design_freeze_date),
        currentLifecyclePhase: product.current_lifecycle_phase || '',
        projectedLaunchDate: dateToString(product.projected_launch_date),
        // actual_launch_date is auto-synced from market data by DB trigger sync_launch_dates_from_markets
        actualLaunchDate: dateToString((product as any).actual_launch_date),
        conformityAssessmentRoute: product.conformity_assessment_route || '',
        intendedUsers: product.intended_users || [],
        clinicalBenefits: product.clinical_benefits || [],
        userInstructions: product.user_instructions || {},
        registrationNumber: product.eudamed_registration_number || '',
        registrationStatus: product.registration_status || '',
        registrationDate: dateToString(product.registration_date),
        marketAuthorizationHolder: product.market_authorization_holder || '',
        manufacturer: product.manufacturer || '',
        manufacturerAddress: '',
        contraindications: product.contraindications || [],
        totalNPV: 0,
        selectedCurrency: 'USD',
         productPlatform: product.product_platform || '',
           // Load isActiveDevice from key_technology_characteristics.isActive, fallback to EUDAMED
           isActiveDevice: (product as any).key_technology_characteristics?.isActive ??
             (deviceCharacteristics?.active != null ? deviceCharacteristics.active === true : undefined),
          keyTechnologyCharacteristics: (() => {
            const existing = (product as any).key_technology_characteristics || {};
            // Merge EUDAMED device characteristics if available and product chars are empty
            if (deviceCharacteristics && !Object.values(existing).some(v => v === true)) {
              const d = deviceCharacteristics;
              return {
                ...existing,
                hasMeasuringFunction: d.measuring === true,
                isReusable: d.reusable === true,
                isSingleUse: d.single_use === true,
                isDeliveredSterile: d.sterile === true,
                isNonSterile: d.sterilization_need === false,
                canBeSterilized: d.sterilization_need === true,
                isActive: d.active === true,
                containsLatex: d.contain_latex === true,
                incorporatesMedicinalSubstance: d.administering_medicine === true,
              };
            }
            return existing;
          })(),
          primaryRegulatoryType: (() => {
            // Use saved value first
            if ((product as any).primary_regulatory_type) return (product as any).primary_regulatory_type;
            // Auto-detect from EUDAMED applicable_legislation
            if (deviceCharacteristics?.applicable_legislation) {
              const leg = (deviceCharacteristics.applicable_legislation as string).toUpperCase();
              if (leg.includes('IVDR') || leg.includes('IVDD') || leg.includes('98/79')) {
                return 'In Vitro Diagnostic (IVD)';
              }
              if (leg.includes('MDR') || leg.includes('MDD') || leg.includes('93/42') || leg.includes('2017/745')) {
                return 'Medical Device (MDR)';
              }
            }
            return '';
          })(),
          coreDeviceNature: (() => {
            // First check saved device_type data
            try {
              let deviceTypeData = product.device_type;
              if (typeof deviceTypeData === 'string') {
                deviceTypeData = JSON.parse(deviceTypeData);
              }
              if (typeof deviceTypeData === 'object' && deviceTypeData) {
                const invasivenessLevel = (deviceTypeData as any)?.invasivenessLevel || '';
                if (invasivenessLevel) return invasivenessLevel;
              }
            } catch { /* ignore */ }
            // Fallback: auto-detect from EUDAMED implantable field
            if (deviceCharacteristics?.implantable === true) {
              return 'implantable';
            }
            return '';
          })(),
          // IVD-specific data loading
          specimenType: (() => {
            try {
              let deviceTypeData = product.device_type;
              if (typeof deviceTypeData === 'string') {
                deviceTypeData = JSON.parse(deviceTypeData);
              }
              if (typeof deviceTypeData === 'object' && deviceTypeData) {
                return (deviceTypeData as any)?.specimenType || '';
              }
              return '';
            } catch {
              return '';
            }
          })(),
          testingEnvironment: (() => {
            try {
              let deviceTypeData = product.device_type;
              if (typeof deviceTypeData === 'string') {
                deviceTypeData = JSON.parse(deviceTypeData);
              }
              if (typeof deviceTypeData === 'object' && deviceTypeData) {
                return (deviceTypeData as any)?.testingEnvironment || '';
              }
              return '';
            } catch {
              return '';
            }
          })(),
          analyticalPerformance: (() => {
            try {
              let deviceTypeData = product.device_type;
              if (typeof deviceTypeData === 'string') {
                deviceTypeData = JSON.parse(deviceTypeData);
              }
              if (typeof deviceTypeData === 'object' && deviceTypeData) {
                return (deviceTypeData as any)?.analyticalPerformance || [];
              }
              return [];
            } catch {
              return [];
            }
          })(),
          clinicalPerformance: (() => {
            try {
              let deviceTypeData = product.device_type;
              if (typeof deviceTypeData === 'string') {
                deviceTypeData = JSON.parse(deviceTypeData);
              }
              if (typeof deviceTypeData === 'object' && deviceTypeData) {
                return (deviceTypeData as any)?.clinicalPerformance || [];
              }
              return [];
            } catch {
              return [];
            }
          })(),
          
          // IVDR classification data loading
          primaryTestCategory: (() => {
            try {
              let deviceTypeData = product.device_type;
              if (typeof deviceTypeData === 'string') {
                deviceTypeData = JSON.parse(deviceTypeData);
              }
              if (typeof deviceTypeData === 'object' && deviceTypeData) {
                return (deviceTypeData as any)?.primaryTestCategory || '';
              }
              return '';
            } catch {
              return '';
            }
          })(),
          ivdrDeviceType: (() => {
            try {
              let deviceTypeData = product.device_type;
              if (typeof deviceTypeData === 'string') {
                deviceTypeData = JSON.parse(deviceTypeData);
              }
              if (typeof deviceTypeData === 'object' && deviceTypeData) {
                return (deviceTypeData as any)?.ivdrDeviceType || '';
              }
              return '';
            } catch {
              return '';
            }
          })(),
          controlCalibratorProperties: (() => {
            try {
              let deviceTypeData = product.device_type;
              if (typeof deviceTypeData === 'string') {
                deviceTypeData = JSON.parse(deviceTypeData);
              }
              if (typeof deviceTypeData === 'object' && deviceTypeData) {
                return (deviceTypeData as any)?.controlCalibratorProperties || '';
              }
              return '';
            } catch {
              return '';
            }
           })(),
           selfTestingSubcategory: (() => {
             try {
               let deviceTypeData = product.device_type;
               if (typeof deviceTypeData === 'string') {
                 deviceTypeData = JSON.parse(deviceTypeData);
               }
               if (typeof deviceTypeData === 'object' && deviceTypeData) {
                 return (deviceTypeData as any)?.selfTestingSubcategory || '';
               }
               return '';
             } catch {
               return '';
             }
           })(),
            // EMDN fields from product data - find the correct EMDN record ID that matches the stored code
            emdnCategoryId: (() => {
              // First try to use emdn_category_id if it exists
              if ((product as any)?.emdn_category_id) {
                return (product as any).emdn_category_id;
              }
              
              // Look up the EMDN record ID that matches the stored emdn_code
              const storedEmdnCode = (product as any)?.emdn_code || '';
              if (storedEmdnCode && emdnCodes.length > 0) {
                const matchingRecord = emdnCodes.find(code => code.emdn_code === storedEmdnCode);
                if (matchingRecord) {
                  return matchingRecord.id;
                }
              }
              
              return '';
            })(),
            emdnCode: (product as any)?.emdn_code || '',
            emdnDescription: (product as any)?.emdn_description || '',
            // Storage, Sterility & Handling
            storageSterilityHandling: (product as any)?.storage_sterility_handling || {},
            // TRL Level
            trlLevel: (product as any)?.trl_level || null,
            // Strategic Partners for Value Map
            strategicPartners: (product as any)?.strategic_partners || {}
       });
    }
  }, [product?.id, emdnCodes.length, deviceCharacteristics]); // Also depend on device characteristics for EUDAMED merge

  // Create a stable, debounced save function that doesn't cause re-renders
  const debouncedSave = useCallback(
    debounce(async (updates: Partial<typeof deviceData> | { parent_product_id?: string; keyTechnologyCharacteristics?: DeviceCharacteristics }) => {
      try {
        
        const updateData: any = {};
        
        // Handle parent_product_id directly since it's not in deviceData
        if ('parent_product_id' in updates && updates.parent_product_id !== undefined) {
          updateData.parent_product_id = updates.parent_product_id;
        }
        
        // Map our local state to database fields
        if ('referenceNumber' in updates && updates.referenceNumber !== undefined) {
          updateData.eudamed_reference_number = updates.referenceNumber;
        }
        if ('productName' in updates && updates.productName !== undefined) updateData.name = updates.productName;
        if ('tradeName' in updates && updates.tradeName !== undefined) updateData.trade_name = updates.tradeName;
        if ('intendedUse' in updates && updates.intendedUse !== undefined) updateData.intended_use = updates.intendedUse;
        if ('intendedPurposeData' in updates && updates.intendedPurposeData !== undefined) {
          updateData.intended_purpose_data = updates.intendedPurposeData;
          // Also sync to legacy intended_use field for compatibility with other systems
          const purposeData = updates.intendedPurposeData as any;
          if (purposeData?.clinicalPurpose) {
            updateData.intended_use = purposeData.clinicalPurpose;
          }
        }
        if ('deviceType' in updates && updates.deviceType !== undefined) updateData.device_type = updates.deviceType;
        if ('deviceCategory' in updates && updates.deviceCategory !== undefined) updateData.device_category = updates.deviceCategory;
        if ('description' in updates && updates.description !== undefined) updateData.description = updates.description;
        if ('modelReference' in updates && updates.modelReference !== undefined) updateData.model_reference = updates.modelReference;
        if ('regulatoryStatus' in updates && updates.regulatoryStatus !== undefined) updateData.regulatory_status = updates.regulatoryStatus;
        if ('keyFeatures' in updates && updates.keyFeatures !== undefined) updateData.key_features = updates.keyFeatures;
        if ('deviceComponents' in updates && updates.deviceComponents !== undefined) updateData.device_components = updates.deviceComponents;
        if ('images' in updates && updates.images !== undefined) {
          updateData.images = updates.images;
        }
        if ('videos' in updates && updates.videos !== undefined) {
          updateData.videos = updates.videos;
        }
        if ('basicUdiDi' in updates && updates.basicUdiDi !== undefined) updateData.basic_udi_di = updates.basicUdiDi;
        if ('udiDi' in updates && updates.udiDi !== undefined) updateData.udi_di = updates.udiDi;
        if ('udiPi' in updates && updates.udiPi !== undefined) updateData.udi_pi = updates.udiPi;
        if ('gtin' in updates && updates.gtin !== undefined) updateData.gtin = updates.gtin;
        if ('modelVersion' in updates && updates.modelVersion !== undefined) updateData.model_version = updates.modelVersion;
        if ('markets' in updates && updates.markets !== undefined) {
          // Ensure markets with component classifications are properly saved
          updateData.markets = updates.markets;
        }
        if ('ceMarkStatus' in updates && updates.ceMarkStatus !== undefined) updateData.ce_mark_status = updates.ceMarkStatus;
        if ('notifiedBody' in updates && updates.notifiedBody !== undefined) updateData.notified_body = updates.notifiedBody;
        if ('isoCertifications' in updates && updates.isoCertifications !== undefined) updateData.iso_certifications = updates.isoCertifications;
        if ('designFreezeDate' in updates && updates.designFreezeDate !== undefined) updateData.design_freeze_date = updates.designFreezeDate;
        if ('currentLifecyclePhase' in updates && updates.currentLifecyclePhase !== undefined) updateData.current_lifecycle_phase = updates.currentLifecyclePhase;
        if ('projectedLaunchDate' in updates && updates.projectedLaunchDate !== undefined) updateData.projected_launch_date = updates.projectedLaunchDate;
        if ('conformityAssessmentRoute' in updates && updates.conformityAssessmentRoute !== undefined) updateData.conformity_assessment_route = updates.conformityAssessmentRoute;
        if ('intendedUsers' in updates && updates.intendedUsers !== undefined) updateData.intended_users = updates.intendedUsers;
        if ('clinicalBenefits' in updates && updates.clinicalBenefits !== undefined) updateData.clinical_benefits = updates.clinicalBenefits;
        if ('userInstructions' in updates && updates.userInstructions !== undefined) updateData.user_instructions = updates.userInstructions;
        if ('registrationNumber' in updates && updates.registrationNumber !== undefined) updateData.eudamed_registration_number = updates.registrationNumber;
        if ('registrationStatus' in updates && updates.registrationStatus !== undefined) updateData.registration_status = updates.registrationStatus;
        if ('registrationDate' in updates && updates.registrationDate !== undefined) updateData.registration_date = updates.registrationDate;
        if ('marketAuthorizationHolder' in updates && updates.marketAuthorizationHolder !== undefined) updateData.market_authorization_holder = updates.marketAuthorizationHolder;
        if ('manufacturer' in updates && updates.manufacturer !== undefined) updateData.manufacturer = updates.manufacturer;
        if ('contraindications' in updates && updates.contraindications !== undefined) updateData.contraindications = updates.contraindications;
        if ('productPlatform' in updates && updates.productPlatform !== undefined) updateData.product_platform = updates.productPlatform;
        
        // Handle isActiveDevice: merge into key_technology_characteristics.isActive (not a standalone column)
        if ('isActiveDevice' in updates && updates.isActiveDevice !== undefined) {
          // Get existing key_technology_characteristics or use the one from updates
          const existingChars = updates.keyTechnologyCharacteristics || 
            ((product as any)?.key_technology_characteristics as DeviceCharacteristics) || {};
          updateData.key_technology_characteristics = {
            ...existingChars,
            isActive: updates.isActiveDevice
          };
        }
        
        if ('keyTechnologyCharacteristics' in updates && updates.keyTechnologyCharacteristics !== undefined) {
          updateData.key_technology_characteristics = updates.keyTechnologyCharacteristics;
        }
        if ('primaryRegulatoryType' in updates && updates.primaryRegulatoryType !== undefined) {
           updateData.primary_regulatory_type = updates.primaryRegulatoryType;
         }
         if ('coreDeviceNature' in updates && updates.coreDeviceNature !== undefined) {
           // Store invasiveness in the device_type JSONB field
           const currentDeviceType = typeof product?.device_type === 'object' ? product.device_type : {};
           updateData.device_type = {
             ...currentDeviceType,
             invasivenessLevel: updates.coreDeviceNature
           };
         }
         
          // Handle IVD-specific fields and IVDR classification fields
          if ('specimenType' in updates || 'testingEnvironment' in updates || 'analyticalPerformance' in updates || 'clinicalPerformance' in updates ||
              'primaryTestCategory' in updates || 'ivdrDeviceType' in updates || 'controlCalibratorProperties' in updates || 'selfTestingSubcategory' in updates) {
            const currentDeviceType = typeof product?.device_type === 'object' ? product.device_type : {};
            updateData.device_type = {
              ...currentDeviceType,
              // IVD fields
              ...(updates.specimenType !== undefined && { specimenType: updates.specimenType }),
              ...(updates.testingEnvironment !== undefined && { testingEnvironment: updates.testingEnvironment }),
              ...(updates.analyticalPerformance !== undefined && { analyticalPerformance: updates.analyticalPerformance }),
              ...(updates.clinicalPerformance !== undefined && { clinicalPerformance: updates.clinicalPerformance }),
              // IVDR classification fields
              ...(updates.primaryTestCategory !== undefined && { primaryTestCategory: updates.primaryTestCategory }),
              ...(updates.ivdrDeviceType !== undefined && { ivdrDeviceType: updates.ivdrDeviceType }),
              ...(updates.controlCalibratorProperties !== undefined && { controlCalibratorProperties: updates.controlCalibratorProperties }),
              ...(updates.selfTestingSubcategory !== undefined && { selfTestingSubcategory: updates.selfTestingSubcategory })
            };
          }

          // Handle EMDN fields
          if ('emdnCategoryId' in updates && updates.emdnCategoryId !== undefined) {
            // Check if it's a valid UUID format (8-4-4-4-12 hex pattern)
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidPattern.test(updates.emdnCategoryId)) {
              updateData.emdn_category_id = updates.emdnCategoryId;
            } else {
              updateData.emdn_category_id = null;
            }
          }
          if ('emdnCode' in updates && updates.emdnCode !== undefined && updates.emdnCode !== '') {
            updateData.emdn_code = updates.emdnCode;
          }
          if ('emdnDescription' in updates && updates.emdnDescription !== undefined && updates.emdnDescription !== '') {
            updateData.emdn_description = updates.emdnDescription;
          }

          // Handle Storage, Sterility & Handling field
          if ('storageSterilityHandling' in updates && updates.storageSterilityHandling !== undefined) {
            updateData.storage_sterility_handling = updates.storageSterilityHandling;
          }

          // Handle TRL Level field
          if ('trlLevel' in updates) {
            updateData.trl_level = updates.trlLevel;
          }

          // Handle Strategic Partners field
          if ('strategicPartners' in updates && updates.strategicPartners !== undefined) {
            updateData.strategic_partners = updates.strategicPartners;
          }

        // Only proceed with update if we have data to update
        if (Object.keys(updateData).length === 0) {
          return;
        }

        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', productId);

        if (error) {
          throw error;
        }

        // Invalidate funnel-related queries to update Investor Share checklist
        // Includes Device Type fields (primaryRegulatoryType, coreDeviceNature, isActiveDevice)
        if ('productName' in updates || 'description' in updates || 'intendedPurposeData' in updates || 'intendedUse' in updates || 'images' in updates || 'markets' in updates || 'keyTechnologyCharacteristics' in updates || 'trlLevel' in updates || 'primaryRegulatoryType' in updates || 'coreDeviceNature' in updates || 'isActiveDevice' in updates) {
          queryClient.invalidateQueries({ queryKey: ['funnel-product', productId] });
        }

        // Invalidate productDetails cache to keep sidebar/gap-analysis in sync
        if ('markets' in updates || 'primaryRegulatoryType' in updates || 'coreDeviceNature' in updates || 'isActiveDevice' in updates || 'productName' in updates || 'description' in updates || 'intendedUse' in updates || 'intendedPurposeData' in updates || 'basicUdiDi' in updates || 'keyTechnologyCharacteristics' in updates) {
          queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
          queryClient.invalidateQueries({ queryKey: ['product', productId] });
        }

        // Annex I rules read from key_technology_characteristics — invalidate
        // the device-context cache so GSPR statuses recompute immediately.
        if ('keyTechnologyCharacteristics' in updates || 'primaryRegulatoryType' in updates) {
          queryClient.invalidateQueries({ queryKey: ['product-device-context', productId] });
        }

        // Invalidate family scope sync cache so other family members see fresh values
        queryClient.invalidateQueries({ queryKey: ['family-products-scope-sync'] });
      } catch {
        toast.error('Failed to save changes');
      }
    }, 600),
    [productId]
  );

  // Flush any pending saves when component unmounts to prevent data loss
  useEffect(() => {
    return () => {
      if (debouncedSave && typeof (debouncedSave as any).flush === 'function') {
        (debouncedSave as any).flush();
      }
    };
  }, [debouncedSave]);

  // Immediate save function for critical fields (bypasses debounce)
  const immediateSave = useCallback(async (updates: { keyTechnologyCharacteristics?: DeviceCharacteristics; trlLevel?: number | null }) => {
    try {
      const updateData: any = {};

      if ('keyTechnologyCharacteristics' in updates && updates.keyTechnologyCharacteristics !== undefined) {
        updateData.key_technology_characteristics = updates.keyTechnologyCharacteristics;
      }

      if ('trlLevel' in updates) {
        updateData.trl_level = updates.trlLevel;
      }

      if (Object.keys(updateData).length === 0) return;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) {
        throw error;
      }

      // Invalidate all related queries to ensure fresh data on navigation
      queryClient.invalidateQueries({ queryKey: ['funnel-product', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-device-context', productId] });
    } catch {
      toast.error('Failed to save changes');
    }
  }, [productId]);

  // Create a generic update handler that updates local state and triggers save
  const createUpdateHandler = useCallback((field: keyof typeof deviceData) => {
    return (value: any) => {
      // Update local state immediately for responsive UI
      setDeviceData(prev => {
        const updated = { ...prev, [field]: value };
        return updated;
      });
      
      // Trigger debounced save
      debouncedSave({ [field]: value });
    };
  }, [debouncedSave]);

  // Auto-populate trade name from EUDAMED data when available
  // NOTE: product.key_features is transformed to [] by useProductDetails when it's an object,
  // so we use deviceCharacteristics (from devices table) as the primary EUDAMED source.
  useEffect(() => {
    if (!product) return;

    // Primary source: devices table (deviceCharacteristics) which has raw trade_names
    const devicesTableTradeName = deviceCharacteristics?.trade_names
      ? String(deviceCharacteristics.trade_names).trim().split(/[;|,]/)[0]?.trim()
      : null;
    // Fallback: direct eudamed column on products table
    const directEudamedTradeNames = (product as any)?.eudamed_trade_names;

    const eudamedTradeName = devicesTableTradeName || directEudamedTradeNames || null;

    if (!deviceData.tradeName && eudamedTradeName) {
      // Update the local state
      setDeviceData(prev => ({ ...prev, tradeName: eudamedTradeName }));

      // Save to database
      debouncedSave({ tradeName: eudamedTradeName });
    }
  }, [product?.id, deviceData.tradeName, debouncedSave, deviceCharacteristics]);

  // Memoized update handlers with stable references
  const onProductNameChange = useStableCallback(createUpdateHandler('productName'));
  const onTradeNameChange = useStableCallback(createUpdateHandler('tradeName'));
  const onReferenceNumberChange = useStableCallback(createUpdateHandler('referenceNumber'));
  const onModelReferenceChange = useStableCallback(createUpdateHandler('modelReference'));
  const onDeviceTypeChange = useStableCallback(createUpdateHandler('deviceType'));
  const onDeviceCategoryChange = useStableCallback(createUpdateHandler('deviceCategory'));
  const onDescriptionChange = useStableCallback(createUpdateHandler('description'));
  const onIntendedUseChange = useStableCallback(createUpdateHandler('intendedUse'));
  const onIntendedPurposeDataChange = useStableCallback(createUpdateHandler('intendedPurposeData'));
  const onKeyFeaturesChange = useStableCallback(createUpdateHandler('keyFeatures'));
  const onDeviceComponentsChange = useStableCallback(createUpdateHandler('deviceComponents'));
  const onImagesChange = useStableCallback(createUpdateHandler('images'));
  const onVideosChange = useStableCallback(createUpdateHandler('videos'));
  const onBasicUdiDiChange = useStableCallback(createUpdateHandler('basicUdiDi'));
  const onUdiDiChange = useStableCallback(createUpdateHandler('udiDi'));
  const onUdiPiChange = useStableCallback(createUpdateHandler('udiPi'));
  const onGtinChange = useStableCallback(createUpdateHandler('gtin'));
  const onModelVersionChange = useStableCallback(createUpdateHandler('modelVersion'));
  const onMarketsChange = useStableCallback((newMarkets: EnhancedProductMarket[]) => {
    setDeviceData(prev => ({ ...prev, markets: newMarkets }));
    debouncedSave({ markets: newMarkets });
  });

  // Component classification handler
  const onMarketComponentClassificationChange = useStableCallback((marketCode: string, components: any) => {
    const updatedMarkets = deviceData.markets.map(market => {
      if (market.code === marketCode) {
        return {
          ...market,
          componentClassification: components
        };
      }
      return market;
    });
    
    onMarketsChange(updatedMarkets);
  });
  const onCeMarkStatusChange = useStableCallback(createUpdateHandler('ceMarkStatus'));
  const onNotifiedBodyChange = useStableCallback(createUpdateHandler('notifiedBody'));
  const onIsoCertificationsChange = useStableCallback(createUpdateHandler('isoCertifications'));
  const onCurrentLifecyclePhaseChange = useStableCallback(createUpdateHandler('currentLifecyclePhase'));
  const onConformityAssessmentRouteChange = useStableCallback(createUpdateHandler('conformityAssessmentRoute'));
  const onIntendedUsersChange = useStableCallback(createUpdateHandler('intendedUsers'));
  const onClinicalBenefitsChange = useStableCallback(createUpdateHandler('clinicalBenefits'));
  const onUserInstructionsChange = useStableCallback(createUpdateHandler('userInstructions'));
  const onRegistrationNumberChange = useStableCallback(createUpdateHandler('registrationNumber'));
  const onRegistrationStatusChange = useStableCallback(createUpdateHandler('registrationStatus'));
  const onMarketAuthorizationHolderChange = useStableCallback(createUpdateHandler('marketAuthorizationHolder'));
  const onContraindicationsChange = useStableCallback(createUpdateHandler('contraindications'));
  const onCurrencyChange = useStableCallback(createUpdateHandler('selectedCurrency'));

  // Special handlers for date fields
  const onDesignFreezeDateChange = useStableCallback((date: Date | undefined) => {
    const dateString = date ? date.toISOString().split('T')[0] : null;
    setDeviceData(prev => ({ ...prev, designFreezeDate: dateString }));
    debouncedSave({ designFreezeDate: dateString });
  });

  const onProjectedLaunchDateChange = useStableCallback((date: Date | undefined) => {
    const dateString = date ? date.toISOString().split('T')[0] : null;
    setDeviceData(prev => ({ ...prev, projectedLaunchDate: dateString }));
    debouncedSave({ projectedLaunchDate: dateString });
  });

  const onRegistrationDateChange = useStableCallback((date: Date | undefined) => {
    const dateString = date ? date.toISOString().split('T')[0] : null;
    setDeviceData(prev => ({ ...prev, registrationDate: dateString }));
    debouncedSave({ registrationDate: dateString });
  });

  const onMarketNPVChange = useStableCallback((marketCode: string, npvData: any) => {
    // Handle NPV changes here
  });

  // Platform and base product handlers
  const onProductPlatformChange = useStableCallback((platform: string) => {
    setDeviceData(prev => ({ ...prev, productPlatform: platform }));
    debouncedSave({ productPlatform: platform });
  });

  const onBaseProductSelect = useStableCallback((productId: string) => {
    debouncedSave({ parent_product_id: productId });
  });

  // Combined handler to avoid double debounced saves and UI freeze
  const onPlatformAndBaseSelect = useStableCallback(async (platform: string, baseProductId: string) => {
    try {
      // Optimistically update platform locally
      setDeviceData(prev => ({ ...prev, productPlatform: platform }));

      // Cancel any queued debounced saves that might conflict
      (debouncedSave as any)?.cancel?.();

      const toastId = (toast as any).loading ? (toast as any).loading('Saving platform…') : undefined;

      const { error } = await supabase
        .from('products')
        .update({
          product_platform: platform,
          parent_product_id: baseProductId,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (toastId && (toast as any).dismiss) (toast as any).dismiss(toastId);

      if (error) {
        toast.error('Failed to save platform');
        return;
      }

      toast.success('Platform and base product saved');
    } catch {
      toast.error('Failed to save platform');
    }
  });

  const onIsActiveDeviceChange = useStableCallback((value: boolean) => {
    setDeviceData(prev => ({ ...prev, isActiveDevice: value }));
    debouncedSave({ isActiveDevice: value });
  });

  const onKeyTechnologyCharacteristicsChange = useStableCallback((value: DeviceCharacteristics) => {
    setDeviceData(prev => ({ ...prev, keyTechnologyCharacteristics: value }));
    // Use immediate save for System Architecture (critical field) - no debounce
    immediateSave({ keyTechnologyCharacteristics: value });
  });

  // Handler for primaryRegulatoryType - now independent from System/Procedure Pack toggle
  const onPrimaryRegulatoryTypeChange = useStableCallback((value: string) => {
    // Only update primaryRegulatoryType, don't touch isSystemOrProcedurePack
    // System/Procedure Pack is now managed independently via the toggle
    setDeviceData(prev => ({ ...prev, primaryRegulatoryType: value }));
    debouncedSave({ primaryRegulatoryType: value });
  });
  
  const onCoreDeviceNatureChange = useStableCallback(createUpdateHandler('coreDeviceNature'));
  
  // IVD-specific update handlers
  const onSpecimenTypeChange = useStableCallback(createUpdateHandler('specimenType'));
  const onTestingEnvironmentChange = useStableCallback(createUpdateHandler('testingEnvironment'));
  const onAnalyticalPerformanceChange = useStableCallback(createUpdateHandler('analyticalPerformance'));
  const onClinicalPerformanceChange = useStableCallback(createUpdateHandler('clinicalPerformance'));
  
  // IVDR classification update handlers
  const onPrimaryTestCategoryChange = useStableCallback(createUpdateHandler('primaryTestCategory'));
  const onIvdrDeviceTypeChange = useStableCallback(createUpdateHandler('ivdrDeviceType'));
  const onControlCalibratorPropertiesChange = useStableCallback(createUpdateHandler('controlCalibratorProperties'));
  const onSelfTestingSubcategoryChange = useStableCallback(createUpdateHandler('selfTestingSubcategory'));

  // EMDN update handler
  const onEmdnChange = useStableCallback((categoryId: string, code: string, description: string) => {
    setDeviceData(prev => ({ 
      ...prev, 
      emdnCategoryId: categoryId,
      emdnCode: code,
      emdnDescription: description 
    }));
    debouncedSave({ 
      emdnCategoryId: categoryId,
      emdnCode: code,
      emdnDescription: description 
    });
  });

  // Strategic Partners update handler
  const onStrategicPartnersChange = useStableCallback((partners: StrategicPartners) => {
    setDeviceData(prev => ({ ...prev, strategicPartners: partners }));
    debouncedSave({ strategicPartners: partners });
  });

  // Storage, Sterility & Handling update handler
  const onStorageSterilityHandlingChange = useStableCallback((data: StorageSterilityHandlingData) => {
    setDeviceData(prev => ({ 
      ...prev, 
      storageSterilityHandling: data 
    }));
    debouncedSave({ 
      storageSterilityHandling: data 
    });
  });

  // TRL Level update handler
  const onTrlLevelChange = useStableCallback((value: number | null) => {
    setDeviceData(prev => ({
      ...prev,
      trlLevel: value
    }));
    // Use immediate save for TRL Level (critical Genesis field) - no debounce
    immediateSave({
      trlLevel: value
    });
  });

  // Calculate purpose-specific progress
  const calculatePurposeProgress = useCallback(() => {
    const purposeData = deviceData.intendedPurposeData || {} as IntendedPurposeData;
    
    // StatementOfUseTab uses: clinicalPurpose, indications, modeOfAction
    const statementOfUseFields = [
      (purposeData as any).clinicalPurpose?.trim() && (purposeData as any).clinicalPurpose.trim().length > 0,
      (purposeData as any).indications?.trim() && (purposeData as any).indications.trim().length > 0,
    ];
    
    // ContextOfUseTab uses: targetPopulation, useEnvironment, durationOfUse
    const contextOfUseFields = [
      (purposeData as any).targetPopulation && (purposeData as any).targetPopulation.length > 0,
      (purposeData as any).useEnvironment && (purposeData as any).useEnvironment.length > 0,
      (purposeData as any).durationOfUse?.trim() && (purposeData as any).durationOfUse.trim().length > 0
    ];
    
    // SafetyUsageTab uses: warnings
    const safetyUsageFields = [
      (purposeData as any).warnings && (purposeData as any).warnings.length > 0
    ];
    
    // Additional purpose-related fields from other components
    const additionalFields = [
      deviceData.intendedUse?.trim() && deviceData.intendedUse.trim().length > 0,
      deviceData.intendedUsers && deviceData.intendedUsers.length > 0,
      deviceData.contraindications && deviceData.contraindications.length > 0,
      deviceData.clinicalBenefits && deviceData.clinicalBenefits.length > 0,
      deviceData.userInstructions && Object.keys(deviceData.userInstructions).length > 0
    ];
    
    const allFields = [...statementOfUseFields, ...contextOfUseFields, ...safetyUsageFields, ...additionalFields];
    const completedFields = allFields.filter(field => field === true).length;
    
    const progress = Math.round((completedFields / allFields.length) * 100);
       
    return progress;
  }, [
    deviceData.intendedPurposeData,
    deviceData.intendedUse,
    deviceData.intendedUsers,
    deviceData.contraindications,
    deviceData.clinicalBenefits,
    deviceData.userInstructions
  ]);

  const handleAISuggestionsGenerated = (suggestions: FieldSuggestion[]) => {
    setAiSuggestions(suggestions);
  };

  // Calculate overall product completion progress
  const calculateOverallProgress = useMemo(() => {
    const purposeProgress = calculatePurposeProgress();
    
    // Helper function to check if a field has meaningful content
    const hasContent = (value: any): boolean => {
      if (!value) return false;
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object') {
        return Object.keys(value).length > 0;
      }
      return false;
    };
    
    const sections = {
      // Device Overview Section (25% weight)
      deviceOverview: (() => {
        const requiredFields = [
          hasContent(deviceData.productName),
          hasContent(deviceData.modelReference),
          hasContent(deviceData.deviceCategory),
          hasContent(deviceData.intendedUse),
          hasContent(deviceData.keyFeatures),
          hasContent(deviceData.deviceComponents)
        ];
        const completedFields = requiredFields.filter(field => field === true).length;
        return Math.round((completedFields / requiredFields.length) * 100);
      })(),

      // Identification & Traceability Section (20% weight)
      identification: (() => {
        const requiredFields = [
          hasContent(deviceData.basicUdiDi),
          hasContent(deviceData.udiDi),
          hasContent(deviceData.registrationNumber),
          hasContent(deviceData.notifiedBody)
        ];
        const completedFields = requiredFields.filter(field => field === true).length;
        return Math.round((completedFields / requiredFields.length) * 100);
      })(),

      // Regulatory Section (25% weight)
      regulatory: (() => {
        if (!deviceData.markets || deviceData.markets.length === 0) return 0;
        
        const selectedMarkets = deviceData.markets.filter(market => market.selected);
        if (selectedMarkets.length === 0) return 0;
        
        let totalFields = 0;
        let completedFields = 0;
        
        selectedMarkets.forEach(market => {
          const essentialFields = [
            hasContent(market.riskClass),
            hasContent(market.regulatoryStatus),
            hasContent(market.conformityAssessmentRoute)
          ];
          
          totalFields += essentialFields.length;
          completedFields += essentialFields.filter(field => field === true).length;
        });
        
        return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
      })(),

      // Intended Purpose Section (20% weight)
      intendedPurpose: purposeProgress,

      // Media & Documentation Section (10% weight)
      media: (() => {
        const hasImages = hasContent(deviceData.images);
        const hasVideos = hasContent(deviceData.videos);
        const hasDescription = hasContent(deviceData.description);
        
        const completedFields = [hasImages, hasVideos, hasDescription].filter(field => field === true).length;
        return Math.round((completedFields / 3) * 100);
      })()
    };

    // Calculate weighted overall progress
    const weights = {
      deviceOverview: 0.25,
      identification: 0.20,
      regulatory: 0.25,
      intendedPurpose: 0.20,
      media: 0.10
    };

    const overallProgress = Math.round(
      sections.deviceOverview * weights.deviceOverview +
      sections.identification * weights.identification +
      sections.regulatory * weights.regulatory +
      sections.intendedPurpose * weights.intendedPurpose +
      sections.media * weights.media
    );

    return Math.min(overallProgress, 100);
  }, [
    calculatePurposeProgress,
    deviceData.productName,
    deviceData.modelReference,
    deviceData.deviceCategory,
    deviceData.intendedUse,
    deviceData.keyFeatures,
    deviceData.deviceComponents,
    deviceData.basicUdiDi,
    deviceData.udiDi,
    deviceData.registrationNumber,
    deviceData.notifiedBody,
    deviceData.markets,
    deviceData.images,
    deviceData.videos,
    deviceData.description,
    deviceData.intendedPurposeData,
    deviceData.intendedUsers,
    deviceData.contraindications,
    deviceData.clinicalBenefits,
    deviceData.userInstructions
  ]);

  const handleAcceptAISuggestion = (fieldType: string, suggestion: string) => {
    switch (fieldType) {
      case 'intended_use':
        onIntendedUseChange(suggestion);
        break;
      case 'intended_function':
        // Map to intended purpose data change if available
        if (deviceData.intendedPurposeData) {
          onIntendedPurposeDataChange({
            ...deviceData.intendedPurposeData,
            intendedFunction: suggestion
          });
        }
        break;
      case 'mode_of_action':
        // Map to intended purpose data change if available
        if (deviceData.intendedPurposeData) {
          onIntendedPurposeDataChange({
            ...deviceData.intendedPurposeData,
            modeOfAction: suggestion
          });
        }
        break;
      case 'patient_population':
        // Map to intended purpose data change if available
        if (deviceData.intendedPurposeData) {
          onIntendedPurposeDataChange({
            ...deviceData.intendedPurposeData,
            intendedPatientPopulation: suggestion
          });
        }
        break;
      case 'intended_user':
        onIntendedUsersChange([suggestion]);
        break;
      case 'contraindications':
        onContraindicationsChange([suggestion]);
        break;
      default:
        // Unknown field type, silently ignore
    }
  };

  // Compute which fields are EUDAMED-locked (came from devices table) with original values
  const eudamedLockedFields = useMemo(() => {
    if (!deviceCharacteristics) return {};
    const d = deviceCharacteristics;
    const locked: Record<string, { locked: true; eudamedValue: boolean | string }> = {};
    if (d.measuring != null) locked.hasMeasuringFunction = { locked: true, eudamedValue: !!d.measuring };
    if (d.reusable != null) locked.isReusable = { locked: true, eudamedValue: !!d.reusable };
    if (d.single_use != null) locked.isSingleUse = { locked: true, eudamedValue: !!d.single_use };
    if (d.sterile != null) locked.isDeliveredSterile = { locked: true, eudamedValue: !!d.sterile };
    if (d.sterilization_need != null) {
      locked.isNonSterile = { locked: true, eudamedValue: !d.sterilization_need };
      locked.canBeSterilized = { locked: true, eudamedValue: !!d.sterilization_need };
    }
    if (d.active != null) locked.isActive = { locked: true, eudamedValue: !!d.active };
    if (d.contain_latex != null) locked.containsLatex = { locked: true, eudamedValue: !!d.contain_latex };
    if (d.administering_medicine != null) locked.incorporatesMedicinalSubstance = { locked: true, eudamedValue: !!d.administering_medicine };
    // Classification tab fields
    if (d.applicable_legislation != null) {
      const leg = (d.applicable_legislation as string).toUpperCase();
      if (leg.includes('IVDR') || leg.includes('IVDD') || leg.includes('98/79')) {
        locked.primaryRegulatoryType = { locked: true, eudamedValue: 'In Vitro Diagnostic (IVD)' };
      } else if (leg.includes('MDR') || leg.includes('MDD') || leg.includes('93/42') || leg.includes('2017/745')) {
        locked.primaryRegulatoryType = { locked: true, eudamedValue: 'Medical Device (MDR)' };
      }
    }
    if (d.implantable === true) {
      locked.coreDeviceNature = { locked: true, eudamedValue: 'Implantable' };
    } else if (d.implantable === false) {
      locked.coreDeviceNature = { locked: true, eudamedValue: 'Not Implantable' };
    }
    // Device ID tab fields
    if ((d as any).device_name) {
      locked.deviceName = { locked: true, eudamedValue: String((d as any).device_name).trim() };
    }
    if ((d as any).trade_names) {
      const raw = String((d as any).trade_names).trim();
      const first = raw.split(/[;|,]/)[0]?.trim();
      if (first) {
        locked.tradeName = { locked: true, eudamedValue: first };
      }
    }
    if ((d as any).device_model) {
      locked.deviceModel = { locked: true, eudamedValue: String((d as any).device_model).trim() };
    }
    if ((d as any).basic_udi_di_code) {
      locked.basicUdiDi = { locked: true, eudamedValue: String((d as any).basic_udi_di_code).trim() };
    }
    if ((d as any).udi_di) {
      locked.udiDi = { locked: true, eudamedValue: String((d as any).udi_di).trim() };
    }
    return locked;
  }, [deviceCharacteristics]);

  return (
    <div className="space-y-6">
      {/* Family Sync Status for variant products */}
      <FamilySyncStatusWidget productId={productId} />
      {/* key={productId} forces remount on product switch to prevent stale state */}
      <ComprehensiveDeviceInformation
      key={productId}
      referenceNumber={deviceData.referenceNumber}
      onReferenceNumberChange={onReferenceNumberChange}
      productName={deviceData.productName}
      tradeName={deviceData.tradeName}
      intendedUse={deviceData.intendedUse}
      intendedPurposeData={deviceData.intendedPurposeData}
      deviceType={deviceData.deviceType}
      deviceCategory={deviceData.deviceCategory}
      description={deviceData.description}
      modelReference={deviceData.modelReference}
      regulatoryStatus={deviceData.regulatoryStatus}
      keyFeatures={deviceData.keyFeatures}
      deviceComponents={deviceData.deviceComponents}
      images={deviceData.images}
      videos={deviceData.videos}
      basicUdiDi={deviceData.basicUdiDi}
      udiDi={deviceData.udiDi}
      udiPi={deviceData.udiPi}
      gtin={deviceData.gtin}
      modelVersion={deviceData.modelVersion}
      markets={deviceData.markets}
      ceMarkStatus={deviceData.ceMarkStatus}
      notifiedBody={deviceData.notifiedBody}
      isoCertifications={deviceData.isoCertifications}
      designFreezeDate={deviceData.designFreezeDate}
      currentLifecyclePhase={deviceData.currentLifecyclePhase}
      projectedLaunchDate={deviceData.projectedLaunchDate}
      actualLaunchDate={deviceData.actualLaunchDate}
      conformityAssessmentRoute={deviceData.conformityAssessmentRoute}
      intendedUsers={deviceData.intendedUsers}
      clinicalBenefits={deviceData.clinicalBenefits}
      userInstructions={deviceData.userInstructions}
      registrationNumber={deviceData.registrationNumber}
      registrationStatus={deviceData.registrationStatus}
      registrationDate={deviceData.registrationDate}
      marketAuthorizationHolder={deviceData.marketAuthorizationHolder}
      manufacturer={deviceData.manufacturer}
      manufacturerAddress={deviceData.manufacturerAddress}
      contraindications={deviceData.contraindications}
      totalNPV={deviceData.totalNPV}
      project_types={product?.project_types}
      is_line_extension={product?.is_line_extension}
      parent_product_id={product?.parent_product_id}
      base_product_name={product?.base_product_name}
      productPlatform={deviceData.productPlatform}
      hasLineExtensions={hasLineExtensions}
      hasProductUpgrades={hasProductUpgrades}
      isActiveDevice={deviceData.isActiveDevice}
      onProductNameChange={onProductNameChange}
      onTradeNameChange={onTradeNameChange}
      onIntendedUseChange={onIntendedUseChange}
      onIntendedPurposeDataChange={onIntendedPurposeDataChange}
      onDeviceTypeChange={onDeviceTypeChange}
      onDeviceCategoryChange={onDeviceCategoryChange}
      onDescriptionChange={onDescriptionChange}
      onModelReferenceChange={onModelReferenceChange}
      onKeyFeaturesChange={onKeyFeaturesChange}
      onDeviceComponentsChange={onDeviceComponentsChange}
      onImagesChange={onImagesChange}
      onVideosChange={onVideosChange}
      onBasicUdiDiChange={onBasicUdiDiChange}
      onUdiDiChange={onUdiDiChange}
      onUdiPiChange={onUdiPiChange}
      onGtinChange={onGtinChange}
      onModelVersionChange={onModelVersionChange}
       onMarketsChange={onMarketsChange}
       onMarketComponentClassificationChange={onMarketComponentClassificationChange}
      onCeMarkStatusChange={onCeMarkStatusChange}
      onNotifiedBodyChange={onNotifiedBodyChange}
      onIsoCertificationsChange={onIsoCertificationsChange}
      onDesignFreezeDateChange={onDesignFreezeDateChange}
      onCurrentLifecyclePhaseChange={onCurrentLifecyclePhaseChange}
      onProjectedLaunchDateChange={onProjectedLaunchDateChange}
      onConformityAssessmentRouteChange={onConformityAssessmentRouteChange}
      onIntendedUsersChange={onIntendedUsersChange}
      onClinicalBenefitsChange={onClinicalBenefitsChange}
      onUserInstructionsChange={onUserInstructionsChange}
      onRegistrationNumberChange={onRegistrationNumberChange}
      onRegistrationStatusChange={onRegistrationStatusChange}
      onRegistrationDateChange={onRegistrationDateChange}
      onMarketAuthorizationHolderChange={onMarketAuthorizationHolderChange}
      onContraindicationsChange={onContraindicationsChange}
      onCurrencyChange={onCurrencyChange}
      onMarketNPVChange={onMarketNPVChange}
      progress={calculateOverallProgress}
      purposeProgress={calculatePurposeProgress()}
      isLoading={isLoading}
      productId={productId}
      companyId={companyId}
      initialTab={initialTab}
      onProductPlatformChange={onProductPlatformChange}
      onBaseProductSelect={onBaseProductSelect}
      onIsActiveDeviceChange={onIsActiveDeviceChange}
       keyTechnologyCharacteristics={deviceData.keyTechnologyCharacteristics}
       onKeyTechnologyCharacteristicsChange={onKeyTechnologyCharacteristicsChange}
       primaryRegulatoryType={deviceData.primaryRegulatoryType}
       onPrimaryRegulatoryTypeChange={onPrimaryRegulatoryTypeChange}
       coreDeviceNature={deviceData.coreDeviceNature}
       onCoreDeviceNatureChange={onCoreDeviceNatureChange}
       // IVD-specific props
       specimenType={deviceData.specimenType}
       testingEnvironment={deviceData.testingEnvironment}
       analyticalPerformance={deviceData.analyticalPerformance}
       clinicalPerformance={deviceData.clinicalPerformance}
        onSpecimenTypeChange={onSpecimenTypeChange}
        onTestingEnvironmentChange={onTestingEnvironmentChange}
        onAnalyticalPerformanceChange={onAnalyticalPerformanceChange}
        onClinicalPerformanceChange={onClinicalPerformanceChange}
        // IVDR classification props
        primaryTestCategory={deviceData.primaryTestCategory}
        ivdrDeviceType={deviceData.ivdrDeviceType}
        controlCalibratorProperties={deviceData.controlCalibratorProperties}
        selfTestingSubcategory={deviceData.selfTestingSubcategory}
        onPrimaryTestCategoryChange={onPrimaryTestCategoryChange}
        onIvdrDeviceTypeChange={onIvdrDeviceTypeChange}
        onControlCalibratorPropertiesChange={onControlCalibratorPropertiesChange}
        onSelfTestingSubcategoryChange={onSelfTestingSubcategoryChange}
         // EMDN props
         emdnCategoryId={deviceData.emdnCategoryId}
         emdnCode={deviceData.emdnCode}
         emdnDescription={deviceData.emdnDescription}
         onEmdnChange={onEmdnChange}
         // Storage, Sterility & Handling props
         storageSterilityHandling={deviceData.storageSterilityHandling}
        onStorageSterilityHandlingChange={onStorageSterilityHandlingChange}
        // TRL Level props
        trlLevel={deviceData.trlLevel}
        onTrlLevelChange={onTrlLevelChange}
        // AI suggestions props
            currentFdaCode={(product as any).fda_product_code}
            onFdaCodeSelected={() => {
              // Refetch product data when FDA code is updated
              window.location.reload();
            }}
            aiSuggestions={aiSuggestions}
            onAcceptAISuggestion={handleAcceptAISuggestion}
        // Product data for EUDAMED components
        productData={product}
        model_id={(product as any)?.model_id}
        eudamedLockedFields={eudamedLockedFields}
        productHazards={productHazards}
        onAddHazard={handleAddHazardFromFeature}
        variantInheritance={variantInheritance}
      />
    </div>
  );
}
