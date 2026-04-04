import { useTemplateSettings } from "./useTemplateSettings";
import { 
  calculateCheckCharacter, 
  formatBasicUDI, 
  generateUDIDI,
  validateUDIDI,
  getPackagingLevels
} from "@/utils/udiCheckCharacters";
import { 
  UDICompanyPrefixService, 
  type PrefixSuggestionRequest, 
  type PrefixSuggestionResponse 
} from "@/services/udiCompanyPrefixService";
import { useState } from "react";

export interface UDIConfiguration {
  issuingAgency: string;
  companyPrefix: string;
  isConfigured: boolean;
}

export function useUDIConfiguration(companyId: string) {
  const { settings, isLoading, refetch } = useTemplateSettings(companyId);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const configuration: UDIConfiguration = {
    issuingAgency: settings.udi_issuing_agency || '',
    companyPrefix: settings.udi_company_prefix || '',
    isConfigured: settings.udi_configured || false
  };

  const generateUDIExample = (deviceIdentifier: string): string => {
    if (!configuration.isConfigured || !deviceIdentifier) {
      return '';
    }

    const { issuingAgency, companyPrefix } = configuration;
    
    try {
      const combinedCode = `${companyPrefix}${deviceIdentifier}`;
      const checkChar = calculateCheckCharacter(issuingAgency, combinedCode);
      return formatBasicUDI(issuingAgency, companyPrefix, deviceIdentifier, checkChar);
    } catch (error) {
      // Fallback to simple format if check character calculation fails
      switch (issuingAgency) {
        case 'GS1':
          return `(01)${companyPrefix}${deviceIdentifier}`;
        case 'HIBCC':
          return `+${companyPrefix}${deviceIdentifier}`;
        case 'ICCBBA':
          return `=${companyPrefix}${deviceIdentifier}`;
        case 'EUDAMED':
          return `D-${companyPrefix}${deviceIdentifier}`;
        default:
          return `${companyPrefix}${deviceIdentifier}`;
      }
    }
  };

  const validateUDICode = (code: string): { valid: boolean; error?: string } => {
    if (!configuration.isConfigured) {
      return { valid: false, error: 'UDI configuration not set up' };
    }

    if (!code.trim()) {
      return { valid: false, error: 'UDI code is required' };
    }

    const { issuingAgency, companyPrefix } = configuration;

    switch (issuingAgency) {
      case 'GS1':
        if (!code.includes(`(01)${companyPrefix}`)) {
          return { valid: false, error: `GS1 UDI must contain your company prefix: ${companyPrefix}` };
        }
        break;
      case 'HIBCC':
        if (!code.startsWith(`+${companyPrefix}`)) {
          return { valid: false, error: `HIBCC UDI must start with +${companyPrefix}` };
        }
        break;
      case 'ICCBBA':
        if (!code.startsWith(`=${companyPrefix}`)) {
          return { valid: false, error: `ICCBBA UDI must start with =${companyPrefix}` };
        }
        break;
      case 'EUDAMED':
        if (!code.startsWith(`D-${companyPrefix}`) && !code.startsWith(`B-${companyPrefix}`)) {
          return { valid: false, error: `EUDAMED UDI must start with D-${companyPrefix} or B-${companyPrefix}` };
        }
        break;
    }

    return { valid: true };
  };

  const getUDIFormatInfo = () => {
    if (!configuration.isConfigured) {
      return null;
    }

    const { issuingAgency, companyPrefix } = configuration;

    switch (issuingAgency) {
      case 'GS1':
        return {
          format: 'GS1 Format',
          structure: '(01)[Company Prefix][Device Identifier]',
          example: `(01)${companyPrefix}123456`,
          description: 'Standard GS1 format with Application Identifier (01)'
        };
      case 'HIBCC':
        return {
          format: 'HIBCC Format',
          structure: '+[LIC][Device Identifier]',
          example: `+${companyPrefix}123456`,
          description: 'HIBCC format starting with + followed by your LIC'
        };
      case 'ICCBBA':
        return {
          format: 'ICCBBA Format',
          structure: '=[Facility ID][Device Identifier]',
          example: `=${companyPrefix}123456`,
          description: 'ICCBBA format starting with = followed by your Facility ID'
        };
      case 'EUDAMED':
        return {
          format: 'EUDAMED Format',
          structure: 'D-[SRN][Device Reference] / B-[SRN][Device Reference]',
          example: `D-${companyPrefix}9G64607CUA`,
          description: 'EUDAMED-allocated format with D- (UDI-DI) or B- (Basic UDI-DI) prefix and embedded SRN'
        };
      default:
        return null;
    }
  };

  const generateBasicUDI = (internalReference: string): string => {
    if (!configuration.isConfigured || !internalReference) {
      return '';
    }

    const { issuingAgency, companyPrefix } = configuration;
    
    try {
      const combinedCode = `${companyPrefix}${internalReference}`;
      const checkChar = calculateCheckCharacter(issuingAgency, combinedCode);
      return formatBasicUDI(issuingAgency, companyPrefix, internalReference, checkChar);
    } catch (error) {
      return '';
    }
  };

  // Generate UDI-DI for product labels
  const generateProductUDIDI = (
    companyPrefix: string,
    itemReference: string,
    packageLevelIndicator: number = 0
  ): string => {
    if (!configuration.isConfigured) {
      throw new Error('UDI configuration not set up');
    }

    return generateUDIDI(
      configuration.issuingAgency,
      companyPrefix,
      itemReference,
      packageLevelIndicator
    );
  };

  // Validate UDI-DI
  const validateProductUDIDI = (udiDI: string): { valid: boolean; error?: string } => {
    if (!configuration.isConfigured) {
      return { valid: false, error: 'UDI configuration not set up' };
    }

    return validateUDIDI(udiDI, configuration.issuingAgency);
  };

  // Get packaging levels
  const getPackagingLevelOptions = (): { value: number; label: string; description: string }[] => {
    return getPackagingLevels();
  };

  // Suggest company prefix based on EUDAMED data
  const suggestCompanyPrefix = async (
    issuingAgency: string, 
    companyIdentifier?: string
  ): Promise<PrefixSuggestionResponse> => {
    setIsSuggesting(true);
    try {
      const request: PrefixSuggestionRequest = {
        company_id: companyId,
        issuing_agency: issuingAgency,
        company_identifier: companyIdentifier
      };

      const response = await UDICompanyPrefixService.suggestCompanyPrefix(request);
      console.log('UDI Prefix suggestion result:', response);
      return response;
    } catch (error) {
      console.error('Error suggesting company prefix:', error);
      throw error;
    } finally {
      setIsSuggesting(false);
    }
  };

  return {
    configuration,
    isLoading,
    isSuggesting,
    refetch,
    generateUDIExample,
    generateBasicUDI,
    validateUDICode,
    getUDIFormatInfo,
    generateProductUDIDI,
    validateProductUDIDI,
    getPackagingLevelOptions,
    suggestCompanyPrefix,
  };
}