export interface FundingStageInfo {
  key: string;
  label: string;
  typicalAmount: string;
  typicalAmountRange: { min: number; max: number };
  description: string;
  medtechContext: string;
  investorTypes: string[];
  milestones: string[];
  timelineMonths: string;
  dilutionRange: string;
}

export const fundingStageInfo: Record<string, FundingStageInfo> = {
  'pre-seed': {
    key: 'pre-seed',
    label: 'Pre-Seed',
    typicalAmount: '€50K - €500K',
    typicalAmountRange: { min: 50000, max: 500000 },
    description: 'Earliest stage funding, typically from friends, family, or angel investors to prove initial concept viability.',
    medtechContext: 'Usually covers initial concept validation, IP protection filing, and early prototype development. For MedTech, this often means proving the technical concept before any regulatory work begins.',
    investorTypes: ['Friends & Family', 'Angel Investors', 'Accelerators', 'University Grants'],
    milestones: [
      'Proof of concept demonstrated',
      'Initial IP/patent filing',
      'Founding team assembled',
      'Market opportunity validated'
    ],
    timelineMonths: '6-12 months runway',
    dilutionRange: '10-15% equity'
  },
  'seed': {
    key: 'seed',
    label: 'Seed',
    typicalAmount: '€500K - €3M',
    typicalAmountRange: { min: 500000, max: 3000000 },
    description: 'First institutional funding round to develop MVP, validate product-market fit, and prepare regulatory strategy.',
    medtechContext: 'Covers design freeze, bench testing, initial biocompatibility studies, and regulatory strategy development. For Class II/III devices, this stage often includes pre-submission meetings with regulatory bodies.',
    investorTypes: ['Seed VC Funds', 'Strategic Angels', 'MedTech Accelerators', 'Corporate Venture Arms'],
    milestones: [
      'Design freeze achieved',
      'Regulatory pathway defined',
      'Key preclinical data generated',
      'Manufacturing partner identified'
    ],
    timelineMonths: '12-18 months runway',
    dilutionRange: '15-25% equity'
  },
  'series-a': {
    key: 'series-a',
    label: 'Series A',
    typicalAmount: '€3M - €15M',
    typicalAmountRange: { min: 3000000, max: 15000000 },
    description: 'Growth funding to scale operations after proving traction, typically funding clinical trials and regulatory submissions.',
    medtechContext: 'For MedTech, Series A often funds clinical trials, regulatory submissions (510(k), CE marking), and initial manufacturing scale-up. Class III devices may use this for pivotal trial preparation.',
    investorTypes: ['Venture Capital Firms', 'Strategic Investors', 'Family Offices', 'Corporate VCs'],
    milestones: [
      'Clinical trial initiation or completion',
      'Regulatory submission filed',
      'Manufacturing scale-up',
      'First commercial partnerships'
    ],
    timelineMonths: '18-24 months runway',
    dilutionRange: '20-30% equity'
  },
  'series-b': {
    key: 'series-b',
    label: 'Series B',
    typicalAmount: '€15M - €50M',
    typicalAmountRange: { min: 15000000, max: 50000000 },
    description: 'Expansion funding for commercial launch, market penetration, and international expansion.',
    medtechContext: 'Funds commercial launch, sales team build-out, international regulatory submissions, and market expansion. For high-risk devices, may cover post-market surveillance and additional clinical evidence generation.',
    investorTypes: ['Growth VCs', 'Private Equity', 'Strategic Acquirers', 'Crossover Investors'],
    milestones: [
      'Commercial launch achieved',
      'Revenue generation proven',
      'Market expansion initiated',
      'Reimbursement coverage secured'
    ],
    timelineMonths: '24-36 months runway',
    dilutionRange: '15-25% equity'
  },
  'bridge': {
    key: 'bridge',
    label: 'Bridge',
    typicalAmount: '€500K - €5M',
    typicalAmountRange: { min: 500000, max: 5000000 },
    description: 'Short-term financing between major rounds, often convertible notes or SAFEs to extend runway to a specific milestone.',
    medtechContext: 'Common in MedTech when awaiting regulatory decision, clinical trial results, or preparing for a larger round. Can bridge to clearance/approval or commercial launch.',
    investorTypes: ['Existing Investors', 'Angels', 'Venture Debt Providers', 'Strategic Partners'],
    milestones: [
      'Specific milestone achievement',
      'Regulatory decision pending',
      'Clinical data readout expected',
      'Acquisition discussions ongoing'
    ],
    timelineMonths: '6-12 months runway',
    dilutionRange: 'Varies (often convertible)'
  },
  'other': {
    key: 'other',
    label: 'Other / Non-Dilutive',
    typicalAmount: 'Varies',
    typicalAmountRange: { min: 0, max: 10000000 },
    description: 'Alternative funding including grants, venture debt, revenue-based financing, or strategic partnerships.',
    medtechContext: 'MedTech companies can access significant non-dilutive funding through grants (Horizon Europe, NIH SBIR/STTR), venture debt, or strategic R&D partnerships with larger companies.',
    investorTypes: ['Government Grants', 'Venture Debt', 'Strategic Partners', 'Revenue-Based Financing'],
    milestones: [
      'Grant milestones defined',
      'Revenue sufficient for debt service',
      'Strategic value proposition clear',
      'Specific use of funds identified'
    ],
    timelineMonths: 'Project-dependent',
    dilutionRange: '0% (non-dilutive options)'
  }
};

export const getFundingStageInfo = (stage: string): FundingStageInfo | undefined => {
  return fundingStageInfo[stage];
};

export const getAllFundingStages = (): FundingStageInfo[] => {
  return Object.values(fundingStageInfo);
};
