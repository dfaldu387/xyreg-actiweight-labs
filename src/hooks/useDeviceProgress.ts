
import { useMemo } from 'react';
import { DeviceCharacteristics, EnhancedProductMarket, IntendedPurposeData } from '@/types/client.d';
import { Device3DModel } from '@/types';

interface DeviceProgressProps {
  productName?: string;
  modelReference?: string;
  deviceType?: string | DeviceCharacteristics;
  deviceCategory?: string;
  deviceClass?: "I" | "IIa" | "IIb" | "III";
  regulatoryStatus?: string;
  primaryRegulatoryType?: string;
  coreDeviceNature?: string;
  isActiveDevice?: boolean;
  anatomicalLocation?: string;
  keyTechnologyCharacteristics?: DeviceCharacteristics;
  intendedUse?: string;
  intendedPurposeData?: IntendedPurposeData;
  keyFeatures?: string[];
  deviceComponents?: Array<{ name: string; description: string }>;
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
  designFreezeDate?: string | Date | null;
  currentLifecyclePhase?: string;
  projectedLaunchDate?: string | Date | null;
  conformityAssessmentRoute?: string;
  intendedUsers?: string[];
  clinicalBenefits?: string[];
  userInstructions?: {
    how_to_use?: string;
    charging?: string;
    maintenance?: string;
  };
  registrationNumber?: string;
  registrationStatus?: string;
  registrationDate?: string | Date | null;
  marketAuthorizationHolder?: string;
  contraindications?: string[];
  totalNPV?: number;
  selectedCurrency?: string;
  models3D?: Device3DModel[];
  deviceCompliance?: string[];
  deviceSummary?: string;
}

export function useDeviceProgress(props: DeviceProgressProps) {
  return useMemo(() => {
    // Helper function to determine software classification completion
    const getSoftwareClassificationValue = (keyTech?: DeviceCharacteristics) => {
      if (!keyTech) return 0;
      
      // Count as complete if exactly one software option is selected (mutual exclusion)
      const selections = [
        keyTech.isSoftwareAsaMedicalDevice === true,
        keyTech.isSoftwareMobileApp === true, 
        keyTech.noSoftware === true
      ];
      const selectedCount = selections.filter(Boolean).length;
      return selectedCount === 1 ? 1 : 0;
    };

    // Helper function to determine sterility requirements completion
    const getSterilityRequirementsValue = (keyTech?: DeviceCharacteristics) => {
      if (!keyTech) return 0;
      
      // Count as complete if exactly one sterility option is selected (mutual exclusion)
      const selections = [
        keyTech.isNonSterile === true,
        keyTech.isDeliveredSterile === true,
        keyTech.canBeSterilized === true
      ];
      const selectedCount = selections.filter(Boolean).length;
      return selectedCount === 1 ? 1 : 0;
    };

    // Helper function to check if energy delivery is defined
    const getEnergyDeliveryValue = (keyTech?: DeviceCharacteristics) => {
      if (!keyTech) return 0;
      
      const hasEnergyInfo = keyTech.deliversTherapeuticEnergy !== undefined || 
                           keyTech.deliversDiagnosticEnergy !== undefined ||
                           keyTech.energyType !== undefined;
      
      return hasEnergyInfo ? 1 : 0;
    };

    // Helper function to check if biological/material properties are defined
    const getBiologicalPropertiesValue = (keyTech?: DeviceCharacteristics) => {
      if (!keyTech) return 0;
      
      const hasBiologicalInfo = keyTech.biologicalOrigin !== undefined ||
                               keyTech.isAbsorbedByBody !== undefined ||
                               keyTech.administersMedicine !== undefined ||
                               keyTech.containsNanomaterials !== undefined ||
                               keyTech.containsHumanAnimalMaterial !== undefined ||
                               keyTech.incorporatesMedicinalSubstance !== undefined;
      
      return hasBiologicalInfo ? 1 : 0;
    };
    // Define sections with their fields and weights
    const sectionDefinitions = {
      deviceOverview: {
        name: "Device Overview",
        fields: [
          { key: 'productName', weight: 4, value: props.productName },
          { key: 'deviceType', weight: 4, value: props.deviceType },
          { key: 'deviceCategory', weight: 3, value: props.deviceCategory },
          { key: 'deviceClass', weight: 4, value: props.deviceClass },
          { key: 'modelReference', weight: 2, value: props.modelReference },
          { key: 'keyFeatures', weight: 3, value: props.keyFeatures?.length },
          { key: 'deviceComponents', weight: 3, value: props.deviceComponents?.length },
          { key: 'images', weight: 2, value: props.images?.length },
          { key: 'videos', weight: 1, value: props.videos?.length },
          { key: 'models3D', weight: 1, value: props.models3D?.length }
        ]
      },
      intendedPurpose: {
        name: "Intended Purpose",
        fields: [
          { key: 'intendedUse', weight: 5, value: props.intendedUse },
          { key: 'intendedPurposeData', weight: 4, value: props.intendedPurposeData && Object.keys(props.intendedPurposeData).length > 0 ? 1 : 0 },
          { key: 'contraindications', weight: 2, value: props.contraindications?.length },
          { key: 'intendedUsers', weight: 3, value: props.intendedUsers?.length },
          { key: 'clinicalBenefits', weight: 2, value: props.clinicalBenefits?.length }
        ]
      },
      udiInformation: {
        name: "UDI Information", 
        fields: [
          { key: 'basicUdiDi', weight: 4, value: props.basicUdiDi },
          { key: 'udiDi', weight: 3, value: props.udiDi },
          { key: 'gtin', weight: 3, value: props.gtin },
          { key: 'modelVersion', weight: 2, value: props.modelVersion }
        ]
      },
      targetMarkets: {
        name: "Target Markets",
        fields: [
          { key: 'markets', weight: 5, value: props.markets?.filter(m => m.selected).length }
        ]
      },
      regulatoryClassification: {
        name: "Regulatory Classification", 
        fields: [
          { key: 'primaryRegulatoryType', weight: 2, value: props.primaryRegulatoryType && props.primaryRegulatoryType !== 'not_defined' && props.primaryRegulatoryType !== '' ? props.primaryRegulatoryType : null },
          { key: 'coreDeviceNature', weight: 2, value: props.coreDeviceNature && props.coreDeviceNature !== 'not_defined' && props.coreDeviceNature !== '' ? props.coreDeviceNature : null },
          { key: 'anatomicalLocation', weight: 1, value: props.anatomicalLocation && props.anatomicalLocation !== 'not_defined' ? props.anatomicalLocation : null },
          { key: 'isActiveDevice', weight: 1, value: props.isActiveDevice !== undefined ? 1 : 0 },
          { key: 'softwareClassification', weight: 2, value: getSoftwareClassificationValue(props.keyTechnologyCharacteristics) },
          { key: 'hasMeasuringFunction', weight: 1, value: props.keyTechnologyCharacteristics?.hasMeasuringFunction === true ? 1 : 0 },
          { key: 'isReusable', weight: 1, value: props.keyTechnologyCharacteristics?.isReusable === true ? 1 : 0 },
          { key: 'sterilityRequirements', weight: 2, value: getSterilityRequirementsValue(props.keyTechnologyCharacteristics) },
          { key: 'energyDelivery', weight: 1, value: getEnergyDeliveryValue(props.keyTechnologyCharacteristics) },
          { key: 'biologicalProperties', weight: 1, value: getBiologicalPropertiesValue(props.keyTechnologyCharacteristics) }
        ]
      },
      regulatoryInfo: {
        name: "Regulatory Information",
        fields: [
          { key: 'ceMarkStatus', weight: 3, value: props.ceMarkStatus },
          { key: 'conformityAssessmentRoute', weight: 3, value: props.conformityAssessmentRoute },
          { key: 'regulatoryStatus', weight: 2, value: props.regulatoryStatus },
          { key: 'notifiedBody', weight: 2, value: props.notifiedBody },
          { key: 'isoCertifications', weight: 2, value: props.isoCertifications?.length }
        ]
      },
      npvAnalysis: {
        name: "NPV Analysis",
        fields: [
          { key: 'totalNPV', weight: 3, value: props.totalNPV && props.totalNPV > 0 ? 1 : 0 },
          { key: 'selectedCurrency', weight: 1, value: props.selectedCurrency }
        ]
      },
      lifecycleInfo: {
        name: "Lifecycle Information",
        fields: [
          { key: 'currentLifecyclePhase', weight: 3, value: props.currentLifecyclePhase },
          { key: 'designFreezeDate', weight: 2, value: props.designFreezeDate },
          { key: 'projectedLaunchDate', weight: 2, value: props.projectedLaunchDate }
        ]
      },
      intendedUsers: {
        name: "Intended Users",
        fields: [
          { key: 'intendedUsers', weight: 2, value: props.intendedUsers?.length },
          { key: 'clinicalBenefits', weight: 2, value: props.clinicalBenefits?.length },
          { key: 'contraindications', weight: 1, value: props.contraindications?.length }
        ]
      },
      eudamedRegistration: {
        name: "EUDAMED Registration",
        fields: [
          { key: 'registrationNumber', weight: 2, value: props.registrationNumber },
          { key: 'registrationStatus', weight: 2, value: props.registrationStatus },
          { key: 'registrationDate', weight: 1, value: props.registrationDate },
          { key: 'marketAuthorizationHolder', weight: 1, value: props.marketAuthorizationHolder }
        ]
      }
    };

    // Calculate section progress
    const sections: Record<string, number> = {};
    let totalWeight = 0;
    let completedWeight = 0;
    let totalFields = 0;
    let completedFields = 0;

    Object.entries(sectionDefinitions).forEach(([sectionKey, section]) => {
      let sectionWeight = 0;
      let sectionCompletedWeight = 0;
      let sectionTotalFields = section.fields.length;
      let sectionCompletedFields = 0;

      section.fields.forEach(field => {
        sectionWeight += field.weight;
        totalWeight += field.weight;
        totalFields += 1;

        const hasValue = field.value !== undefined && 
                        field.value !== null && 
                        field.value !== '' && 
                        field.value !== 0 &&
                        (typeof field.value !== 'number' || field.value > 0);
        
        if (hasValue) {
          sectionCompletedWeight += field.weight;
          completedWeight += field.weight;
          sectionCompletedFields += 1;
          completedFields += 1;
        }
      });

      sections[sectionKey] = sectionWeight > 0 ? Math.round((sectionCompletedWeight / sectionWeight) * 100) : 0;
    });

    const progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    return {
      progress: Math.min(progress, 100),
      sections,
      totalFields,
      completedFields
    };
  }, [
    props.productName, props.modelReference, props.deviceType, props.deviceCategory,
    props.deviceClass, props.regulatoryStatus, props.intendedUse, props.intendedPurposeData,
    props.keyFeatures, props.deviceComponents, props.images, props.videos, props.models3D,
    props.basicUdiDi, props.udiDi, props.udiPi, props.gtin, props.modelVersion,
    props.markets, props.ceMarkStatus, props.notifiedBody, props.isoCertifications,
    props.designFreezeDate, props.currentLifecyclePhase, props.projectedLaunchDate,
    props.conformityAssessmentRoute, props.intendedUsers, props.clinicalBenefits,
    props.userInstructions, props.registrationNumber, props.registrationStatus,
    props.registrationDate, props.marketAuthorizationHolder, props.contraindications,
    props.totalNPV, props.selectedCurrency, props.deviceCompliance, props.deviceSummary,
    props.primaryRegulatoryType, props.coreDeviceNature, props.isActiveDevice, 
    props.anatomicalLocation, props.keyTechnologyCharacteristics
  ]);
}
