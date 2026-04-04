export interface GBAProcessStep {
  step: number;
  title: string;
  description: string;
  timeline: string;
  keyActions: string[];
  stakeholders: string[];
}

export interface GBAStakeholder {
  name: string;
  role: string;
  responsibility: string;
}

export const GBA_PROCESS_STEPS: GBAProcessStep[] = [
  {
    step: 1,
    title: "Application/Request Initiation",
    description: "Formal request submitted to G-BA for benefit assessment of medical device",
    timeline: "Initial phase: 1-3 months",
    keyActions: [
      "Identify trigger: §137h SGB V mandatory assessment or voluntary submission",
      "Prepare comprehensive dossier with clinical evidence",
      "Submit application to G-BA",
      "Pay assessment fee (if applicable)"
    ],
    stakeholders: [
      "Manufacturer/Sponsor",
      "G-BA Secretariat"
    ]
  },
  {
    step: 2,
    title: "IQWiG Assessment Commissioned",
    description: "G-BA commissions Institute for Quality and Efficiency in Health Care (IQWiG) to evaluate evidence",
    timeline: "6-12 months",
    keyActions: [
      "IQWiG defines assessment scope and methodology",
      "Systematic review of clinical evidence",
      "Comparative effectiveness analysis vs. standard care",
      "Assessment of patient-relevant outcomes",
      "Draft report prepared",
      "Stakeholder commentary period on draft"
    ],
    stakeholders: [
      "IQWiG (Lead Assessor)",
      "Clinical experts",
      "Patient representatives"
    ]
  },
  {
    step: 3,
    title: "G-BA Hearing and Consultation",
    description: "Formal hearing with stakeholder input before G-BA decision-making body",
    timeline: "3-6 months",
    keyActions: [
      "IQWiG submits final assessment report to G-BA",
      "G-BA publishes report for public consultation",
      "Oral hearing scheduled with manufacturer, medical societies, patient groups",
      "Written statements submitted by stakeholders",
      "G-BA working groups deliberate",
      "Draft resolution prepared"
    ],
    stakeholders: [
      "G-BA Plenum (Decision Body)",
      "Manufacturer",
      "Medical professional associations",
      "Patient organizations",
      "Health insurance representatives",
      "Hospital associations"
    ]
  },
  {
    step: 4,
    title: "Final Decision and Publication",
    description: "G-BA issues final resolution on coverage and conditions of use",
    timeline: "2-4 months",
    keyActions: [
      "G-BA Plenum votes on final resolution",
      "Decision published in Federal Gazette (Bundesanzeiger)",
      "Coverage decision takes legal effect",
      "Implementation guidelines issued",
      "May include conditions, restrictions, or further evidence requirements"
    ],
    stakeholders: [
      "G-BA",
      "Federal Ministry of Health (oversight)",
      "Statutory health insurance funds"
    ]
  }
];

export const GBA_PATHWAYS = [
  {
    pathway: "§137h SGB V",
    name: "Mandatory Hospital Benefit Assessment",
    description: "Required for high-risk Class IIb and Class III medical devices with new examination/treatment methods in hospital setting",
    trigger: "Automatic for qualifying devices",
    timeline: "Typically 18-24 months total",
    implications: [
      "Cannot be reimbursed in hospitals until assessment complete (with exceptions)",
      "Requires robust clinical evidence package",
      "May result in restricted coverage or additional evidence requirements"
    ]
  },
  {
    pathway: "§135 SGB V",
    name: "General Benefit Assessment",
    description: "Assessment of medical services and devices for inclusion in statutory health insurance coverage",
    trigger: "G-BA initiative or stakeholder request",
    timeline: "Variable, typically 12-24 months",
    implications: [
      "Determines eligibility for SHI reimbursement",
      "May apply to outpatient or specific settings",
      "Can result in positive, negative, or conditional coverage"
    ]
  },
  {
    pathway: "§137e SGB V",
    name: "New Examination and Treatment Methods (NUB-like pathway)",
    description: "Related to hospital setting innovations, links to NUB process",
    trigger: "Hospital or manufacturer request",
    timeline: "Ongoing evaluation",
    implications: [
      "Coordinates with NUB temporary funding",
      "May lead to permanent DRG integration",
      "Evidence generation period allowed"
    ]
  }
];

export const GBA_STAKEHOLDERS: GBAStakeholder[] = [
  {
    name: "G-BA (Gemeinsamer Bundesausschuss)",
    role: "Federal Joint Committee - Decision-Making Body",
    responsibility: "Makes final binding decisions on coverage, conditions, and restrictions for statutory health insurance"
  },
  {
    name: "IQWiG (Institut für Qualität und Wirtschaftlichkeit im Gesundheitswesen)",
    role: "Institute for Quality and Efficiency in Health Care",
    responsibility: "Conducts independent health technology assessments, prepares evidence reports for G-BA"
  },
  {
    name: "GKV-Spitzenverband",
    role: "National Association of Statutory Health Insurance Funds",
    responsibility: "Represents payer perspective, negotiates reimbursement rates, voting member of G-BA"
  },
  {
    name: "KBV (Kassenärztliche Bundesvereinigung)",
    role: "National Association of Statutory Health Insurance Physicians",
    responsibility: "Represents outpatient physician interests, voting member of G-BA"
  },
  {
    name: "DKG (Deutsche Krankenhausgesellschaft)",
    role: "German Hospital Association",
    responsibility: "Represents hospital interests, voting member of G-BA"
  },
  {
    name: "Patientenvertretung",
    role: "Patient Representatives",
    responsibility: "Advocate for patient interests, advisory role in G-BA (non-voting)"
  },
  {
    name: "BMG (Bundesministerium für Gesundheit)",
    role: "Federal Ministry of Health",
    responsibility: "Oversight authority, can object to G-BA decisions on legal grounds"
  }
];

export const GBA_KEY_FACTS = {
  title: "What is G-BA?",
  subtitle: "Gemeinsamer Bundesausschuss - Federal Joint Committee",
  description: "The G-BA is Germany's highest decision-making body for statutory health insurance, determining which medical services and devices are covered by SHI. For medical device manufacturers, G-BA decisions are critical for market access.",
  scope: "Determines coverage for ~90% of German population (SHI beneficiaries)",
  authority: "Legally binding decisions with force of law for SHI coverage",
  composition: "Representatives from physicians (KBV), hospitals (DKG), health insurers (GKV), and patients",
  decisions: "~400 resolutions published annually across all healthcare domains",
  criticalForDevices: [
    "High-risk devices (Class IIb/III) with new methods (§137h mandatory)",
    "Devices requiring hospital benefit assessment",
    "Technologies seeking broader SHI coverage",
    "Devices that may replace existing standard of care"
  ]
};
