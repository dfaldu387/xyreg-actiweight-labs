export interface StorageSterilityHandlingData {
  // Sterility Information
  isSterile: boolean;
  sterilizationMethod: string;
  sterilizationMethodOther?: string;
  sterilityAssuranceLevel: string;
  sterileBarrierSystemDescription?: string;
  
  // Storage & Transport Conditions
  storageTemperatureMin?: number;
  storageTemperatureMax?: number;
  storageTemperatureUnit: 'celsius' | 'fahrenheit';
  storageHumidityMin?: number;
  storageHumidityMax?: number;
  specialEnvironmentalControls: string[];
  otherStorageRequirements?: string;
  
  // Shelf Life & Handling
  shelfLifeValue?: number;
  shelfLifeUnit: 'months' | 'years';
  handlingPrecautions: string[];
  otherHandlingInstructions?: string;
}

export const DEFAULT_STORAGE_STERILITY_HANDLING: StorageSterilityHandlingData = {
  isSterile: false,
  sterilizationMethod: '',
  sterilityAssuranceLevel: '',
  storageTemperatureUnit: 'celsius',
  specialEnvironmentalControls: [],
  shelfLifeUnit: 'months',
  handlingPrecautions: []
};

export const STERILIZATION_METHODS = [
  { value: 'gamma', label: 'Gamma Irradiation' },
  { value: 'eto', label: 'Ethylene Oxide (EtO)' },
  { value: 'e_beam', label: 'E-Beam' },
  { value: 'x_ray', label: 'X-Ray' },
  { value: 'steam', label: 'Steam/Autoclave' },
  { value: 'other', label: 'Other' }
];

export const STERILITY_ASSURANCE_LEVELS = [
  { value: '10e-6', label: '10⁻⁶' },
  { value: '10e-3', label: '10⁻³' },
  { value: 'other', label: 'Other' }
];

export const ENVIRONMENTAL_CONTROLS = [
  { value: 'keep_dry', label: 'Keep Dry' },
  { value: 'protect_light', label: 'Protect from Light / UV' },
  { value: 'protect_heat', label: 'Protect from Heat' },
  { value: 'keep_frozen', label: 'Keep Frozen' },
  { value: 'protect_radiation', label: 'Protect from Radiation' }
];

export const HANDLING_PRECAUTIONS = [
  { value: 'fragile', label: 'Fragile / Handle with Care' },
  { value: 'this_way_up', label: 'This Way Up ⬆️' },
  { value: 'no_damaged_package', label: 'Do Not Use if Package is Damaged' }
];