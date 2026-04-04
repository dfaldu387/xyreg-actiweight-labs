/**
 * Device class-based clinical evidence guidance
 * Extracted from ViabilityWizard for reuse across the application
 */

export interface DeviceClassGuidance {
  title: string;
  bullets: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
}

/**
 * Returns clinical evidence recommendations based on device classification
 */
export function getDeviceClassGuidance(deviceClass: string | null | undefined): DeviceClassGuidance | null {
  if (!deviceClass) return null;

  // Normalize the class string - replace underscores with spaces for consistent matching
  let classLower = deviceClass.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ').trim();

  // Handle simple formats without "class" prefix (e.g., "III", "IIb", "IIa", "I")
  // Add "class " prefix if not present for consistent matching
  if (!classLower.includes('class') && !classLower.includes('510k') && !classLower.includes('pma')) {
    classLower = 'class ' + classLower;
  }

  // Helper to check for exact class match (avoids "iii" matching "ii")
  const hasClass = (str: string, cls: string) => {
    // Check for exact word boundary match
    const regex = new RegExp(`\\b${cls}\\b`, 'i');
    return regex.test(str);
  };

  // Very high risk - EU Class III, Class IV, Class D, PMA (check first as it's most specific)
  if (classLower.includes('eu class iii') || classLower.includes('uk class iii') ||
      classLower.includes('au class iii') ||
      hasClass(classLower, 'class d') ||
      classLower.includes('pma') ||
      classLower.includes('ca class iv') || classLower.includes('jp class iv') ||
      classLower.includes('kr class iv') || classLower.includes('br class iv') ||
      (hasClass(classLower, 'class iv'))) {
    return {
      title: 'Based on your Class III/IV/D/PMA device:',
      bullets: [
        'Pre-market clinical investigation is required',
        'Rigorous clinical evidence mandatory',
        'Plan for 100-500+ patients with statistical powering',
      ],
      riskLevel: 'very-high',
    };
  }
  // High risk - Class IIb, Class III, Class C (check before medium risk)
  else if (hasClass(classLower, 'class iib') || hasClass(classLower, 'iib') ||
           hasClass(classLower, 'class iii') || hasClass(classLower, 'iii') ||
           hasClass(classLower, 'class c') ||
           classLower.includes('ca class iii') || classLower.includes('jp class iii') ||
           classLower.includes('kr class iii') || classLower.includes('cn class iii') ||
           classLower.includes('br class iii')) {
    return {
      title: 'Based on your Class IIb/III/C device:',
      bullets: [
        'Pre-market clinical investigation often required',
        'Literature alone typically insufficient',
        'Plan for 50-200 patients depending on endpoints',
      ],
      riskLevel: 'high',
    };
  }
  // Medium risk - Class IIa, Class II, Class B
  else if (hasClass(classLower, 'class iia') || hasClass(classLower, 'iia') ||
           hasClass(classLower, 'class ii') || hasClass(classLower, 'ii') ||
           hasClass(classLower, 'class b') || classLower.includes('510k') ||
           classLower.includes('ca class ii') || classLower.includes('jp class ii') ||
           classLower.includes('kr class ii') || classLower.includes('br class ii') ||
           classLower.includes('cn class ii')) {
    return {
      title: 'Based on your Class IIa/II/B device:',
      bullets: [
        'Literature or equivalence data often acceptable',
        'PMCF may be required depending on market',
        'Plan for 20-100 patients if conducting studies',
      ],
      riskLevel: 'medium',
    };
  }
  // Low risk - Class I, Class A, 510(k) exempt
  else if (hasClass(classLower, 'class i') || hasClass(classLower, 'i') ||
           hasClass(classLower, 'class a') ||
           classLower.includes('510k exempt')) {
    return {
      title: 'Based on your Class I/A device:',
      bullets: [
        'Literature review is typically sufficient',
        'Pre-market clinical trials are rarely required',
        'Focus on technical documentation and risk analysis',
      ],
      riskLevel: 'low',
    };
  }

  return null;
}

/**
 * Extracts device class from product data (handles multiple data sources)
 */
export function extractDeviceClass(product: any): string | null {
  if (!product) {
    return null;
  }

  // Check if this is a SiMD or System Pack device - need to check component classification
  const techCharacteristics = product.key_technology_characteristics;
  const isSiMD = techCharacteristics === 'SiMD (Software in a Medical Device)' ||
                 techCharacteristics === 'simd';
  const isSystemPack = techCharacteristics === 'Procedure/System Pack';

  // For SiMD/System Pack, check componentClassification in markets first (new pattern)
  if (isSiMD || isSystemPack) {
    if (product.markets && Array.isArray(product.markets)) {
      // Check componentClassification.overallRiskClass in selected markets
      const selectedMarkets = product.markets.filter((m: any) => m.selected);
      for (const market of selectedMarkets) {
        if (market.componentClassification?.overallRiskClass) {
          return market.componentClassification.overallRiskClass;
        }
      }
      // Fall back to any market with componentClassification
      for (const market of product.markets) {
        if (market.componentClassification?.overallRiskClass) {
          return market.componentClassification.overallRiskClass;
        }
      }
    }

    // Legacy: check simd_components (old pattern)
    const simdComponents = product.simd_components;
    if (simdComponents && Array.isArray(simdComponents)) {
      const classifiedComponents = simdComponents.filter((c: any) =>
        c.riskClass && c.riskClass !== '' && c.riskClass !== 'Select class'
      );
      if (classifiedComponents.length > 0) {
        return classifiedComponents[0].riskClass;
      }
    }
    return null; // SiMD/System Pack but no components classified
  }

  // Try markets array first (per-market classification for non-SiMD)
  if (product.markets && Array.isArray(product.markets)) {
    const selectedMarket = product.markets.find((m: any) => m.selected);
    if (selectedMarket?.riskClass) {
      return selectedMarket.riskClass;
    }
    // Fall back to first market with riskClass
    const marketWithClass = product.markets.find((m: any) => m.riskClass);
    if (marketWithClass?.riskClass) {
      return marketWithClass.riskClass;
    }
  }
  
  // Fall back to product-level class (check all possible fields)
  if (product.device_class) return product.device_class;
  if (product.class) return product.class;
  if (product.eudamed_risk_class) return product.eudamed_risk_class;

  // Check for risk class in key_features (EUDAMED data)
  if (product.key_features?.eudamed_data?.risk_class) {
    return product.key_features.eudamed_data.risk_class;
  }

  // Check for any market with regulatory status that implies classification
  if (product.markets && Array.isArray(product.markets)) {
    const marketWithRegStatus = product.markets.find((m: any) =>
      m.selected && m.regulatoryStatus
    );
    if (marketWithRegStatus?.regulatoryStatus) {
      // If device has CE marking or FDA approval, it must be classified
      // Return a reasonable default based on regulatory status
      const status = marketWithRegStatus.regulatoryStatus;
      if (status === 'CE_MARKED' || status === 'FDA_CLEARED' || status === 'FDA_APPROVED') {
        // Check if there's any risk class info we might have missed
        if (marketWithRegStatus.riskClass) return marketWithRegStatus.riskClass;
      }
    }
  }

  return null;
}
