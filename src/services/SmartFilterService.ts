import { ComprehensiveMdrItem } from "@/data/comprehensiveMdrAnnexI";

export interface DeviceCharacteristics {
  isActive?: boolean;
  isImplantable?: boolean;
  hasBodyContact?: boolean;
  bodyContactType?: 'none' | 'intact_skin' | 'invasive';
  containsSoftware?: boolean;
  isProvidedSterile?: boolean;
  userType?: 'professional' | 'lay_person';
  emitsRadiation?: boolean;
  radiationType?: 'ionizing' | 'non_ionizing' | 'laser' | 'none';
  isPowered?: boolean;
  powerSource?: 'internal' | 'external' | 'none';
  hasConnectivity?: boolean;
  isMeasuring?: boolean;
  releasesParticles?: boolean;
  hasDisplays?: boolean;
  isReusable?: boolean;
  deviceCategory?: string;
  deviceType?: string;
  riskClass?: string;
}

export interface SmartFilterResult {
  applicable: ComprehensiveMdrItem[];
  excluded: Array<{
    item: ComprehensiveMdrItem;
    reason: string;
    isAutomatic: boolean;
  }>;
  summary: {
    totalItems: number;
    applicableCount: number;
    excludedCount: number;
    autoExcludedCount: number;
  };
}

export class SmartFilterService {
  
  /**
   * Apply smart filtering to MDR items based on device characteristics
   */
  static applySmartFilter(
    items: ComprehensiveMdrItem[], 
    characteristics: DeviceCharacteristics,
    manualOverrides: Record<string, boolean> = {}
  ): SmartFilterResult {
    const applicable: ComprehensiveMdrItem[] = [];
    const excluded: Array<{
      item: ComprehensiveMdrItem;
      reason: string;
      isAutomatic: boolean;
    }> = [];

    items.forEach(item => {
      // Check for manual override first
      const itemId = item.id;
      if (manualOverrides[itemId] !== undefined) {
        if (manualOverrides[itemId]) {
          applicable.push({
            ...item,
            isAutoExcluded: false,
            automaticNaReason: undefined
          });
        } else {
          excluded.push({
            item: item,
            reason: "Manually excluded by user",
            isAutomatic: false
          });
        }
        return;
      }

      // Apply automatic exclusion logic
      const exclusionReason = this.getExclusionReason(item, characteristics);
      
      if (exclusionReason) {
        excluded.push({
          item: {
            ...item,
            isAutoExcluded: true,
            automaticNaReason: exclusionReason
          },
          reason: exclusionReason,
          isAutomatic: true
        });
      } else {
        applicable.push({
          ...item,
          isAutoExcluded: false,
          automaticNaReason: undefined
        });
      }
    });

    const autoExcludedCount = excluded.filter(e => e.isAutomatic).length;

    return {
      applicable,
      excluded,
      summary: {
        totalItems: items.length,
        applicableCount: applicable.length,
        excludedCount: excluded.length,
        autoExcludedCount
      }
    };
  }

  /**
   * Determine if an item should be excluded based on device characteristics
   */
  private static getExclusionReason(
    item: ComprehensiveMdrItem, 
    characteristics: DeviceCharacteristics
  ): string | null {
    
    if (!item.excludesIf || item.excludesIf === "Never excluded") {
      return null;
    }

    const excludesIf = item.excludesIf.toLowerCase();

    // Body contact exclusions
    if (excludesIf.includes("device has no body contact")) {
      if (!characteristics.hasBodyContact) {
        return "Device has no body contact";
      }
    }

    // Software exclusions
    if (excludesIf.includes("device contains no software")) {
      if (!characteristics.containsSoftware) {
        return "Device contains no software";
      }
    }

    // Active implant exclusions
    if (excludesIf.includes("device is not an active implantable medical device") || 
        excludesIf.includes("device is not an active implant")) {
      if (!characteristics.isActive || !characteristics.isImplantable) {
        return "Device is not an active implantable medical device";
      }
    }

    // Sterility exclusions
    if (excludesIf.includes("device is not provided sterile")) {
      if (!characteristics.isProvidedSterile) {
        return "Device is not provided sterile";
      }
    }

    // User type exclusions
    if (excludesIf.includes("device is for professional use only")) {
      if (characteristics.userType === 'professional') {
        return "Device is for professional use only";
      }
    }

    // Radiation exclusions
    if (excludesIf.includes("device does not emit radiation") || 
        excludesIf.includes("device does not emit ionizing radiation")) {
      if (!characteristics.emitsRadiation || characteristics.radiationType === 'none') {
        return "Device does not emit radiation";
      }
      if (excludesIf.includes("ionizing") && characteristics.radiationType !== 'ionizing') {
        return "Device does not emit ionizing radiation";
      }
    }

    // Electrical device exclusions
    if (excludesIf.includes("device is non-electrical")) {
      if (!characteristics.isPowered) {
        return "Device is non-electrical";
      }
    }

    // Connectivity exclusions
    if (excludesIf.includes("device is standalone with no interconnections")) {
      if (!characteristics.hasConnectivity) {
        return "Device is standalone with no interconnections";
      }
    }

    // Measurement exclusions
    if (excludesIf.includes("device does not perform measurements")) {
      if (!characteristics.isMeasuring) {
        return "Device does not perform measurements";
      }
    }

    // Display exclusions
    if (excludesIf.includes("device has no displays")) {
      if (!characteristics.hasDisplays) {
        return "Device has no displays or measurement functions";
      }
    }

    // Particle release exclusions
    if (excludesIf.includes("device does not release particles")) {
      if (!characteristics.releasesParticles) {
        return "Device does not release particles";
      }
    }

    // Reusability exclusions
    if (excludesIf.includes("device is single-use only")) {
      if (!characteristics.isReusable) {
        return "Device is single-use only";
      }
    }

    // Environmental exposure exclusions
    if (excludesIf.includes("device has no environmental exposure")) {
      if (characteristics.bodyContactType === 'none' && !characteristics.hasConnectivity) {
        return "Device has no environmental exposure";
      }
    }

    // Sealed device exclusions
    if (excludesIf.includes("device is completely sealed")) {
      // This would need more specific device information to determine
      // For now, we'll leave this as applicable unless specified otherwise
    }

    return null; // Item is applicable
  }

  /**
   * Extract device characteristics from product information
   */
  static extractDeviceCharacteristics(product: any): DeviceCharacteristics {
    // Extract characteristics from product data
    // This would analyze the device information to determine characteristics
    
    const characteristics: DeviceCharacteristics = {
      isActive: this.determineIfActive(product),
      isImplantable: this.determineIfImplantable(product),
      hasBodyContact: this.determineBodyContact(product),
      bodyContactType: this.determineBodyContactType(product),
      containsSoftware: this.determineIfContainsSoftware(product),
      isProvidedSterile: this.determineIfProvidedSterile(product),
      userType: this.determineUserType(product),
      emitsRadiation: this.determineIfEmitsRadiation(product),
      radiationType: this.determineRadiationType(product),
      isPowered: this.determineIfPowered(product),
      powerSource: this.determinePowerSource(product),
      hasConnectivity: this.determineIfHasConnectivity(product),
      isMeasuring: this.determineIfMeasuring(product),
      releasesParticles: this.determineIfReleasesParticles(product),
      hasDisplays: this.determineIfHasDisplays(product),
      isReusable: this.determineIfReusable(product),
      deviceCategory: product?.device_category,
      deviceType: product?.description,
      riskClass: this.determineRiskClass(product)
    };

    return characteristics;
  }

  // Helper methods to determine device characteristics
  private static determineIfActive(product: any): boolean {
    const category = product?.device_category?.toLowerCase() || '';
    const description = product?.description?.toLowerCase() || '';
    
    return category.includes('active') || 
           description.includes('powered') || 
           description.includes('electronic') ||
           description.includes('electrical');
  }

  private static determineIfImplantable(product: any): boolean {
    const category = product?.device_category?.toLowerCase() || '';
    const description = product?.description?.toLowerCase() || '';
    
    return category.includes('implant') || 
           description.includes('implant') ||
           description.includes('implantable');
  }

  private static determineBodyContact(product: any): boolean {
    const category = product?.device_category?.toLowerCase() || '';
    const description = product?.description?.toLowerCase() || '';
    
    // Most medical devices have some form of body contact
    // Only exclude if explicitly stated as external/remote
    return !description.includes('external monitoring') && 
           !description.includes('remote') &&
           !category.includes('laboratory');
  }

  private static determineBodyContactType(product: any): 'none' | 'intact_skin' | 'invasive' {
    const description = product?.description?.toLowerCase() || '';
    
    if (description.includes('invasive') || 
        description.includes('surgical') || 
        description.includes('injection') ||
        description.includes('implant')) {
      return 'invasive';
    }
    
    if (description.includes('skin contact') || 
        description.includes('topical') ||
        description.includes('surface')) {
      return 'intact_skin';
    }
    
    if (description.includes('remote') || 
        description.includes('external monitoring')) {
      return 'none';
    }
    
    return 'intact_skin'; // Default assumption for medical devices
  }

  private static determineIfContainsSoftware(product: any): boolean {
    const description = product?.description?.toLowerCase() || '';
    const category = product?.device_category?.toLowerCase() || '';
    
    return description.includes('software') || 
           description.includes('digital') ||
           description.includes('electronic') ||
           description.includes('app') ||
           category.includes('software');
  }

  private static determineIfProvidedSterile(product: any): boolean {
    const description = product?.description?.toLowerCase() || '';
    
    return description.includes('sterile') || 
           description.includes('single-use') ||
           description.includes('disposable');
  }

  private static determineUserType(product: any): 'professional' | 'lay_person' {
    const description = product?.description?.toLowerCase() || '';
    
    if (description.includes('home use') || 
        description.includes('patient use') ||
        description.includes('consumer')) {
      return 'lay_person';
    }
    
    return 'professional'; // Default assumption
  }

  private static determineIfEmitsRadiation(product: any): boolean {
    const description = product?.description?.toLowerCase() || '';
    
    return description.includes('radiation') || 
           description.includes('x-ray') ||
           description.includes('laser') ||
           description.includes('ultrasound') ||
           description.includes('radiofrequency');
  }

  private static determineRadiationType(product: any): 'ionizing' | 'non_ionizing' | 'laser' | 'none' {
    const description = product?.description?.toLowerCase() || '';
    
    if (description.includes('x-ray') || description.includes('gamma')) {
      return 'ionizing';
    }
    
    if (description.includes('laser')) {
      return 'laser';
    }
    
    if (description.includes('ultrasound') || 
        description.includes('radiofrequency') ||
        description.includes('magnetic')) {
      return 'non_ionizing';
    }
    
    return 'none';
  }

  private static determineIfPowered(product: any): boolean {
    return this.determineIfActive(product);
  }

  private static determinePowerSource(product: any): 'internal' | 'external' | 'none' {
    const description = product?.description?.toLowerCase() || '';
    
    if (!this.determineIfPowered(product)) {
      return 'none';
    }
    
    if (description.includes('battery') || description.includes('implant')) {
      return 'internal';
    }
    
    return 'external'; // Default for powered devices
  }

  private static determineIfHasConnectivity(product: any): boolean {
    const description = product?.description?.toLowerCase() || '';
    
    return description.includes('connected') || 
           description.includes('network') ||
           description.includes('bluetooth') ||
           description.includes('wifi') ||
           description.includes('interface');
  }

  private static determineIfMeasuring(product: any): boolean {
    const description = product?.description?.toLowerCase() || '';
    const category = product?.device_category?.toLowerCase() || '';
    
    return description.includes('measure') || 
           description.includes('monitor') ||
           description.includes('sensor') ||
           description.includes('diagnostic') ||
           category.includes('monitoring');
  }

  private static determineIfReleasesParticles(product: any): boolean {
    const description = product?.description?.toLowerCase() || '';
    
    return description.includes('aerosol') || 
           description.includes('powder') ||
           description.includes('particle') ||
           description.includes('spray');
  }

  private static determineIfHasDisplays(product: any): boolean {
    const description = product?.description?.toLowerCase() || '';
    
    return description.includes('display') || 
           description.includes('screen') ||
           description.includes('monitor') ||
           this.determineIfMeasuring(product);
  }

  private static determineIfReusable(product: any): boolean {
    const description = product?.description?.toLowerCase() || '';
    
    return !description.includes('single-use') && 
           !description.includes('disposable') &&
           !description.includes('single use');
  }

  private static determineRiskClass(product: any): string {
    // Extract from markets data or other product information
    const markets = product?.markets || {};
    
    // Try to find risk class from EU market data
    if (markets.EU && markets.EU.riskClass) {
      return markets.EU.riskClass;
    }
    
    // Default classification logic based on device type
    if (this.determineIfImplantable(product)) {
      return 'Class III';
    }
    
    if (this.determineIfActive(product)) {
      return 'Class IIa';
    }
    
    return 'Class I';
  }
}