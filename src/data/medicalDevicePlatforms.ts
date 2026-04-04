export const MEDICAL_DEVICE_PLATFORMS = [
  {
    value: 'sleep_monitoring_systems',
    label: 'Sleep Monitoring Systems',
    description: 'Complete sleep study and monitoring platforms',
    examples: ['Nox A1 Sleep Study System', 'Alice 6 LDx', 'Embla N7000']
  },
  {
    value: 'respiratory_therapy_platforms',
    label: 'Respiratory Therapy Platforms', 
    description: 'CPAP, BiPAP and respiratory support systems',
    examples: ['ResMed AirSense', 'Philips DreamStation', 'Fisher & Paykel Icon']
  },
  {
    value: 'cardiac_monitoring_platforms',
    label: 'Cardiac Monitoring Platforms',
    description: 'ECG, Holter and cardiac diagnostic systems',
    examples: ['GE MAC ECG', 'Philips PageWriter', 'Mortara ELI']
  },
  {
    value: 'imaging_platforms',
    label: 'Medical Imaging Platforms',
    description: 'Ultrasound, X-ray and other imaging systems',
    examples: ['GE Vivid Ultrasound', 'Philips EPIQ', 'Siemens Acuson']
  },
  {
    value: 'patient_monitoring_platforms',
    label: 'Patient Monitoring Platforms',
    description: 'Vital signs and multi-parameter monitoring',
    examples: ['Philips IntelliVue', 'GE Carescape', 'Mindray BeneView']
  },
  {
    value: 'surgical_platforms',
    label: 'Surgical Platforms',
    description: 'Surgical navigation and robotic systems',
    examples: ['da Vinci Surgical System', 'Medtronic StealthStation', 'Zimmer Rosa']
  },
  {
    value: 'laboratory_platforms',
    label: 'Laboratory Platforms',
    description: 'In-vitro diagnostic and lab automation systems',
    examples: ['Abbott Architect', 'Roche Cobas', 'Siemens Atellica']
  },
  {
    value: 'rehabilitation_platforms',
    label: 'Rehabilitation Platforms',
    description: 'Physical therapy and mobility assistance systems',
    examples: ['Lokomat Gait Training', 'HUR Pneumatic', 'Biodex Balance']
  },
  {
    value: 'dental_platforms',
    label: 'Dental Platforms',
    description: 'Dental imaging and treatment systems',
    examples: ['Carestream CS 8100', 'Planmeca ProMax', 'Dentsply Sirona CEREC']
  },
  {
    value: 'ophthalmic_platforms',
    label: 'Ophthalmic Platforms', 
    description: 'Eye examination and surgical systems',
    examples: ['Zeiss IOLMaster', 'Alcon Centurion', 'Topcon Maestro']
  },
  {
    value: 'orthopedic_platforms',
    label: 'Orthopedic Platforms',
    description: 'Joint replacement and spinal systems',
    examples: ['Stryker Mako', 'Zimmer Persona', 'DePuy Synthes ATTUNE']
  },
  {
    value: 'neuromodulation_platforms',
    label: 'Neuromodulation Platforms',
    description: 'Deep brain stimulation and spinal cord systems',
    examples: ['Medtronic Percept PC', 'Abbott Infinity', 'Boston Scientific Vercise']
  },
  {
    value: 'infusion_platforms',
    label: 'Infusion Platforms',
    description: 'Drug delivery and infusion pump systems',
    examples: ['Baxter Sigma Spectrum', 'BD Alaris', 'Fresenius Kabi Agilia']
  },
  {
    value: 'dialysis_platforms',
    label: 'Dialysis Platforms',
    description: 'Hemodialysis and peritoneal dialysis systems',
    examples: ['Fresenius 5008S', 'Baxter HomeChoice', 'Nipro Surdial']
  },
  {
    value: 'anesthesia_platforms',
    label: 'Anesthesia Platforms',
    description: 'Anesthesia delivery and monitoring systems',
    examples: ['GE Aisys CS2', 'Dräger Perseus A500', 'Mindray A7']
  },
  {
    value: 'standalone_accessories',
    label: 'Standalone Accessories',
    description: 'Independent accessories not tied to a specific platform',
    examples: ['Universal cables', 'Generic sensors', 'Standard consumables']
  },
  {
    value: 'custom_platform',
    label: 'Custom Platform',
    description: 'Company-specific or unique platform not listed above',
    examples: ['Proprietary systems', 'Custom integrations', 'Specialized platforms']
  }
] as const;

export type MedicalDevicePlatformValue = typeof MEDICAL_DEVICE_PLATFORMS[number]['value'];

// Helper function to get platform by value
export const getMedicalDevicePlatform = (value: MedicalDevicePlatformValue) => {
  return MEDICAL_DEVICE_PLATFORMS.find(platform => platform.value === value);
};

// Helper function to get platforms by category
export const getPlatformsByCategory = (category: string) => {
  const categoryPlatformMapping: Record<string, string[]> = {
    'diagnostic_equipment': ['sleep_monitoring_systems', 'cardiac_monitoring_platforms', 'imaging_platforms', 'laboratory_platforms'],
    'therapeutic_devices': ['respiratory_therapy_platforms', 'infusion_platforms', 'dialysis_platforms', 'anesthesia_platforms'],
    'patient_monitoring_systems': ['patient_monitoring_platforms', 'cardiac_monitoring_platforms'],
    'surgical_instruments': ['surgical_platforms'],
    'implantable_devices': ['orthopedic_platforms', 'neuromodulation_platforms'],
    'rehabilitation_assistive': ['rehabilitation_platforms'],
    'dental_devices': ['dental_platforms'],
    'ophthalmic_devices': ['ophthalmic_platforms']
  };

  const relevantPlatforms = categoryPlatformMapping[category] || [];
  return MEDICAL_DEVICE_PLATFORMS.filter(platform => 
    relevantPlatforms.includes(platform.value) || 
    platform.value === 'standalone_accessories' || 
    platform.value === 'custom_platform'
  );
};