import { useMemo } from 'react';

export type RegulatoryType = 'Medical Device (MD)' | 'In Vitro Diagnostic (IVD)' | 'System/Procedure Pack';

interface ConditionalFormConfig {
  regulatoryType?: string;
}

interface ConditionalFormResult {
  showTab: (tabId: string) => boolean;
  showSection: (sectionId: string) => boolean;
  getTabTitle: (tabId: string) => string;
  getSectionTitle: (sectionId: string) => string;
  getHelpText: (contextId: string) => string;
}

export function useConditionalForm({ regulatoryType }: ConditionalFormConfig): ConditionalFormResult {
  const isIVD = regulatoryType === 'In Vitro Diagnostic (IVD)';
  const isSystem = regulatoryType === 'System/Procedure Pack';
  const isMedicalDevice = regulatoryType === 'Medical Device (MD)';

  return useMemo(() => {
    const showTab = (tabId: string): boolean => {
      switch (tabId) {
        case 'overview':
        case 'purpose':
        case 'basics':
          return true; // Always show these core tabs
        
        case 'identification':
          return true; // All types need identification
        
        case 'regulatory':
          return true; // All types have regulatory requirements
        
        case 'npv':
          return true; // All types need NPV analysis
        
        case 'lifecycle':
          return true; // All types have lifecycle management
        
        default:
          return true;
      }
    };

    const showSection = (sectionId: string): boolean => {
      switch (sectionId) {
        // Core sections - always show
        case 'deviceIdentification':
        case 'primaryRegulatoryType':
          return true;
        
        // Device nature - modify for IVD
        case 'coreDeviceNature':
          return !isIVD; // IVDs don't use invasiveness classification
        
        case 'ivdSpecimenType':
          return isIVD; // Only show for IVDs
        
        // Technology characteristics - different for each type
        case 'keyTechnologyCharacteristics':
          return true; // Show for all but with different options
        
        // Components - different importance for systems
        case 'deviceComponents':
          return true; // Show for all, but required for systems
        
        default:
          return true;
      }
    };

    const getTabTitle = (tabId: string): string => {
      const baseTitles: Record<string, string> = {
        overview: 'Overview',
        purpose: '1. Purpose',
        basics: '2. General',
        identification: '3. Identification & Traceability',
        regulatory: '4. Regulatory',
        npv: '5. NPV',
        lifecycle: '6. Lifecycle'
      };

      // Modify titles based on regulatory type
      if (isIVD) {
        return baseTitles[tabId]?.replace('Device', 'Diagnostic') || baseTitles[tabId] || tabId;
      }
      
      if (isSystem) {
        return baseTitles[tabId]?.replace('Device', 'System') || baseTitles[tabId] || tabId;
      }

      return baseTitles[tabId] || tabId;
    };

    const getSectionTitle = (sectionId: string): string => {
      const baseTitles: Record<string, string> = {
        deviceIdentification: 'Device Identification',
        primaryRegulatoryType: 'Primary Regulatory Type',
        coreDeviceNature: 'Core Device Nature & Invasiveness',
        ivdSpecimenType: 'Specimen Type & Testing Environment',
        keyTechnologyCharacteristics: 'Key Technology & Characteristics',
        deviceComponents: 'Device Components',
        keyFeatures: 'Key Features',
        deviceMedia: 'Device Media'
      };

      // Modify titles based on regulatory type
      if (isIVD) {
        const ivdTitles: Record<string, string> = {
          deviceIdentification: 'Diagnostic Identification',
          keyTechnologyCharacteristics: 'Analytical & Clinical Characteristics',
          deviceComponents: 'Assay Components'
        };
        return ivdTitles[sectionId] || baseTitles[sectionId] || sectionId;
      }

      if (isSystem) {
        const systemTitles: Record<string, string> = {
          deviceIdentification: 'System Identification',
          deviceComponents: 'Constituent Devices',
          keyTechnologyCharacteristics: 'System-Level Characteristics'
        };
        return systemTitles[sectionId] || baseTitles[sectionId] || sectionId;
      }

      return baseTitles[sectionId] || sectionId;
    };

    const getHelpText = (contextId: string): string => {
      const baseHelp: Record<string, string> = {
        regulatoryTypeChange: 'The form will adapt to show relevant fields for your selection.',
        ivdClassification: 'IVDs have their own classification system (List A, List B, Self-testing, Other).',
        systemComponents: 'For systems, define each constituent device that makes up the complete system.'
      };

      if (isIVD) {
        return baseHelp[contextId + '_ivd'] || baseHelp[contextId] || '';
      }

      if (isSystem) {
        return baseHelp[contextId + '_system'] || baseHelp[contextId] || '';
      }

      return baseHelp[contextId] || '';
    };

    return {
      showTab,
      showSection,
      getTabTitle,
      getSectionTitle,
      getHelpText
    };
  }, [regulatoryType, isIVD, isSystem, isMedicalDevice]);
}