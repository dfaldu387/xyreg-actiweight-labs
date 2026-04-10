/**
 * Class-based exclusion mapping for ISO 13485 Quality Manual.
 * 
 * Maps device classification to commonly excluded clauses with
 * pre-filled justifications aligned with auditor expectations.
 */

export interface ClassExclusion {
  clause: string;
  justification: string;
}

type DeviceClassKey = 
  | 'Class I'
  | 'Class I (sterile)'
  | 'Class Is (Sterile)'
  | 'Class IIa'
  | 'Class IIb'
  | 'Class III';

const CLASS_EXCLUSIONS: Record<string, ClassExclusion[]> = {
  'Class I': [
    {
      clause: '6.4',
      justification: 'Work environment controls beyond standard office/warehouse conditions are not required for non-sterile, non-implantable Class I devices per ISO 13485:2016 §1.2.',
    },
    {
      clause: '7.3',
      justification: 'Design and development controls are excluded for legacy Class I devices where the design is fully established and transferred. Per ISO 13485:2016 §7.3 Note.',
    },
    {
      clause: '7.5.2',
      justification: 'Validation of production processes is not applicable — all manufacturing outputs for Class I devices can be verified by subsequent monitoring or measurement.',
    },
    {
      clause: '7.5.5',
      justification: 'Particular requirements for sterile medical devices are not applicable — no products in scope require sterile presentation.',
    },
    {
      clause: '7.5.6',
      justification: 'Validation of processes for sterilization is not applicable — no sterilization processes are used for Class I non-sterile devices.',
    },
    {
      clause: '7.5.7',
      justification: 'Particular requirements for validation of processes for sterilization and sterile barrier systems are not applicable to non-sterile devices.',
    },
  ],
  'Class I (sterile)': [
    {
      clause: '7.3',
      justification: 'Design and development controls are excluded for legacy Class I sterile devices where the design is fully established. Per ISO 13485:2016 §7.3 Note.',
    },
  ],
  'Class Is (Sterile)': [
    {
      clause: '7.3',
      justification: 'Design and development controls are excluded for legacy Class Is devices where the design is fully established. Per ISO 13485:2016 §7.3 Note.',
    },
  ],
  'Class IIa': [
    {
      clause: '7.5.5',
      justification: 'Particular requirements for sterile medical devices — excluded unless product scope includes sterile presentation. To be re-evaluated if sterile products are added.',
    },
    {
      clause: '7.5.6',
      justification: 'Validation of sterilization processes — excluded unless product scope includes sterilization. To be re-evaluated if sterilization is introduced.',
    },
    {
      clause: '7.5.7',
      justification: 'Particular requirements for validation of sterilization and sterile barrier systems — excluded unless sterile products are in scope.',
    },
  ],
  'Class IIb': [
    {
      clause: '7.5.5',
      justification: 'Particular requirements for sterile medical devices — excluded unless product scope includes sterile presentation. To be re-evaluated if sterile products are added.',
    },
    {
      clause: '7.5.6',
      justification: 'Validation of sterilization processes — excluded unless product scope includes sterilization. To be re-evaluated if sterilization is introduced.',
    },
    {
      clause: '7.5.7',
      justification: 'Particular requirements for validation of sterilization and sterile barrier systems — excluded unless sterile products are in scope.',
    },
  ],
  'Class III': [],
};

/**
 * Returns the list of suggested exclusions for a given device class.
 * Class III returns an empty array (full requirement set).
 */
export function getClassBasedExclusions(deviceClass: string): ClassExclusion[] {
  return CLASS_EXCLUSIONS[deviceClass] || [];
}

/**
 * Determines the highest risk class from a list of product risk classes.
 * Used to pick the most conservative exclusion set for the company.
 */
export function getHighestDeviceClass(riskClasses: string[]): string | null {
  if (riskClasses.length === 0) return null;

  const hierarchy = [
    'Class III',
    'Class IIb',
    'Class IIa',
    'Class Is (Sterile)',
    'Class I (sterile)',
    'Class Im (Measuring)',
    'Class Ir (Reusable surgical)',
    'Class I',
  ];

  for (const cls of hierarchy) {
    if (riskClasses.some(rc => rc === cls || rc?.includes(cls))) {
      return cls;
    }
  }

  return riskClasses[0] || null;
}

/**
 * Returns a user-friendly label describing what the exclusion set means.
 */
export function getExclusionSummaryLabel(deviceClass: string): string {
  const exclusions = getClassBasedExclusions(deviceClass);
  if (exclusions.length === 0) {
    return 'Full requirement set — no exclusions recommended for this device class.';
  }
  return `${exclusions.length} clause${exclusions.length > 1 ? 's' : ''} can typically be excluded for ${deviceClass} devices.`;
}
