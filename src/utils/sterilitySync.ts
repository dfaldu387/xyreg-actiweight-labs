import { DeviceCharacteristics } from '@/types/client.d';
import { StorageSterilityHandlingData } from '@/types/storageHandling';

/**
 * Synchronizes sterility information from Technical Specifications to Storage & Handling
 * This ensures a single source of truth for sterility requirements
 */
export function syncSterilityFromTechSpecs(
  characteristics: DeviceCharacteristics,
  storageData: StorageSterilityHandlingData
): StorageSterilityHandlingData {
  // Determine if device is sterile based on technical specifications
  const isDeliveredSterile = characteristics.isDeliveredSterile || false;
  
  // Update storage data based on technical specifications
  return {
    ...storageData,
    isSterile: isDeliveredSterile,
    // Clear sterilization details if device is not delivered sterile
    sterilizationMethod: isDeliveredSterile ? storageData.sterilizationMethod : '',
    sterilityAssuranceLevel: isDeliveredSterile ? storageData.sterilityAssuranceLevel : '',
    sterileBarrierSystemDescription: isDeliveredSterile ? storageData.sterileBarrierSystemDescription : undefined,
    sterilizationMethodOther: isDeliveredSterile ? storageData.sterilizationMethodOther : undefined
  };
}

/**
 * Checks if sterilization details should be shown in Storage section
 */
export function shouldShowSterilizationDetails(characteristics: DeviceCharacteristics): boolean {
  return characteristics.isDeliveredSterile || false;
}

/**
 * Checks if re-sterilization instructions should be shown in Storage section
 */
export function shouldShowResterilizationInstructions(characteristics: DeviceCharacteristics): boolean {
  return characteristics.canBeSterilized || false;
}

/**
 * Gets sterility status text based on technical specifications
 */
export function getSterilityStatusText(characteristics: DeviceCharacteristics): string {
  if (characteristics.isDeliveredSterile) {
    return 'Device is delivered sterile';
  }
  if (characteristics.canBeSterilized) {
    return 'Device can be sterilized/re-sterilized by the user';
  }
  if (characteristics.isNonSterile) {
    return 'Device is non-sterile';
  }
  return 'Sterility status not specified';
}