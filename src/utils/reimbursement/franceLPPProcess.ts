export const LPP_KEY_FACTS = {
  title: 'LPP (Liste des Produits et Prestations)',
  subtitle: 'Reimbursable Medical Devices & Services List',
  description: 'The LPP is the official list of medical devices and services reimbursable by French Social Security (Assurance Maladie). Inclusion on the LPP is mandatory for reimbursement and requires HAS evaluation demonstrating clinical benefit.',
  governingBody: 'CEPS (Comité Économique des Produits de Santé) & HAS',
  duration: 'Initial evaluation: 12-24 months; Renewal: every 5 years',
  coverage: '90% of French health expenditure covered by Social Security',
  targetSetting: 'Both hospital and community/retail settings'
};

export const LPP_CATEGORIES = [
  {
    category: 'Titre I',
    name: 'Dressings & Bandages',
    description: 'Wound care products, bandages, compression therapy',
    examples: ['Advanced wound dressings', 'Compression stockings', 'Surgical bandages']
  },
  {
    category: 'Titre II',
    name: 'Orthopedic Devices',
    description: 'Prosthetics, orthotics, mobility aids',
    examples: ['Prosthetic limbs', 'Orthotic braces', 'Walking aids', 'Wheelchairs']
  },
  {
    category: 'Titre III',
    name: 'Medical Equipment',
    description: 'Rental or purchase of medical equipment',
    examples: ['Oxygen concentrators', 'CPAP machines', 'Hospital beds', 'Patient lifts']
  },
  {
    category: 'Titre IV',
    name: 'Implantable Devices',
    description: 'Surgically implanted medical devices',
    examples: ['Pacemakers', 'Joint prostheses', 'Vascular stents', 'Breast implants']
  }
];

export const LPP_APPLICATION_STEPS = [
  {
    step: 1,
    title: 'Pre-submission Preparation',
    timeline: '3-6 months',
    description: 'Gather clinical evidence, health economic data, and prepare comprehensive dossier for HAS review',
    keyActions: [
      'Compile clinical studies demonstrating safety and efficacy',
      'Prepare comparative effectiveness data vs. existing alternatives',
      'Conduct health economic analysis (cost-effectiveness)',
      'Identify appropriate LPP category (Titre I-IV)',
      'Prepare French translations of all documentation'
    ],
    documents: [
      'Clinical evaluation report (EN ISO 14155)',
      'Instructions for use (IFU) in French',
      'CE marking certificate and technical documentation',
      'Health economic dossier',
      'Proposed reimbursement tariff'
    ]
  },
  {
    step: 2,
    title: 'HAS Clinical Evaluation',
    timeline: '6-9 months',
    description: 'HAS CNEDiMTS commission evaluates clinical benefit (Service Attendu) and improvement vs. alternatives (Amélioration du Service Attendu)',
    keyActions: [
      'HAS assigns dossier to expert reviewers',
      'Manufacturer may be requested to provide additional data',
      'CNEDiMTS commission meets to assess clinical evidence',
      'HAS issues opinion on Service Attendu (SA) level',
      'HAS issues opinion on Amélioration du Service Attendu (ASA) level'
    ],
    stakeholders: ['HAS', 'CNEDiMTS', 'Clinical experts', 'Patient representatives']
  },
  {
    step: 3,
    title: 'Economic Evaluation & Pricing',
    timeline: '3-6 months',
    description: 'CEPS negotiates reimbursement price based on HAS assessment and health economic impact',
    keyActions: [
      'Manufacturer submits pricing proposal to CEPS',
      'CEPS evaluates price in context of clinical benefit (SA/ASA)',
      'Price negotiations between manufacturer and CEPS',
      'Agreement on final reimbursement tariff',
      'Optional: Performance-based pricing arrangements'
    ],
    stakeholders: ['CEPS', 'Manufacturer', 'UNCAM (health insurance unions)']
  },
  {
    step: 4,
    title: 'LPP Inscription & Publication',
    timeline: '1-2 months',
    description: 'Official inscription on the LPP list and publication in Journal Officiel',
    keyActions: [
      'CEPS publishes decision in Journal Officiel',
      'Product assigned unique LPP code',
      'Reimbursement rate officially established',
      'Product becomes reimbursable across France',
      'Manufacturer notified of renewal requirements (typically 5 years)'
    ],
    stakeholders: ['CEPS', 'Ministry of Health', 'Assurance Maladie']
  }
];

export const SERVICE_ATTENDU_LEVELS = [
  {
    level: 'SA Sufficient',
    color: 'emerald',
    description: 'Clinical benefit is sufficient to warrant reimbursement',
    implications: 'Product is eligible for LPP inscription and full reimbursement',
    criteria: [
      'Demonstrated therapeutic benefit',
      'Favorable benefit/risk ratio',
      'Public health interest established',
      'Comparative effectiveness vs. alternatives'
    ]
  },
  {
    level: 'SA Insufficient',
    color: 'red',
    description: 'Clinical benefit does not justify reimbursement',
    implications: 'Product is NOT eligible for LPP inscription - reimbursement denied',
    criteria: [
      'Insufficient or poor quality clinical evidence',
      'Unfavorable benefit/risk ratio',
      'No demonstrated advantage over existing solutions',
      'Limited or no public health interest'
    ]
  }
];

export const AMELIORATION_SERVICE_ATTENDU_LEVELS = [
  {
    level: 'ASA I - Major',
    description: 'Major improvement over existing alternatives',
    impact: 'Highest reimbursement rates; potential for premium pricing'
  },
  {
    level: 'ASA II - Important',
    description: 'Important but not major improvement',
    impact: 'Favorable reimbursement rates'
  },
  {
    level: 'ASA III - Moderate',
    description: 'Moderate improvement over existing alternatives',
    impact: 'Standard reimbursement rates'
  },
  {
    level: 'ASA IV - Minor',
    description: 'Minor improvement over existing alternatives',
    impact: 'Lower reimbursement rates; price pressure'
  },
  {
    level: 'ASA V - None',
    description: 'No improvement over existing alternatives',
    impact: 'Minimal reimbursement; price must be competitive with existing products'
  }
];
