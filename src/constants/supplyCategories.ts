export const SUPPLY_CATEGORIES = [
  {
    value: 'Raw Materials',
    label: 'Raw Materials',
    description: 'Metals, polymers, ceramics, and other base materials'
  },
  {
    value: 'Electronic Components',
    label: 'Electronic Components',
    description: 'Sensors, chips, circuits, and electronic assemblies'
  },
  {
    value: 'Manufacturing Services',
    label: 'Manufacturing Services',
    description: 'Machining, molding, assembly, and fabrication services'
  },
  {
    value: 'Packaging Materials',
    label: 'Packaging Materials',
    description: 'Sterile packaging, labels, and protective materials'
  },
  {
    value: 'Testing & Validation Services',
    label: 'Testing & Validation Services',
    description: 'Biocompatibility, sterilization, and regulatory testing'
  },
  {
    value: 'Software Components',
    label: 'Software Components',
    description: 'Embedded software, algorithms, and digital solutions'
  },
  {
    value: 'Regulatory Services',
    label: 'Regulatory Services',
    description: 'Consulting, documentation, and compliance support'
  },
  {
    value: 'Logistics & Distribution',
    label: 'Logistics & Distribution',
    description: 'Warehousing, shipping, and supply chain services'
  },
  {
    value: 'Quality Systems',
    label: 'Quality Systems',
    description: 'Calibration, auditing, and quality assurance services'
  },
  {
    value: 'Other',
    label: 'Other',
    description: 'Custom or specialized supply category'
  }
] as const;

export type SupplyCategoryValue = typeof SUPPLY_CATEGORIES[number]['value'];