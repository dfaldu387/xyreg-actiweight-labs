export interface NUBStatus {
  status: number;
  name: string;
  description: string;
  implications: string;
  nextSteps: string[];
}

export interface NUBProcessStep {
  step: number;
  title: string;
  description: string;
  timeline: string;
  keyActions: string[];
  documents?: string[];
}

export const NUB_STATUSES: NUBStatus[] = [
  {
    status: 1,
    name: "Approved for Negotiation",
    description: "Method is recognized as new and not adequately covered by existing DRG system",
    implications: "Hospital can negotiate individual surcharges with health insurance companies",
    nextSteps: [
      "Hospital initiates price negotiations with payers (Krankenkassen)",
      "Prepare cost calculation and clinical evidence",
      "Agreement valid for calendar year, must be renewed annually",
      "NUB code assigned for billing"
    ]
  },
  {
    status: 2,
    name: "Rejected - Insufficient Novelty",
    description: "Method does not meet criteria for novelty or is not sufficiently complex",
    implications: "No additional reimbursement available beyond existing DRG rates",
    nextSteps: [
      "Review rejection reasoning from InEK",
      "Consider appealing with additional evidence",
      "Explore alternative reimbursement pathways (e.g., existing OPS codes)",
      "May reapply in future years with updated evidence"
    ]
  },
  {
    status: 3,
    name: "Additional Information Requested",
    description: "InEK requires more documentation or clarification before making decision",
    implications: "Decision postponed pending additional information submission",
    nextSteps: [
      "Identify specific information gaps",
      "Gather requested clinical/technical documentation",
      "Resubmit within specified deadline",
      "Final decision expected in subsequent review cycle"
    ]
  },
  {
    status: 4,
    name: "Adequately Reimbursed",
    description: "Method is already sufficiently covered by existing DRG system",
    implications: "No additional NUB surcharge warranted - use existing codes",
    nextSteps: [
      "Identify applicable DRG and OPS codes",
      "Ensure proper documentation for existing code billing",
      "Consider if cost structure truly covered by current reimbursement"
    ]
  }
];

export const NUB_PROCESS_STEPS: NUBProcessStep[] = [
  {
    step: 1,
    title: "Hospital Identifies New Method",
    description: "Hospital recognizes use of innovative medical technology or procedure not adequately covered",
    timeline: "Ongoing throughout year",
    keyActions: [
      "Identify new examination/treatment method being used",
      "Assess if method is truly 'new' (not existing in DRG catalog)",
      "Evaluate if costs are not covered by existing DRG rates",
      "Determine if method shows potential benefit vs. established alternatives"
    ],
    documents: [
      "Clinical evidence of method use",
      "Cost analysis vs. existing DRG reimbursement",
      "Technical device specifications"
    ]
  },
  {
    step: 2,
    title: "Submit NUB Application to InEK",
    description: "Annual submission to Institute for Hospital Remuneration System (InEK)",
    timeline: "Deadline: October 31 (annually)",
    keyActions: [
      "Complete official NUB application form",
      "Provide detailed method description",
      "Submit clinical evidence and cost data",
      "Include device technical documentation",
      "Submit via InEK online portal"
    ],
    documents: [
      "NUB-Antrag (official application form)",
      "Clinical studies or literature",
      "Detailed cost breakdown",
      "Device specifications and regulatory approvals",
      "Intended use and patient population description"
    ]
  },
  {
    step: 3,
    title: "InEK Evaluation Process",
    description: "InEK reviews application for novelty and clinical/economic significance",
    timeline: "December - March (following submission)",
    keyActions: [
      "InEK assesses novelty criteria",
      "Reviews clinical evidence quality",
      "Evaluates whether costs exceed existing DRG coverage",
      "May request additional information (Status 3)",
      "Publishes preliminary status list"
    ]
  },
  {
    step: 4,
    title: "Status Assignment Published",
    description: "InEK publishes official status decision",
    timeline: "Published annually (typically March/April)",
    keyActions: [
      "Check InEK website for status assignment",
      "Review reasoning for decision",
      "If Status 1: prepare for negotiations",
      "If Status 2/4: consider appeal or alternative pathways",
      "If Status 3: respond with requested information"
    ]
  },
  {
    step: 5,
    title: "Individual Hospital Negotiations (Status 1 only)",
    description: "Hospital negotiates surcharge amounts with health insurance companies",
    timeline: "April - December (for current calendar year)",
    keyActions: [
      "Contact payers (AOK, TK, Barmer, etc.) for negotiations",
      "Present cost calculations and clinical justification",
      "Negotiate per-case surcharge amount",
      "Formalize agreements in writing",
      "Submit agreements to InEK for NUB code assignment"
    ],
    documents: [
      "Detailed cost calculation",
      "Clinical outcome data",
      "Comparison to existing alternatives",
      "Negotiation agreements with payers"
    ]
  },
  {
    step: 6,
    title: "Billing with NUB Code",
    description: "Apply NUB surcharge to eligible cases throughout calendar year",
    timeline: "January 1 - December 31 (agreement year)",
    keyActions: [
      "Document eligible patient cases",
      "Apply appropriate NUB code to invoices",
      "Bill surcharge amount per agreement",
      "Track cases for annual reporting",
      "Prepare for renewal application in following year"
    ]
  }
];

export const NUB_KEY_FACTS = {
  title: "What is NUB?",
  subtitle: "Neue Untersuchungs- und Behandlungsmethoden",
  description: "NUB (New Examination and Treatment Methods) is a German reimbursement mechanism allowing hospitals to receive temporary additional funding for innovative medical technologies not yet adequately covered by the DRG system.",
  targetSetting: "Inpatient hospital care (§ 137c SGB V)",
  duration: "Agreements valid for one calendar year, renewable annually",
  governingBody: "InEK (Institut für das Entgeltsystem im Krankenhaus)",
  annualCycle: "Application deadline: October 31, Status published: March/April",
  idealFor: [
    "High-cost innovative devices",
    "Novel surgical procedures",
    "New diagnostic methods",
    "Technologies with insufficient DRG coverage"
  ]
};
