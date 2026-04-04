// UDI-PI Requirements Engine
// Determines production identifier requirements based on device characteristics and target markets

export type RequirementStatus = 'required' | 'recommended' | 'optional' | 'not_applicable';

export interface PIRequirement {
  status: RequirementStatus;
  reason: string;
  regulatoryRef?: string;
}

export interface UDIPIRequirements {
  lot_batch: PIRequirement;
  serial_number: PIRequirement;
  manufacturing_date: PIRequirement;
  expiration_date: PIRequirement;
  software_version: PIRequirement;
}

export interface DeviceProfile {
  // Core characteristics (from device definition)
  deviceClass?: string | null;
  isImplantable?: boolean;
  isReusable?: boolean;
  isSterile?: boolean;
  isSingleUse?: boolean;
  hasSoftware?: boolean;
  hasExpirationDate?: boolean;
  targetMarkets?: string[]; // e.g., ['EU', 'US', 'CA']
  
  // Additional assessment characteristics (from smart questions)
  hasDegradableMaterials?: boolean;      // Materials that degrade over time (adhesives, batteries, biologics)
  requiresCalibration?: boolean;          // Periodic calibration/maintenance needed
  hasTimeBasedPerformance?: boolean;      // Performance changes over time (e.g., batteries, sensors)
  isActiveDevice?: boolean;               // Has power source (affects traceability)
  containsBiologicalMaterial?: boolean;   // Blood, tissue, cells - strict traceability required
  isCustomFabricated?: boolean;           // Patient-specific device (serial number critical)
  hasMultipleComponents?: boolean;        // Kit with multiple items (assembly tracking)
}

// Assessment questions configuration
export interface AssessmentQuestion {
  id: keyof Pick<DeviceProfile, 
    'hasDegradableMaterials' | 'requiresCalibration' | 'hasTimeBasedPerformance' | 
    'isActiveDevice' | 'containsBiologicalMaterial' | 'isCustomFabricated' | 'hasMultipleComponents'>;
  question: string;
  helpText: string;
  impacts: string[];
  relevantFor?: (profile: DeviceProfile) => boolean; // Show only when relevant
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'hasDegradableMaterials',
    question: 'Does your device contain materials that degrade over time?',
    helpText: 'Examples: adhesives, batteries, biodegradable polymers, lubricants that dry out',
    impacts: ['Expiration Date', 'Manufacturing Date'],
    relevantFor: (profile) => !profile.isSterile && profile.hasExpirationDate !== true,
  },
  {
    id: 'requiresCalibration',
    question: 'Does your device require periodic maintenance or calibration?',
    helpText: 'Examples: diagnostic equipment, measuring devices, monitoring systems',
    impacts: ['Serial Number'],
    relevantFor: (profile) => !profile.isImplantable && !profile.isSingleUse,
  },
  {
    id: 'hasTimeBasedPerformance',
    question: 'Does your device have performance that changes over time?',
    helpText: 'Examples: batteries that deplete, sensors that drift, filters that clog',
    impacts: ['Manufacturing Date', 'Expiration Date'],
    relevantFor: (profile) => profile.hasExpirationDate !== true && !profile.isSterile,
  },
  {
    id: 'containsBiologicalMaterial',
    question: 'Does your device contain biological material?',
    helpText: 'Examples: human tissue, blood products, cells, animal-derived materials',
    impacts: ['Lot/Batch', 'Expiration Date', 'Serial Number'],
    relevantFor: () => true, // Always relevant - critical safety question
  },
  {
    id: 'isCustomFabricated',
    question: 'Is this a patient-specific or custom-fabricated device?',
    helpText: 'Examples: custom implants, 3D printed devices made to patient specs, prosthetics',
    impacts: ['Serial Number'],
    relevantFor: (profile) => !profile.isImplantable, // Implantables already require serial
  },
  {
    id: 'hasMultipleComponents',
    question: 'Is your device a kit with multiple components?',
    helpText: 'Examples: surgical kits, procedure packs, multi-component systems',
    impacts: ['Lot/Batch'],
    relevantFor: () => true,
  },
];

// Normalize device class to a standard format
function normalizeClass(deviceClass?: string | null): string {
  if (!deviceClass) return '';
  const normalized = deviceClass.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // EU MDR classes
  if (normalized.includes('iii') || normalized === '3') return 'III';
  if (normalized.includes('iib')) return 'IIb';
  if (normalized.includes('iia')) return 'IIa';
  if (normalized.includes('i') && !normalized.includes('ii')) return 'I';
  
  // FDA classes (numbered)
  if (normalized === '1' || normalized === 'classi') return 'I';
  if (normalized === '2' || normalized === 'classii') return 'II';
  if (normalized === '3' || normalized === 'classiii') return 'III';
  
  return deviceClass;
}

// Check if device targets EU market
function hasEUMarket(markets?: string[]): boolean {
  if (!markets) return true; // Default to EU rules if no markets specified
  return markets.some(m => 
    m.toUpperCase() === 'EU' || 
    m.toLowerCase().includes('europe') ||
    m.toLowerCase().includes('mdr')
  );
}

// Check if device targets US market
function hasUSMarket(markets?: string[]): boolean {
  if (!markets) return false;
  return markets.some(m => 
    m.toUpperCase() === 'US' || 
    m.toUpperCase() === 'USA' ||
    m.toLowerCase().includes('fda')
  );
}

// Helper to upgrade requirement status
function upgradeStatus(
  current: PIRequirement, 
  newStatus: RequirementStatus, 
  reason: string,
  regulatoryRef?: string
): PIRequirement {
  const priority: Record<RequirementStatus, number> = {
    'required': 4,
    'recommended': 3,
    'optional': 2,
    'not_applicable': 1,
  };
  
  if (priority[newStatus] > priority[current.status]) {
    return {
      status: newStatus,
      reason,
      regulatoryRef: regulatoryRef || current.regulatoryRef,
    };
  }
  return current;
}

export function calculateUDIPIRequirements(profile: DeviceProfile): UDIPIRequirements {
  const deviceClass = normalizeClass(profile.deviceClass);
  const isHighRisk = deviceClass === 'III' || deviceClass === 'IIb';
  const isEU = hasEUMarket(profile.targetMarkets);
  const isUS = hasUSMarket(profile.targetMarkets);
  
  // ========== LOT/BATCH NUMBER ==========
  let lotBatch: PIRequirement;
  if (profile.isImplantable) {
    lotBatch = {
      status: 'required',
      reason: 'Required for all implantable devices to enable traceability for recalls and adverse event investigations',
      regulatoryRef: isEU ? 'EU MDR Article 27(4)' : 'FDA 21 CFR 830.60',
    };
  } else if (profile.isSingleUse || profile.isSterile) {
    lotBatch = {
      status: 'required',
      reason: 'Required for sterile and single-use devices to track production batches and ensure product integrity',
      regulatoryRef: isEU ? 'EU MDR Annex VI Part C' : 'FDA UDI Rule',
    };
  } else {
    lotBatch = {
      status: 'required',
      reason: 'Minimum requirement for all devices - enables batch-level traceability',
      regulatoryRef: isEU ? 'EU MDR Article 27(1)(a)(iv)' : 'FDA 21 CFR 801.45',
    };
  }

  // Upgrade for biological materials
  if (profile.containsBiologicalMaterial) {
    lotBatch = upgradeStatus(
      lotBatch,
      'required',
      'Required for biological material traceability - enables donor/source tracking for safety',
      isEU ? 'EU MDR Annex IX 4.2' : 'FDA 21 CFR 1271'
    );
  }

  // Upgrade for multi-component kits
  if (profile.hasMultipleComponents) {
    lotBatch = upgradeStatus(
      lotBatch,
      'required',
      'Required for kit/multi-component devices - tracks assembly combinations for quality control',
      isEU ? 'EU MDR Annex VI Part C' : 'FDA 21 CFR 820.120'
    );
  }

  // ========== SERIAL NUMBER ==========
  let serialNumber: PIRequirement;
  if (profile.isImplantable) {
    serialNumber = {
      status: 'required',
      reason: 'Mandatory for implantable devices - enables individual unit tracking throughout device lifecycle',
      regulatoryRef: isEU ? 'EU MDR Article 27(4)' : 'FDA 21 CFR 830.60',
    };
  } else if (deviceClass === 'III') {
    serialNumber = {
      status: 'required',
      reason: 'Required for Class III devices due to high-risk classification',
      regulatoryRef: isEU ? 'EU MDR Article 27(4)' : 'FDA UDI Final Rule',
    };
  } else if (profile.isReusable && isHighRisk) {
    serialNumber = {
      status: 'required',
      reason: 'Required for reusable high-risk devices - tracks usage, maintenance, and reprocessing cycles',
      regulatoryRef: isEU ? 'EU MDR Article 27(4)' : 'FDA 21 CFR 830.60',
    };
  } else if (profile.isReusable) {
    serialNumber = {
      status: 'recommended',
      reason: 'Recommended for reusable devices to track individual unit history and maintenance records',
    };
  } else {
    serialNumber = {
      status: 'optional',
      reason: 'Optional for non-implantable, single-use devices - may enhance traceability but not required',
    };
  }

  // Upgrade for biological materials - critical traceability
  if (profile.containsBiologicalMaterial) {
    serialNumber = upgradeStatus(
      serialNumber,
      'required',
      'Required for biological material devices - enables individual unit traceability to donor/source',
      isEU ? 'EU MDR Annex IX 4.2, Directive 2004/23/EC' : 'FDA 21 CFR 1271'
    );
  }

  // Upgrade for custom-fabricated devices
  if (profile.isCustomFabricated) {
    serialNumber = upgradeStatus(
      serialNumber,
      'required',
      'Required for patient-specific devices - enables individual unit tracking to specific patient',
      isEU ? 'EU MDR Article 52(8)' : 'FDA Custom Device Exemption'
    );
  }

  // Upgrade for devices requiring calibration
  if (profile.requiresCalibration) {
    serialNumber = upgradeStatus(
      serialNumber,
      'recommended',
      'Recommended for devices requiring calibration - enables tracking of calibration history per unit'
    );
  }

  // ========== MANUFACTURING DATE ==========
  let manufacturingDate: PIRequirement;
  if (!profile.hasExpirationDate && profile.isSterile) {
    manufacturingDate = {
      status: 'recommended',
      reason: 'Recommended when no expiration date applies - helps track device age for sterile products',
    };
  } else if (profile.isReusable) {
    manufacturingDate = {
      status: 'recommended',
      reason: 'Useful for reusable devices to determine age and expected service life',
    };
  } else {
    manufacturingDate = {
      status: 'optional',
      reason: 'Optional - provides additional traceability data when expiration date is not the primary time indicator',
    };
  }

  // Upgrade for degradable materials without expiration
  if (profile.hasDegradableMaterials && profile.hasExpirationDate !== true) {
    manufacturingDate = upgradeStatus(
      manufacturingDate,
      'recommended',
      'Recommended for devices with degradable materials - helps assess material age when no expiration applies'
    );
  }

  // Upgrade for time-based performance devices
  if (profile.hasTimeBasedPerformance) {
    manufacturingDate = upgradeStatus(
      manufacturingDate,
      'recommended',
      'Recommended for devices with time-based performance - enables assessment of expected remaining service life'
    );
  }

  // ========== EXPIRATION DATE ==========
  let expirationDate: PIRequirement;
  if (profile.isSterile) {
    expirationDate = {
      status: 'required',
      reason: 'Required for sterile devices - sterility has a defined expiration based on packaging integrity',
      regulatoryRef: 'ISO 11607-1, EU MDR Annex I Chapter III',
    };
  } else if (profile.isSingleUse && profile.hasExpirationDate !== false) {
    expirationDate = {
      status: 'required',
      reason: 'Required for devices with time-limited performance or stability',
      regulatoryRef: isEU ? 'EU MDR Annex I 23.2' : 'FDA 21 CFR 801.45',
    };
  } else if (profile.hasExpirationDate === false) {
    expirationDate = {
      status: 'not_applicable',
      reason: 'Not applicable - device has no time-sensitive components or shelf life limitations',
    };
  } else {
    expirationDate = {
      status: 'optional',
      reason: 'Consider if device materials degrade over time or have stability limitations',
    };
  }

  // Upgrade for biological materials - always required
  if (profile.containsBiologicalMaterial) {
    expirationDate = upgradeStatus(
      expirationDate,
      'required',
      'Required for biological material devices - biological components have defined viability windows',
      isEU ? 'EU MDR Annex I 23.2, Directive 2004/23/EC' : 'FDA 21 CFR 1271'
    );
  }

  // Upgrade for degradable materials
  if (profile.hasDegradableMaterials && expirationDate.status !== 'required') {
    expirationDate = upgradeStatus(
      expirationDate,
      'recommended',
      'Recommended for devices with degradable materials - materials may lose effectiveness over time'
    );
  }

  // Upgrade for time-based performance
  if (profile.hasTimeBasedPerformance && expirationDate.status !== 'required') {
    expirationDate = upgradeStatus(
      expirationDate,
      'recommended',
      'Recommended for devices with time-based performance - ensures device used within effective lifespan'
    );
  }

  // ========== SOFTWARE VERSION ==========
  let softwareVersion: PIRequirement;
  if (profile.hasSoftware) {
    softwareVersion = {
      status: 'required',
      reason: 'Required when device contains software - software version is critical for identifying specific software releases',
      regulatoryRef: isEU ? 'EU MDR Article 27(1)(a)(iv), IVDR Article 24' : 'FDA 21 CFR 830.60(d)',
    };
  } else {
    softwareVersion = {
      status: 'not_applicable',
      reason: 'Not applicable - device does not contain software components',
    };
  }

  return {
    lot_batch: lotBatch,
    serial_number: serialNumber,
    manufacturing_date: manufacturingDate,
    expiration_date: expirationDate,
    software_version: softwareVersion,
  };
}

// Get relevant assessment questions based on device profile
export function getRelevantAssessmentQuestions(profile: DeviceProfile): AssessmentQuestion[] {
  return ASSESSMENT_QUESTIONS.filter(q => {
    // Skip if already answered via device definition
    if (profile[q.id] !== undefined) return false;
    // Check relevance based on profile
    return q.relevantFor ? q.relevantFor(profile) : true;
  });
}

// Generate a human-readable device profile summary
export function generateProfileSummary(profile: DeviceProfile): string[] {
  const summary: string[] = [];
  
  if (profile.deviceClass) {
    summary.push(`Class ${normalizeClass(profile.deviceClass)}`);
  }
  
  if (profile.isImplantable) summary.push('Implantable');
  if (profile.isSterile) summary.push('Sterile');
  if (profile.isSingleUse) summary.push('Single-use');
  if (profile.isReusable) summary.push('Reusable');
  if (profile.hasSoftware) summary.push('Contains Software');
  if (profile.containsBiologicalMaterial) summary.push('Biological Material');
  if (profile.isCustomFabricated) summary.push('Custom/Patient-Specific');
  if (profile.requiresCalibration) summary.push('Requires Calibration');
  if (profile.hasMultipleComponents) summary.push('Multi-Component Kit');
  
  return summary;
}

// Generate market summary
export function generateMarketSummary(markets?: string[]): string {
  if (!markets || markets.length === 0) return 'EU (default)';
  
  const marketLabels: Record<string, string> = {
    'EU': 'EU MDR',
    'US': 'US FDA',
    'USA': 'US FDA',
    'CA': 'Health Canada',
    'AU': 'TGA Australia',
    'UK': 'UK MHRA',
    'JP': 'Japan PMDA',
  };
  
  return markets
    .slice(0, 3)
    .map(m => marketLabels[m.toUpperCase()] || m)
    .join(', ') + (markets.length > 3 ? ` +${markets.length - 3} more` : '');
}

// Compare two requirement sets and return changed items
export function getRequirementChanges(
  before: UDIPIRequirements, 
  after: UDIPIRequirements
): { field: string; from: RequirementStatus; to: RequirementStatus; reason: string }[] {
  const changes: { field: string; from: RequirementStatus; to: RequirementStatus; reason: string }[] = [];
  
  const fields: (keyof UDIPIRequirements)[] = [
    'lot_batch', 'serial_number', 'manufacturing_date', 'expiration_date', 'software_version'
  ];
  
  const fieldLabels: Record<keyof UDIPIRequirements, string> = {
    lot_batch: 'Lot/Batch Number',
    serial_number: 'Serial Number',
    manufacturing_date: 'Manufacturing Date',
    expiration_date: 'Expiration Date',
    software_version: 'Software Version',
  };
  
  for (const field of fields) {
    if (before[field].status !== after[field].status) {
      changes.push({
        field: fieldLabels[field],
        from: before[field].status,
        to: after[field].status,
        reason: after[field].reason,
      });
    }
  }
  
  return changes;
}
