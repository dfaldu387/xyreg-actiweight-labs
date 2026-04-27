/**
 * Hardcoded fixtures for the Acme ltd demo dataset.
 * Edit this file to tweak names, descriptions, hazards, BOM lines etc.
 * All ids in here are *logical* keys — actual db ids are generated at insert time.
 */

export const ACME_SEED_ID = 'acme-v1';
export const ACME_COMPANY_NAME = 'Acme ltd';

// ── Devices ──────────────────────────────────────────────────────────────

export interface DeviceFixture {
  key: string; // logical key
  name: string;
  description: string;
  intended_use: string;
  device_summary: string;
  device_type: string;
  device_category: string;
  class: string;
  status: string;
  manufacturer: string;
  basic_udi_di: string;
  current_lifecycle_phase: string;
  parent_key?: string; // for family variants
  is_line_extension: boolean;
  product_market: string;
  project_types: string[];
  conformity_route?: string;
  product_platform?: string;
}

export const ACME_DEVICES: DeviceFixture[] = [
  // ── AcmeGuard family ──
  {
    key: 'acmeguard-100',
    name: 'AcmeGuard 100',
    description:
      'Bedside vital-signs monitor measuring heart rate, ECG (3-lead) and non-invasive blood pressure. Master device of the AcmeGuard family — defines the technical baseline for all variants.',
    intended_use:
      'AcmeGuard 100 is a continuous patient monitor intended for use by trained healthcare professionals in hospital wards and ICUs to measure, display and record adult and paediatric (>3 kg) vital-signs (ECG, NIBP, heart rate) and trigger threshold alarms.',
    device_summary:
      'Class IIa multi-parameter patient monitor with 10" colour display, on-board 72-hour trend memory and Ethernet connectivity to AcmeGuard Central Station.',
    device_type: 'Active medical device',
    device_category: 'Patient Monitoring',
    class: 'IIa',
    status: 'Development',
    manufacturer: 'Acme ltd',
    basic_udi_di: '0764000ACME100JT',
    current_lifecycle_phase: 'Design & Development',
    is_line_extension: false,
    product_market: 'EU',
    project_types: ['New Product Development'],
    conformity_route: 'Annex IX (full QMS + tech doc assessment)',
    product_platform: 'AcmeGuard Platform v1',
  },
  {
    key: 'acmeguard-200',
    name: 'AcmeGuard 200',
    description:
      'AcmeGuard family variant — adds Masimo SET® SpO2 pulse oximetry to the AcmeGuard 100 baseline.',
    intended_use:
      'Same as AcmeGuard 100, with the additional intended purpose of continuous, non-invasive measurement of functional oxygen saturation (SpO2) and pulse rate in adult and paediatric (>3 kg) patients.',
    device_summary:
      'AcmeGuard 100 + integrated Masimo SET® SpO2 module. Shares hardware platform, firmware family and clinical evaluation with AcmeGuard 100.',
    device_type: 'Active medical device',
    device_category: 'Patient Monitoring',
    class: 'IIa',
    status: 'Development',
    manufacturer: 'Acme ltd',
    basic_udi_di: '0764000ACME100JT',
    current_lifecycle_phase: 'Design & Development',
    parent_key: 'acmeguard-100',
    is_line_extension: true,
    product_market: 'EU',
    project_types: ['Variant'],
    conformity_route: 'Annex IX (full QMS + tech doc assessment)',
    product_platform: 'AcmeGuard Platform v1',
  },
  {
    key: 'acmeguard-300',
    name: 'AcmeGuard 300',
    description:
      'AcmeGuard family variant — AcmeGuard 200 plus encrypted 802.11ax wireless telemetry to AcmeGuard Central Station.',
    intended_use:
      'Same as AcmeGuard 200, with the additional capability of wireless transmission of vital-signs to a central monitoring station within the same hospital network.',
    device_summary:
      'AcmeGuard 200 + Wi-Fi 6 telemetry module (FIPS 140-2 encrypted). Designed for ambulatory and step-down ward use.',
    device_type: 'Active medical device',
    device_category: 'Patient Monitoring',
    class: 'IIa',
    status: 'Development',
    manufacturer: 'Acme ltd',
    basic_udi_di: '0764000ACME100JT',
    current_lifecycle_phase: 'Design & Development',
    parent_key: 'acmeguard-100',
    is_line_extension: true,
    product_market: 'EU',
    project_types: ['Variant'],
    conformity_route: 'Annex IX (full QMS + tech doc assessment)',
    product_platform: 'AcmeGuard Platform v1',
  },

  // ── Standalone devices ──
  {
    key: 'acmepump-xr',
    name: 'AcmePump XR',
    description:
      'Volumetric infusion pump with embedded software (IEC 62304 Class B) for general-purpose intravenous fluid and medication delivery.',
    intended_use:
      'AcmePump XR is intended to deliver controlled intravenous administration of fluids, medications, blood and blood products to adult and paediatric patients in clinical environments under the supervision of trained healthcare professionals.',
    device_summary:
      'Class IIb single-channel volumetric pump, 0.1–999 mL/h, drug library with 200 protocols, dose-error reduction system (DERS), 8 h battery, USB-C servicing port.',
    device_type: 'Active medical device with measuring function',
    device_category: 'Drug Delivery',
    class: 'IIb',
    status: 'Development',
    manufacturer: 'Acme ltd',
    basic_udi_di: '0764000ACMEPMPK4',
    current_lifecycle_phase: 'Verification & Validation',
    is_line_extension: false,
    product_market: 'EU',
    project_types: ['New Product Development'],
    conformity_route: 'Annex IX (full QMS + tech doc assessment)',
  },
  {
    key: 'acmestrip-one',
    name: 'AcmeStrip One',
    description:
      'Single-use, sterile disposable test strip for qualitative detection of group-A streptococcal antigen from throat swabs.',
    intended_use:
      'AcmeStrip One is a sterile, single-use lateral-flow immunoassay intended for the qualitative detection of group A streptococcus antigen directly from throat swab specimens to aid in the diagnosis of group A streptococcal pharyngitis in symptomatic patients aged 3 years and older.',
    device_summary:
      'Class I sterile single-use diagnostic strip. Shelf-life 24 months at 2–30 °C. Read time 5 min, sensitivity 96%, specificity 98%.',
    device_type: 'In vitro diagnostic',
    device_category: 'Point of Care Diagnostic',
    class: 'I',
    status: 'Active',
    manufacturer: 'Acme ltd',
    basic_udi_di: '0764000ACMESTR8H',
    current_lifecycle_phase: 'Post-Market Surveillance',
    is_line_extension: false,
    product_market: 'EU',
    project_types: ['Marketed Product'],
    conformity_route: 'Annex IX (full QMS + tech doc assessment)',
  },
];

// ── Suppliers ────────────────────────────────────────────────────────────

export interface SupplierFixture {
  key: string;
  name: string;
  status: 'Approved' | 'Probationary' | 'Disqualified';
  criticality: 'Critical' | 'Non-Critical';
  supplier_type: string;
  scope_of_supply: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  next_audit_months_out: number; // months from today
  audit_interval: string;
}

export const ACME_SUPPLIERS: SupplierFixture[] = [
  {
    key: 'helsinki-polymers',
    name: 'Helsinki Polymers Oy',
    status: 'Approved',
    criticality: 'Critical',
    supplier_type: 'Raw Material Supplier',
    scope_of_supply: 'Medical-grade ABS and polycarbonate housing resins',
    contact_person: 'Mika Virtanen',
    email: 'm.virtanen@helsinkipolymers.fi',
    phone: '+358 9 123 4567',
    address: 'Teollisuuskatu 12, 00510 Helsinki, Finland',
    next_audit_months_out: 8,
    audit_interval: '24 months',
  },
  {
    key: 'bavaria-precision',
    name: 'Bavaria Precision GmbH',
    status: 'Approved',
    criticality: 'Critical',
    supplier_type: 'Component Supplier',
    scope_of_supply: 'Precision-machined aluminium chassis and front-bezels',
    contact_person: 'Klaus Hoffmann',
    email: 'k.hoffmann@bavaria-precision.de',
    phone: '+49 89 555 0188',
    address: 'Industriestraße 47, 80339 München, Germany',
    next_audit_months_out: 4,
    audit_interval: '12 months',
  },
  {
    key: 'lyon-sterilization',
    name: 'Lyon Sterilization SAS',
    status: 'Approved',
    criticality: 'Critical',
    supplier_type: 'Service Provider',
    scope_of_supply: 'EtO contract sterilization for AcmeStrip One',
    contact_person: 'Camille Dubois',
    email: 'c.dubois@lyon-steril.fr',
    phone: '+33 4 72 00 11 22',
    address: '15 Rue de la Stérilisation, 69007 Lyon, France',
    next_audit_months_out: 2,
    audit_interval: '12 months',
  },
  {
    key: 'osaka-microelectronics',
    name: 'Osaka Microelectronics K.K.',
    status: 'Approved',
    criticality: 'Critical',
    supplier_type: 'Component Supplier',
    scope_of_supply: 'ARM Cortex-M7 microcontrollers, ECG analog front-end ICs',
    contact_person: 'Hiroshi Tanaka',
    email: 'h.tanaka@osaka-micro.co.jp',
    phone: '+81 6 6320 9988',
    address: '2-3-1 Umeda, Kita-ku, Osaka 530-0001, Japan',
    next_audit_months_out: 11,
    audit_interval: '24 months',
  },
  {
    key: 'rotterdam-displays',
    name: 'Rotterdam Displays B.V.',
    status: 'Approved',
    criticality: 'Non-Critical',
    supplier_type: 'Component Supplier',
    scope_of_supply: '10" capacitive-touch IPS displays',
    contact_person: 'Anouk de Vries',
    email: 'a.devries@rotterdam-displays.nl',
    phone: '+31 10 414 5566',
    address: 'Havenlaan 88, 3072 AN Rotterdam, Netherlands',
    next_audit_months_out: 14,
    audit_interval: '24 months',
  },
  {
    key: 'milan-batteries',
    name: 'Milano Power Cells SpA',
    status: 'Probationary',
    criticality: 'Critical',
    supplier_type: 'Component Supplier',
    scope_of_supply: 'Lithium-ion battery packs (UN 38.3 certified)',
    contact_person: 'Giulia Romano',
    email: 'g.romano@milanopower.it',
    phone: '+39 02 8765 4321',
    address: 'Via dell\'Energia 22, 20121 Milano, Italy',
    next_audit_months_out: 1,
    audit_interval: '6 months',
  },
  {
    key: 'dublin-labels',
    name: 'Dublin Label & Print Ltd',
    status: 'Approved',
    criticality: 'Non-Critical',
    supplier_type: 'Service Provider',
    scope_of_supply: 'IFU printing, multi-language labelling, UDI carriers',
    contact_person: 'Sean O\'Connor',
    email: 's.oconnor@dublinlabel.ie',
    phone: '+353 1 234 5678',
    address: 'Liffey Industrial Estate, Dublin D08 X1Y2, Ireland',
    next_audit_months_out: 18,
    audit_interval: '36 months',
  },
  {
    key: 'singapore-pcba',
    name: 'Singapore PCBA Pte Ltd',
    status: 'Approved',
    criticality: 'Critical',
    supplier_type: 'CMO / CDMO',
    scope_of_supply: 'Contract PCB assembly and electronic test for AcmeGuard mainboards',
    contact_person: 'Lim Wei Ming',
    email: 'wm.lim@sg-pcba.com.sg',
    phone: '+65 6234 8899',
    address: '8 Jurong Town Hall Road, Singapore 609434',
    next_audit_months_out: 6,
    audit_interval: '12 months',
  },
];

// ── BOM (per-product item lists) ─────────────────────────────────────────

export interface BomItemFixture {
  description: string;
  quantity: number;
  unit_of_measure: string;
  unit_cost: number;
  supplier_key?: string;
  supplier_part_number?: string;
  lead_time_days?: number;
  is_critical: boolean;
  category?: 'purchased_part' | 'manufactured_part' | 'raw_material' | 'sub_assembly' | 'consumable';
  patient_contact?: 'direct' | 'indirect' | 'none';
  notes?: string;
}

export const ACME_BOM: Record<string, BomItemFixture[]> = {
  'acmeguard-100': [
    { description: 'Aluminium chassis, machined', quantity: 1, unit_of_measure: 'ea', unit_cost: 42.5, supplier_key: 'bavaria-precision', supplier_part_number: 'BP-AG100-CHAS-01', lead_time_days: 28, is_critical: true, category: 'manufactured_part', patient_contact: 'none' },
    { description: 'Front bezel, ABS, white', quantity: 1, unit_of_measure: 'ea', unit_cost: 8.2, supplier_key: 'helsinki-polymers', supplier_part_number: 'HP-AG100-BZL', lead_time_days: 21, is_critical: false, category: 'manufactured_part', patient_contact: 'indirect' },
    { description: '10" IPS capacitive touch display', quantity: 1, unit_of_measure: 'ea', unit_cost: 78.0, supplier_key: 'rotterdam-displays', supplier_part_number: 'RD-10IPS-CAP', lead_time_days: 35, is_critical: true, category: 'purchased_part', patient_contact: 'none' },
    { description: 'Mainboard PCBA, AcmeGuard rev C', quantity: 1, unit_of_measure: 'ea', unit_cost: 156.0, supplier_key: 'singapore-pcba', supplier_part_number: 'SG-AG-MB-RC', lead_time_days: 42, is_critical: true, category: 'sub_assembly', patient_contact: 'none' },
    { description: 'STM32H7 ARM Cortex-M7 MCU, 480 MHz', quantity: 1, unit_of_measure: 'ea', unit_cost: 14.5, supplier_key: 'osaka-microelectronics', supplier_part_number: 'OM-STM32H7B0', lead_time_days: 28, is_critical: true, category: 'purchased_part', patient_contact: 'none' },
    { description: 'ECG analog front-end IC, ADS1294', quantity: 1, unit_of_measure: 'ea', unit_cost: 22.0, supplier_key: 'osaka-microelectronics', supplier_part_number: 'OM-ADS1294R', lead_time_days: 28, is_critical: true, category: 'purchased_part', patient_contact: 'none' },
    { description: 'Li-ion battery pack, 11.1V 5200mAh', quantity: 1, unit_of_measure: 'ea', unit_cost: 38.0, supplier_key: 'milan-batteries', supplier_part_number: 'MP-LIP-11V5A', lead_time_days: 56, is_critical: true, category: 'purchased_part', patient_contact: 'none' },
    { description: 'NIBP pneumatic valve assembly', quantity: 1, unit_of_measure: 'ea', unit_cost: 28.5, supplier_key: 'bavaria-precision', supplier_part_number: 'BP-NIBP-VLV', lead_time_days: 30, is_critical: true, category: 'sub_assembly', patient_contact: 'indirect' },
    { description: 'NIBP cuff, adult, reusable', quantity: 1, unit_of_measure: 'ea', unit_cost: 12.0, supplier_key: 'helsinki-polymers', supplier_part_number: 'HP-CUFF-ADL', lead_time_days: 14, is_critical: true, category: 'purchased_part', patient_contact: 'direct', notes: 'Skin contact <24h, ISO 10993-5/-10 evaluated.' },
    { description: 'ECG cable, 3-lead, snap', quantity: 1, unit_of_measure: 'ea', unit_cost: 9.5, supplier_key: 'helsinki-polymers', supplier_part_number: 'HP-ECG-3L', lead_time_days: 14, is_critical: true, category: 'purchased_part', patient_contact: 'direct', notes: 'Connects to disposable Ag/AgCl electrodes.' },
    { description: 'Power supply unit, medical-grade 60W', quantity: 1, unit_of_measure: 'ea', unit_cost: 32.0, supplier_key: 'singapore-pcba', supplier_part_number: 'SG-PSU-60M', lead_time_days: 35, is_critical: true, category: 'purchased_part', patient_contact: 'none' },
    { description: 'Speaker, 8 ohm 2W', quantity: 1, unit_of_measure: 'ea', unit_cost: 1.8, supplier_key: 'osaka-microelectronics', supplier_part_number: 'OM-SPK-8R2W', lead_time_days: 21, is_critical: false, category: 'purchased_part', patient_contact: 'none' },
    { description: 'Rotary encoder, panel-mount', quantity: 1, unit_of_measure: 'ea', unit_cost: 4.2, supplier_key: 'osaka-microelectronics', supplier_part_number: 'OM-ENC-PM', lead_time_days: 21, is_critical: false, category: 'purchased_part', patient_contact: 'indirect' },
    { description: 'Cable harness, internal', quantity: 1, unit_of_measure: 'ea', unit_cost: 6.5, supplier_key: 'singapore-pcba', supplier_part_number: 'SG-HARN-AG', lead_time_days: 21, is_critical: false, category: 'sub_assembly', patient_contact: 'none' },
    { description: 'Screws, M3 stainless, set', quantity: 24, unit_of_measure: 'ea', unit_cost: 0.05, supplier_key: 'bavaria-precision', supplier_part_number: 'BP-SCR-M3SS', lead_time_days: 7, is_critical: false, category: 'purchased_part', patient_contact: 'none' },
    { description: 'IFU booklet, multi-lang', quantity: 1, unit_of_measure: 'ea', unit_cost: 1.2, supplier_key: 'dublin-labels', supplier_part_number: 'DL-IFU-AG100', lead_time_days: 14, is_critical: false, category: 'purchased_part', patient_contact: 'none' },
    { description: 'Carton, corrugated, AcmeGuard', quantity: 1, unit_of_measure: 'ea', unit_cost: 2.4, supplier_key: 'dublin-labels', supplier_part_number: 'DL-CART-AG', lead_time_days: 14, is_critical: false, category: 'purchased_part', patient_contact: 'none' },
  ],
  'acmepump-xr': [
    { description: 'Pump housing, polycarbonate, white', quantity: 1, unit_of_measure: 'ea', unit_cost: 18.0, supplier_key: 'helsinki-polymers', supplier_part_number: 'HP-PMP-HSG', lead_time_days: 28, is_critical: true, category: 'manufactured_part', patient_contact: 'none' },
    { description: 'Peristaltic pump mechanism', quantity: 1, unit_of_measure: 'ea', unit_cost: 95.0, supplier_key: 'bavaria-precision', supplier_part_number: 'BP-PERI-001', lead_time_days: 49, is_critical: true, category: 'sub_assembly', patient_contact: 'none' },
    { description: 'IV set, DEHP-free, single-use', quantity: 1, unit_of_measure: 'ea', unit_cost: 3.4, supplier_key: 'helsinki-polymers', supplier_part_number: 'HP-IV-DEHP-F', lead_time_days: 14, is_critical: true, category: 'consumable', patient_contact: 'direct', notes: 'Indirect blood-path contact, ISO 10993-4 evaluated.' },
    { description: 'Mainboard PCBA, AcmePump rev B', quantity: 1, unit_of_measure: 'ea', unit_cost: 142.0, supplier_key: 'singapore-pcba', supplier_part_number: 'SG-AP-MB-RB', lead_time_days: 42, is_critical: true, category: 'sub_assembly', patient_contact: 'none' },
    { description: 'Stepper motor, NEMA 17, medical', quantity: 1, unit_of_measure: 'ea', unit_cost: 24.0, supplier_key: 'osaka-microelectronics', supplier_part_number: 'OM-STP-N17M', lead_time_days: 28, is_critical: true, category: 'purchased_part', patient_contact: 'none' },
    { description: 'Air-in-line ultrasonic detector', quantity: 1, unit_of_measure: 'ea', unit_cost: 18.5, supplier_key: 'osaka-microelectronics', supplier_part_number: 'OM-AIL-US', lead_time_days: 28, is_critical: true, category: 'purchased_part', patient_contact: 'none' },
    { description: '4.3" colour TFT display + touch', quantity: 1, unit_of_measure: 'ea', unit_cost: 32.0, supplier_key: 'rotterdam-displays', supplier_part_number: 'RD-4.3TFT-CT', lead_time_days: 35, is_critical: true, category: 'purchased_part', patient_contact: 'none' },
    { description: 'Li-ion battery pack, 7.4V 4400mAh', quantity: 1, unit_of_measure: 'ea', unit_cost: 28.0, supplier_key: 'milan-batteries', supplier_part_number: 'MP-LIP-7V4A', lead_time_days: 56, is_critical: true, category: 'purchased_part', patient_contact: 'none' },
    { description: 'Pole clamp, machined aluminium', quantity: 1, unit_of_measure: 'ea', unit_cost: 14.5, supplier_key: 'bavaria-precision', supplier_part_number: 'BP-POLE-CL', lead_time_days: 21, is_critical: false, category: 'manufactured_part', patient_contact: 'none' },
    { description: 'Power cord, hospital-grade', quantity: 1, unit_of_measure: 'ea', unit_cost: 6.0, supplier_key: 'singapore-pcba', supplier_part_number: 'SG-CORD-HG', lead_time_days: 21, is_critical: false, category: 'purchased_part', patient_contact: 'none' },
    { description: 'Drug library SD card, 32GB', quantity: 1, unit_of_measure: 'ea', unit_cost: 4.5, supplier_key: 'osaka-microelectronics', supplier_part_number: 'OM-SD-32GB', lead_time_days: 14, is_critical: false, category: 'purchased_part', patient_contact: 'none' },
    { description: 'IFU + DERS administrator guide', quantity: 1, unit_of_measure: 'ea', unit_cost: 2.8, supplier_key: 'dublin-labels', supplier_part_number: 'DL-IFU-APXR', lead_time_days: 14, is_critical: false, category: 'purchased_part', patient_contact: 'none' },
    { description: 'Carton + foam insert, AcmePump', quantity: 1, unit_of_measure: 'ea', unit_cost: 4.2, supplier_key: 'dublin-labels', supplier_part_number: 'DL-CART-AP', lead_time_days: 14, is_critical: false, category: 'purchased_part', patient_contact: 'none' },
  ],
  'acmestrip-one': [
    { description: 'Nitrocellulose membrane, 25 mm', quantity: 1, unit_of_measure: 'ea', unit_cost: 0.18, supplier_key: 'helsinki-polymers', supplier_part_number: 'HP-NC-25MM', lead_time_days: 21, is_critical: true, category: 'raw_material', patient_contact: 'none' },
    { description: 'Strep-A capture antibody, monoclonal', quantity: 0.005, unit_of_measure: 'mL', unit_cost: 14.0, supplier_key: 'osaka-microelectronics', supplier_part_number: 'OM-AB-STREPA', lead_time_days: 35, is_critical: true, category: 'raw_material', patient_contact: 'none' },
    { description: 'Conjugate pad, glass fibre', quantity: 1, unit_of_measure: 'ea', unit_cost: 0.04, supplier_key: 'helsinki-polymers', supplier_part_number: 'HP-CONJ-GF', lead_time_days: 21, is_critical: true, category: 'raw_material', patient_contact: 'none' },
    { description: 'Sample pad, cellulose', quantity: 1, unit_of_measure: 'ea', unit_cost: 0.02, supplier_key: 'helsinki-polymers', supplier_part_number: 'HP-SMP-CELL', lead_time_days: 21, is_critical: false, category: 'raw_material', patient_contact: 'none' },
    { description: 'Plastic cassette, polystyrene', quantity: 1, unit_of_measure: 'ea', unit_cost: 0.08, supplier_key: 'helsinki-polymers', supplier_part_number: 'HP-CASS-PS', lead_time_days: 21, is_critical: false, category: 'manufactured_part', patient_contact: 'indirect' },
    { description: 'Sterile foil pouch, mylar', quantity: 1, unit_of_measure: 'ea', unit_cost: 0.06, supplier_key: 'dublin-labels', supplier_part_number: 'DL-POUCH-ML', lead_time_days: 14, is_critical: true, category: 'purchased_part', patient_contact: 'none', notes: 'Sterile barrier, validated per ISO 11607.' },
    { description: 'Sterile throat-swab applicator', quantity: 1, unit_of_measure: 'ea', unit_cost: 0.12, supplier_key: 'helsinki-polymers', supplier_part_number: 'HP-SWAB-RAY', lead_time_days: 14, is_critical: true, category: 'consumable', patient_contact: 'direct', notes: 'Mucosal contact <1 min.' },
    { description: 'EtO sterilization service', quantity: 1, unit_of_measure: 'lot', unit_cost: 0.05, supplier_key: 'lyon-sterilization', supplier_part_number: 'LS-ETO-SVC', lead_time_days: 7, is_critical: true, category: 'consumable', patient_contact: 'none' },
    { description: 'Box label + IFU insert', quantity: 1, unit_of_measure: 'ea', unit_cost: 0.10, supplier_key: 'dublin-labels', supplier_part_number: 'DL-LBL-AS1', lead_time_days: 14, is_critical: false, category: 'purchased_part', patient_contact: 'none' },
    { description: 'Carton, 25-strip pack', quantity: 0.04, unit_of_measure: 'ea', unit_cost: 1.20, supplier_key: 'dublin-labels', supplier_part_number: 'DL-CART-AS25', lead_time_days: 14, is_critical: false, category: 'purchased_part', patient_contact: 'none' },
  ],
};
// AcmeGuard 200 / 300 inherit from AcmeGuard 100 + delta items
ACME_BOM['acmeguard-200'] = [
  ...ACME_BOM['acmeguard-100'],
  { description: 'Masimo SET® SpO2 module, OEM', quantity: 1, unit_of_measure: 'ea', unit_cost: 145.0, supplier_key: 'osaka-microelectronics', supplier_part_number: 'OM-MAS-SET-OEM', lead_time_days: 49, is_critical: true, category: 'purchased_part', patient_contact: 'none' },
  { description: 'SpO2 finger sensor, reusable adult', quantity: 1, unit_of_measure: 'ea', unit_cost: 22.0, supplier_key: 'osaka-microelectronics', supplier_part_number: 'OM-MAS-LNCS', lead_time_days: 28, is_critical: true, category: 'purchased_part', patient_contact: 'direct', notes: 'Skin contact <24h, ISO 10993 evaluated.' },
];
ACME_BOM['acmeguard-300'] = [
  ...ACME_BOM['acmeguard-200'],
  { description: 'Wi-Fi 6 telemetry module (FIPS)', quantity: 1, unit_of_measure: 'ea', unit_cost: 38.0, supplier_key: 'osaka-microelectronics', supplier_part_number: 'OM-WIFI6-FIPS', lead_time_days: 35, is_critical: true, category: 'purchased_part', patient_contact: 'none' },
  { description: 'External antenna assembly', quantity: 1, unit_of_measure: 'ea', unit_cost: 4.2, supplier_key: 'osaka-microelectronics', supplier_part_number: 'OM-ANT-EXT', lead_time_days: 21, is_critical: false, category: 'purchased_part', patient_contact: 'none' },
];

// ── Hazards (per-product) ────────────────────────────────────────────────

export interface HazardFixture {
  description: string;
  category: string;
  foreseeable_sequence_events: string;
  hazardous_situation: string;
  potential_harm: string;
  initial_severity: number;
  initial_probability: number;
  risk_control_measure: string;
  risk_control_type: 'Inherent Safety by Design' | 'Protective Measures' | 'Information for Safety';
  residual_severity: number;
  residual_probability: number;
}

const COMMON_MONITOR_HAZARDS: HazardFixture[] = [
  { description: 'Loss of vital-signs monitoring during ward use', category: 'Functional', foreseeable_sequence_events: 'Power loss → battery depleted → display blank', hazardous_situation: 'Patient unmonitored during deterioration', potential_harm: 'Delayed clinical intervention, possible death', initial_severity: 5, initial_probability: 3, risk_control_measure: 'Battery backup ≥4 h, low-battery audible alarm at 30 min and 5 min', risk_control_type: 'Protective Measures', residual_severity: 5, residual_probability: 1 },
  { description: 'False alarm fatigue leading to ignored real alarm', category: 'Use-related', foreseeable_sequence_events: 'Loose ECG lead → repeated false asystole alarms → clinician disables alarm', hazardous_situation: 'Real cardiac event missed', potential_harm: 'Patient harm or death', initial_severity: 5, initial_probability: 3, risk_control_measure: 'Lead-off detection differentiates from asystole; alarm-pause max 2 min with auto-resume', risk_control_type: 'Inherent Safety by Design', residual_severity: 5, residual_probability: 1 },
  { description: 'Electrical leakage current to patient', category: 'Electrical', foreseeable_sequence_events: 'Insulation degradation in ECG cable', hazardous_situation: 'Microshock via low-impedance path', potential_harm: 'Cardiac arrhythmia, burns', initial_severity: 5, initial_probability: 2, risk_control_measure: 'CF-rated isolated patient circuits per IEC 60601-1; annual leakage test', risk_control_type: 'Inherent Safety by Design', residual_severity: 5, residual_probability: 1 },
  { description: 'EMC interference from MRI/diathermy', category: 'EMC', foreseeable_sequence_events: 'Use near 1.5T MRI scanner not declared as MR-conditional', hazardous_situation: 'False readings, alarm suppression', potential_harm: 'Misdiagnosis, missed deterioration', initial_severity: 4, initial_probability: 2, risk_control_measure: 'IEC 60601-1-2 tested; IFU explicitly excludes MRI room use; warning label', risk_control_type: 'Information for Safety', residual_severity: 4, residual_probability: 1 },
  { description: 'Cybersecurity intrusion via Ethernet port', category: 'Cybersecurity', foreseeable_sequence_events: 'Hospital LAN compromised → attacker pushes firmware', hazardous_situation: 'Malicious firmware alters alarm thresholds', potential_harm: 'Wide-scale patient harm', initial_severity: 5, initial_probability: 2, risk_control_measure: 'Signed firmware updates only, mutual TLS, vulnerability disclosure programme', risk_control_type: 'Protective Measures', residual_severity: 5, residual_probability: 1 },
  { description: 'NIBP cuff over-inflation', category: 'Mechanical', foreseeable_sequence_events: 'Pressure regulator failure', hazardous_situation: 'Cuff inflates above 300 mmHg', potential_harm: 'Bruising, nerve compression', initial_severity: 3, initial_probability: 2, risk_control_measure: 'Hardware overpressure relief @ 300 mmHg + software watchdog', risk_control_type: 'Inherent Safety by Design', residual_severity: 2, residual_probability: 1 },
  { description: 'Allergic reaction to ECG electrode adhesive', category: 'Biocompatibility', foreseeable_sequence_events: 'Patient allergic to acrylate adhesive', hazardous_situation: 'Skin reaction at electrode site', potential_harm: 'Dermatitis', initial_severity: 2, initial_probability: 3, risk_control_measure: 'Latex-free electrodes, ISO 10993-10 sensitisation testing on supplied accessories', risk_control_type: 'Inherent Safety by Design', residual_severity: 2, residual_probability: 2 },
  { description: 'Software crash freezes display', category: 'Software', foreseeable_sequence_events: 'Memory leak after 30 days continuous use', hazardous_situation: 'Display frozen but appears active', potential_harm: 'Missed deterioration', initial_severity: 5, initial_probability: 3, risk_control_measure: 'Independent watchdog reboots within 10s; "self-test running" indicator', risk_control_type: 'Protective Measures', residual_severity: 5, residual_probability: 1 },
  { description: 'Misinterpretation of heart rate trend', category: 'Use-related', foreseeable_sequence_events: 'Untrained user reads averaged trend as instantaneous rate', hazardous_situation: 'Wrong clinical decision', potential_harm: 'Inappropriate intervention', initial_severity: 3, initial_probability: 3, risk_control_measure: 'IFU + on-screen legend; mandatory user training per IEC 62366-1', risk_control_type: 'Information for Safety', residual_severity: 3, residual_probability: 2 },
  { description: 'Cleaning fluid ingress through display bezel', category: 'Mechanical', foreseeable_sequence_events: 'Spray cleaner used directly on screen', hazardous_situation: 'Short circuit on mainboard', potential_harm: 'Device failure mid-use', initial_severity: 4, initial_probability: 3, risk_control_measure: 'IPX1 sealed bezel; IFU specifies wipe-only cleaning', risk_control_type: 'Inherent Safety by Design', residual_severity: 4, residual_probability: 1 },
  { description: 'Battery thermal runaway', category: 'Electrical', foreseeable_sequence_events: 'Cell defect during charging', hazardous_situation: 'Battery overheats / vents', potential_harm: 'Burns, fire', initial_severity: 5, initial_probability: 2, risk_control_measure: 'Battery management IC with thermal cutoff; UN 38.3 certified cells', risk_control_type: 'Inherent Safety by Design', residual_severity: 4, residual_probability: 1 },
  { description: 'Display unreadable in bright sunlight', category: 'Use-related', foreseeable_sequence_events: 'Use near window with direct sunlight', hazardous_situation: 'Clinician misreads value', potential_harm: 'Wrong clinical decision', initial_severity: 3, initial_probability: 3, risk_control_measure: '500 cd/m² display, anti-glare coating; IFU placement guidance', risk_control_type: 'Inherent Safety by Design', residual_severity: 2, residual_probability: 2 },
  { description: 'Loss of trend data on power cycle', category: 'Software', foreseeable_sequence_events: 'Unexpected reboot', hazardous_situation: 'Last 72 h of trends lost', potential_harm: 'Loss of clinical context', initial_severity: 3, initial_probability: 2, risk_control_measure: 'Trend data persisted to non-volatile memory every 60 s', risk_control_type: 'Inherent Safety by Design', residual_severity: 2, residual_probability: 1 },
  { description: 'Alarm volume too low to hear', category: 'Use-related', foreseeable_sequence_events: 'User sets alarm volume to minimum', hazardous_situation: 'Critical alarm not heard', potential_harm: 'Missed deterioration', initial_severity: 5, initial_probability: 3, risk_control_measure: 'Minimum alarm volume floor 45 dB; cannot be muted permanently', risk_control_type: 'Inherent Safety by Design', residual_severity: 5, residual_probability: 1 },
  { description: 'Misconnection of NIBP cuff size', category: 'Use-related', foreseeable_sequence_events: 'Adult cuff used on paediatric patient', hazardous_situation: 'Inaccurate BP reading', potential_harm: 'Wrong dosing decision', initial_severity: 3, initial_probability: 3, risk_control_measure: 'Colour-coded cuff connectors; on-screen patient-size selector', risk_control_type: 'Information for Safety', residual_severity: 3, residual_probability: 2 },
];

const PUMP_HAZARDS: HazardFixture[] = [
  { description: 'Free-flow of medication', category: 'Mechanical', foreseeable_sequence_events: 'IV set removed without clamping', hazardous_situation: 'Uncontrolled gravity flow to patient', potential_harm: 'Overdose, possibly fatal', initial_severity: 5, initial_probability: 3, risk_control_measure: 'Anti-free-flow clamp on dedicated IV sets only; door-open detection halts flow', risk_control_type: 'Inherent Safety by Design', residual_severity: 5, residual_probability: 1 },
  { description: 'Air embolism', category: 'Functional', foreseeable_sequence_events: 'IV bag empties without detection', hazardous_situation: 'Air infused to patient', potential_harm: 'Air embolism, stroke, death', initial_severity: 5, initial_probability: 2, risk_control_measure: 'Ultrasonic air-in-line detector (50 µL sensitivity); auto-stop + alarm', risk_control_type: 'Protective Measures', residual_severity: 5, residual_probability: 1 },
  { description: 'Wrong drug delivered', category: 'Use-related', foreseeable_sequence_events: 'Clinician selects wrong drug from library', hazardous_situation: 'Patient receives wrong medication', potential_harm: 'Severe adverse reaction', initial_severity: 5, initial_probability: 3, risk_control_measure: 'DERS soft-limits + confirmation step; barcode-verified drug selection', risk_control_type: 'Protective Measures', residual_severity: 4, residual_probability: 2 },
  { description: 'Over-infusion due to keypad error', category: 'Use-related', foreseeable_sequence_events: 'Decimal point mis-entered (10.0 instead of 1.0)', hazardous_situation: '10× dose programmed', potential_harm: 'Overdose', initial_severity: 5, initial_probability: 3, risk_control_measure: 'DERS hard-limits; dose displayed in mg/h with confirmation screen', risk_control_type: 'Protective Measures', residual_severity: 5, residual_probability: 1 },
  { description: 'Occlusion not detected', category: 'Functional', foreseeable_sequence_events: 'IV line kinked', hazardous_situation: 'No flow to patient, alarm fails', potential_harm: 'Therapy failure', initial_severity: 4, initial_probability: 2, risk_control_measure: 'Downstream pressure sensor with 3-level alarm threshold', risk_control_type: 'Inherent Safety by Design', residual_severity: 4, residual_probability: 1 },
  { description: 'Pump runs at wrong rate after firmware update', category: 'Software', foreseeable_sequence_events: 'Calibration table corrupted', hazardous_situation: 'Flow rate ±20% off setpoint', potential_harm: 'Under/overdose', initial_severity: 5, initial_probability: 2, risk_control_measure: 'Post-update self-calibration with reference flow; checksum on cal table', risk_control_type: 'Protective Measures', residual_severity: 5, residual_probability: 1 },
  { description: 'Battery depletion mid-infusion', category: 'Electrical', foreseeable_sequence_events: 'Power cord disconnected', hazardous_situation: 'Pump stops mid-infusion', potential_harm: 'Therapy interruption', initial_severity: 3, initial_probability: 3, risk_control_measure: '8 h battery + 30 min low-battery audible alarm', risk_control_type: 'Protective Measures', residual_severity: 3, residual_probability: 1 },
  { description: 'Cybersecurity: drug library tampered', category: 'Cybersecurity', foreseeable_sequence_events: 'USB-C servicing port compromised', hazardous_situation: 'Library limits removed', potential_harm: 'Wide-scale overdose risk', initial_severity: 5, initial_probability: 2, risk_control_measure: 'Library signed; servicing port disabled in clinical mode (key required)', risk_control_type: 'Protective Measures', residual_severity: 5, residual_probability: 1 },
  { description: 'IV-set DEHP plasticiser leaching', category: 'Biocompatibility', foreseeable_sequence_events: 'Use of non-DEHP-free set', hazardous_situation: 'Leaching of DEHP into infusate', potential_harm: 'Reproductive toxicity in neonates', initial_severity: 4, initial_probability: 2, risk_control_measure: 'Only DEHP-free sets validated for use; IFU mandates branded sets', risk_control_type: 'Inherent Safety by Design', residual_severity: 3, residual_probability: 1 },
  { description: 'Pole-clamp failure causing pump fall', category: 'Mechanical', foreseeable_sequence_events: 'Clamp screw loosens over time', hazardous_situation: 'Pump drops onto patient or floor', potential_harm: 'Bruising, device damage', initial_severity: 3, initial_probability: 2, risk_control_measure: 'Self-locking screw + visual gauge; servicing checklist', risk_control_type: 'Information for Safety', residual_severity: 2, residual_probability: 2 },
  { description: 'Audible alarm masked by ward noise', category: 'Use-related', foreseeable_sequence_events: 'High ambient noise in ICU', hazardous_situation: 'Critical alarm not heard', potential_harm: 'Missed event', initial_severity: 4, initial_probability: 3, risk_control_measure: 'Min 60 dB alarm + visual flashing LED; nurse-call relay output', risk_control_type: 'Protective Measures', residual_severity: 4, residual_probability: 1 },
  { description: 'Pinch injury during loading', category: 'Mechanical', foreseeable_sequence_events: 'Finger between door and chassis', hazardous_situation: 'Door closes on finger', potential_harm: 'Pinch / minor cut', initial_severity: 2, initial_probability: 3, risk_control_measure: 'Door requires two-step latch; warning label', risk_control_type: 'Inherent Safety by Design', residual_severity: 2, residual_probability: 2 },
];

const STRIP_HAZARDS: HazardFixture[] = [
  { description: 'False negative result', category: 'Functional', foreseeable_sequence_events: 'Specimen below detection threshold', hazardous_situation: 'Patient with strep-A receives no antibiotic', potential_harm: 'Untreated infection, rheumatic fever', initial_severity: 4, initial_probability: 3, risk_control_measure: 'Documented LoD; IFU requires culture for high suspicion despite negative', risk_control_type: 'Information for Safety', residual_severity: 4, residual_probability: 2 },
  { description: 'False positive result', category: 'Functional', foreseeable_sequence_events: 'Cross-reactivity with non-target antigen', hazardous_situation: 'Patient receives unnecessary antibiotic', potential_harm: 'Antimicrobial resistance contribution, side effects', initial_severity: 3, initial_probability: 2, risk_control_measure: 'Cross-reactivity panel tested per CLSI EP7; documented in IFU', risk_control_type: 'Inherent Safety by Design', residual_severity: 3, residual_probability: 1 },
  { description: 'Sterile barrier breach', category: 'Sterility', foreseeable_sequence_events: 'Pouch damaged in transport', hazardous_situation: 'Non-sterile strip used', potential_harm: 'Site contamination', initial_severity: 3, initial_probability: 2, risk_control_measure: 'Tear-resistant pouch validated to ISO 11607; visual integrity check in IFU', risk_control_type: 'Protective Measures', residual_severity: 3, residual_probability: 1 },
  { description: 'Throat swab causes mucosal injury', category: 'Mechanical', foreseeable_sequence_events: 'Excessive force during swabbing', hazardous_situation: 'Mucosal abrasion', potential_harm: 'Minor bleeding, discomfort', initial_severity: 2, initial_probability: 3, risk_control_measure: 'Soft rayon swab; technique illustrated in IFU; for use by trained staff', risk_control_type: 'Information for Safety', residual_severity: 2, residual_probability: 2 },
  { description: 'Result misread by lay user', category: 'Use-related', foreseeable_sequence_events: 'Ambient light too dim', hazardous_situation: 'Faint line interpreted incorrectly', potential_harm: 'Wrong clinical decision', initial_severity: 3, initial_probability: 3, risk_control_measure: 'High-contrast colour gold-particle label; result reading window with timer', risk_control_type: 'Inherent Safety by Design', residual_severity: 3, residual_probability: 2 },
  { description: 'Read time ignored', category: 'Use-related', foreseeable_sequence_events: 'Result read after 30 min', hazardous_situation: 'Late-developing band misclassified positive', potential_harm: 'Unnecessary antibiotic', initial_severity: 3, initial_probability: 3, risk_control_measure: 'IFU explicit "do not read after 10 min"; on-pack icon', risk_control_type: 'Information for Safety', residual_severity: 3, residual_probability: 2 },
  { description: 'Storage above 30 °C degrades antibody', category: 'Functional', foreseeable_sequence_events: 'Strip stored in unrefrigerated van', hazardous_situation: 'Antibody activity lost', potential_harm: 'False negatives', initial_severity: 3, initial_probability: 3, risk_control_measure: 'Stability tested 2–30 °C, 24 mo; cold-chain indicator on transport box', risk_control_type: 'Protective Measures', residual_severity: 3, residual_probability: 2 },
  { description: 'Allergic reaction to swab material', category: 'Biocompatibility', foreseeable_sequence_events: 'Patient allergic to rayon binder', hazardous_situation: 'Mild oral irritation', potential_harm: 'Localised reaction', initial_severity: 2, initial_probability: 1, risk_control_measure: 'ISO 10993-10 sensitisation tested; latex-free declaration', risk_control_type: 'Inherent Safety by Design', residual_severity: 2, residual_probability: 1 },
  { description: 'Sample contamination cross-patient', category: 'Use-related', foreseeable_sequence_events: 'Reused swab', hazardous_situation: 'Pathogen transmission', potential_harm: 'Iatrogenic infection', initial_severity: 4, initial_probability: 1, risk_control_measure: 'Single-use design; "discard after use" pictogram on pouch', risk_control_type: 'Information for Safety', residual_severity: 4, residual_probability: 1 },
  { description: 'Use beyond expiry', category: 'Functional', foreseeable_sequence_events: 'Older stock used after expiry', hazardous_situation: 'Reduced sensitivity', potential_harm: 'False negatives', initial_severity: 3, initial_probability: 2, risk_control_measure: 'Lot + expiry on each pouch; receiving inspection per supplier QA', risk_control_type: 'Information for Safety', residual_severity: 3, residual_probability: 1 },
];

export const ACME_HAZARDS: Record<string, HazardFixture[]> = {
  'acmeguard-100': COMMON_MONITOR_HAZARDS,
  'acmeguard-200': COMMON_MONITOR_HAZARDS, // inherits + additionally see SpO2-specific (omitted for brevity)
  'acmeguard-300': COMMON_MONITOR_HAZARDS,
  'acmepump-xr': PUMP_HAZARDS,
  'acmestrip-one': STRIP_HAZARDS,
};

// ── Notifications (activity feed for Mission Control) ────────────────────

export interface NotificationFixture {
  title: string;
  message: string;
  category: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  entity_type?: string;
  days_ago: number;
}

export const ACME_NOTIFICATIONS: NotificationFixture[] = [
  { title: 'New CAPA opened: Battery thermal runaway investigation', message: 'CAPA-2026-007 created — investigating field report from Helsinki University Hospital.', category: 'quality', action: 'capa_created', priority: 'high', days_ago: 1 },
  { title: 'Supplier audit due: Milano Power Cells SpA', message: 'Probationary supplier audit scheduled in 30 days. Documents required.', category: 'quality', action: 'audit_due', priority: 'high', days_ago: 2 },
  { title: 'Design Review approved: AcmeGuard 200 V&V Report', message: 'V&V report for SpO2 module approved by quality and engineering leads.', category: 'design', action: 'design_review_approved', priority: 'medium', days_ago: 3 },
  { title: 'Training overdue: ISO 14971 refresher', message: '3 staff members have ISO 14971 training overdue by >30 days.', category: 'quality', action: 'training_overdue', priority: 'high', days_ago: 4 },
  { title: 'BOM revision activated: AcmeGuard 100 rev C', message: 'New active BOM revision links 17 components to qualified suppliers.', category: 'engineering', action: 'bom_activated', priority: 'medium', days_ago: 5 },
  { title: 'Hazard added: Wi-Fi telemetry signal jamming (AcmeGuard 300)', message: 'New cybersecurity hazard added to risk file.', category: 'risk', action: 'hazard_added', priority: 'medium', days_ago: 7 },
  { title: 'Non-conformance closed: NC-2026-014', message: 'Front-bezel surface defect from Helsinki Polymers root-caused and closed.', category: 'quality', action: 'nc_closed', priority: 'low', days_ago: 9 },
  { title: 'Change Control approved: CCR-2026-003', message: 'AcmePump XR drug library v2.1 approved for release.', category: 'change_control', action: 'ccr_approved', priority: 'medium', days_ago: 11 },
  { title: 'Supplier qualified: Singapore PCBA Pte Ltd', message: 'New CMO qualified for AcmeGuard mainboard assembly. ISO 13485 certificate verified.', category: 'supply_chain', action: 'supplier_qualified', priority: 'medium', days_ago: 14 },
  { title: 'PSUR draft ready for review: AcmeStrip One', message: 'Annual PSUR for AcmeStrip One ready for QA Manager sign-off.', category: 'regulatory', action: 'psur_ready', priority: 'high', days_ago: 16 },
];
