import { useMemo } from 'react';
import { useProductDetails } from './useProductDetails';
import { IntendedPurposeData } from '@/types/client';

interface ProgressCalculation {
  overview: number;
  purpose: number;
  basics: number;
  identification: number;
  regulatory: number;
  risk: number;
}

export function useProductDefinitionProgress(productId?: string): ProgressCalculation {
  const { data: product } = useProductDetails(productId);

  const progress = useMemo(() => {
    if (!product) {
      return {
        overview: 0,
        purpose: 0,
        basics: 0,
        identification: 0,
        regulatory: 0,
        risk: 0
      };
    }

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

    // Overview Progress
    const calculateOverviewProgress = (): number => {
      const purposeProgress = calculatePurposeProgress();
      
      const sections = {
        // Device Overview Section (25% weight)
        deviceOverview: (() => {
          const requiredFields = [
            hasContent(product.name),
            hasContent(product.model_reference),
            hasContent(product.device_category),
            hasContent(product.intended_use),
            hasContent(product.key_features),
            hasContent(product.device_components)
          ];
          const completedFields = requiredFields.filter(field => field === true).length;
          return Math.round((completedFields / requiredFields.length) * 100);
        })(),

        // Identification & Traceability Section (20% weight)
        identification: (() => {
          const requiredFields = [
            hasContent(product.basic_udi_di),
            hasContent(product.udi_di),
            hasContent(product.eudamed_registration_number),
            hasContent(product.notified_body)
          ];
          const completedFields = requiredFields.filter(field => field === true).length;
          return Math.round((completedFields / requiredFields.length) * 100);
        })(),

        // Regulatory Section (25% weight)
        regulatory: (() => {
          if (!product.markets || product.markets.length === 0) return 0;
          
          // Parse markets if it's a string
          let markets = product.markets;
          if (typeof markets === 'string') {
            try {
              markets = JSON.parse(markets);
            } catch (e) {
              return 0;
            }
          }
          
          if (!Array.isArray(markets)) return 0;
          
          const selectedMarkets = markets.filter((market: any) => market.selected);
          if (selectedMarkets.length === 0) return 0;
          
          let totalFields = 0;
          let completedFields = 0;
          
          selectedMarkets.forEach((market: any) => {
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
          const hasImages = hasContent((product as any).images);
          const hasVideos = hasContent(product.videos);
          const hasDescription = hasContent(product.description);
          
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
    };

    // Purpose Progress (Intended Purpose Tab)
    const calculatePurposeProgress = (): number => {
      const purposeData = product.intended_purpose_data || {} as IntendedPurposeData;
      
      // Statement of Use fields
      const statementOfUseFields = [
        (purposeData as any)?.clinicalPurpose?.trim() && (purposeData as any).clinicalPurpose.trim().length > 0,
        (purposeData as any)?.indications?.trim() && (purposeData as any).indications.trim().length > 0
      ];
      
      // Context of Use fields
      const contextOfUseFields = [
        (purposeData as any)?.targetPopulation && (purposeData as any).targetPopulation.length > 0,
        (purposeData as any)?.useEnvironment && (purposeData as any).useEnvironment.length > 0,
        (purposeData as any)?.durationOfUse?.trim() && (purposeData as any).durationOfUse.trim().length > 0
      ];
      
      // Safety Usage fields
      const safetyUsageFields = [
        (purposeData as any)?.warnings && (purposeData as any).warnings.length > 0
      ];
      
      // Additional purpose-related fields
      const additionalFields = [
        product.intended_use?.trim() && product.intended_use.trim().length > 0,
        product.intended_users && product.intended_users.length > 0,
        product.contraindications && product.contraindications.length > 0,
        product.clinical_benefits && product.clinical_benefits.length > 0,
        product.user_instructions && Object.keys(product.user_instructions).length > 0
      ];
      
      const allFields = [...statementOfUseFields, ...contextOfUseFields, ...safetyUsageFields, ...additionalFields];
      const completedFields = allFields.filter(field => field === true).length;
      
      return Math.round((completedFields / allFields.length) * 100);
    };

    // Basics Progress (General Tab) - Match ComprehensiveDeviceInformation calculation exactly
    const calculateBasicsProgress = (): number => {
      // Extract values exactly like DeviceInformationContainer does
      const primaryRegulatoryType = (product as any).primary_regulatory_type || '';
      
      // Extract coreDeviceNature from device_type JSON like DeviceInformationContainer
      let coreDeviceNature = '';
      try {
        let deviceTypeData = product.device_type;
        
        // Handle string case - parse JSON
        if (typeof deviceTypeData === 'string') {
          deviceTypeData = JSON.parse(deviceTypeData);
        }
        
        // Handle object case
        if (typeof deviceTypeData === 'object' && deviceTypeData) {
          coreDeviceNature = (deviceTypeData as any)?.invasivenessLevel || '';
        }
      } catch (e) {
        console.error('Error parsing device_type for coreDeviceNature:', e);
        coreDeviceNature = '';
      }
      
      // Extract keyTechnologyCharacteristics like DeviceInformationContainer
      const keyTechnologyCharacteristics = (product as any).key_technology_characteristics || {};
      
      const requiredFields = [
        product.name?.trim(),                           
        product.model_reference?.trim(),                 
        product.device_category?.trim(),                 
        primaryRegulatoryType?.trim(),                   
        coreDeviceNature?.trim(),                          
        keyTechnologyCharacteristics && Object.keys(keyTechnologyCharacteristics).length > 0 ? 'has_tech_characteristics' : null,
        product.key_features && product.key_features.length > 0 ? 'has_features' : null,
        product.device_components && product.device_components.length > 0 ? 'has_components' : null 
      ];
      
      const completedFields = requiredFields.filter(field => field !== null && field !== undefined && field !== '').length;
      return Math.round((completedFields / requiredFields.length) * 100);
    };

    // Identification Progress
    const calculateIdentificationProgress = (): number => {
      // UDI Fields (4)
      const udiFields = [
        product.basic_udi_di,
        product.udi_di,
        product.udi_pi,
        product.gtin
      ];
      
      // EUDAMED Fields (7)
      const eudamedFields = [
        product.eudamed_registration_number,
        product.registration_status,
        product.registration_date,
        product.market_authorization_holder,
        product.notified_body,
        product.ce_mark_status,
        product.conformity_assessment_route
      ];
      
      const allFields = [...udiFields, ...eudamedFields];
      const completedFields = allFields.filter(field => field && field.toString().trim().length > 0).length;
      
      return allFields.length > 0 ? Math.round((completedFields / allFields.length) * 100) : 0;
    };

    // Regulatory Progress (Regulatory Tab)
    const calculateRegulatoryProgress = (): number => {
      if (!product.markets || product.markets.length === 0) return 0;
      
      // Parse markets if it's a string
      let markets = product.markets;
      if (typeof markets === 'string') {
        try {
          markets = JSON.parse(markets);
        } catch (e) {
          return 0;
        }
      }
      
      if (!Array.isArray(markets)) return 0;
      
      const selectedMarkets = markets.filter((market: any) => market.selected);
      if (selectedMarkets.length === 0) return 0;
      
      let totalFields = 0;
      let completedFields = 0;
      
      selectedMarkets.forEach((market: any) => {
        // Essential fields for each market (using actual properties)
        const essentialFields = [
          market.riskClass,
          market.conformityAssessmentRoute,
          market.regulatoryStatus
        ];
        
        totalFields += essentialFields.length;
        completedFields += essentialFields.filter(field => field && field.toString().trim().length > 0).length;
        
        const additionalFields = [
          market.certificateNumber,
          market.launchDate,
          market.customRequirements
        ];
        
        totalFields += additionalFields.length * 0.5;
        completedFields += additionalFields.filter(field => field && field.toString().trim().length > 0).length * 0.5;
      });
      
      return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    };

    // Risk Progress (Risk Management Tab) - Match RiskManagementTab calculation exactly
    const calculateRiskProgress = (): number => {
      // Parse markets if it's a string
      let markets = product.markets;
      if (typeof markets === 'string') {
        try {
          markets = JSON.parse(markets);
        } catch (e) {
          markets = [];
        }
      }
      
      if (!Array.isArray(markets)) {
        markets = [];
      }
      
      const selectedMarkets = markets.filter((market: any) => market.selected);
      const hasSelectedMarkets = selectedMarkets.length > 0;
      const hasRiskClassifications = selectedMarkets.some((market: any) => market.riskClass) || product.class;
      
      let score = 0;
      if (hasSelectedMarkets) score += 40;
      if (hasRiskClassifications) score += 60;
      
      return score;
    };

    return {
      overview: calculateOverviewProgress(),
      purpose: calculatePurposeProgress(),
      basics: calculateBasicsProgress(),
      identification: calculateIdentificationProgress(),
      regulatory: calculateRegulatoryProgress(),
      risk: calculateRiskProgress()
    };
  }, [product]);

  return progress;
}
