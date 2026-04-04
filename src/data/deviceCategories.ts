export const DEVICE_CATEGORIES = [
  {
    value: 'surgical_instruments',
    label: 'Surgical Instruments',
    description: 'e.g., scalpels, forceps'
  },
  {
    value: 'implantable_devices',
    label: 'Implantable Devices',
    description: 'e.g., orthopedic implants, pacemakers'
  },
  {
    value: 'diagnostic_equipment',
    label: 'Diagnostic Equipment',
    description: 'e.g., ultrasound scanners, ECG monitors'
  },
  {
    value: 'therapeutic_devices',
    label: 'Therapeutic Devices',
    description: 'e.g., infusion pumps, ventilators'
  },
  {
    value: 'patient_monitoring_systems',
    label: 'Patient Monitoring Systems',
    description: 'e.g., vital signs monitors, telemetry systems'
  },
  {
    value: 'ivd_devices',
    label: 'In-Vitro Diagnostic (IVD) Devices',
    description: 'e.g., blood glucose meters, pregnancy tests'
  },
  {
    value: 'software_medical_device',
    label: 'Software as a Medical Device (SaMD)',
    description: 'e.g., diagnostic software, treatment planning apps'
  },
  {
    value: 'single_use_consumables',
    label: 'Single-Use & Consumable Devices',
    description: 'e.g., catheters, syringes, sterile kits'
  },
  {
    value: 'dental_devices',
    label: 'Dental Devices',
    description: 'e.g., dental implants, orthodontic devices'
  },
  {
    value: 'orthopedic_devices',
    label: 'Orthopedic Devices',
    description: 'e.g., joint replacements, spinal devices'
  },
  {
    value: 'ophthalmic_devices',
    label: 'Ophthalmic Devices',
    description: 'e.g., contact lenses, intraocular lenses'
  },
  {
    value: 'rehabilitation_assistive',
    label: 'Rehabilitation & Assistive Technology',
    description: 'e.g., wheelchairs, prosthetics, mobility aids'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'For devices not covered by the above categories'
  }
] as const;

export type DeviceCategoryValue = typeof DEVICE_CATEGORIES[number]['value'];