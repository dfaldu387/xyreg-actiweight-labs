// Strategic Horizon Endgame Types and Checklists

export type EndgameType = 'trade_sale' | 'independent' | 'ipo' | 'licensing' | 'private_equity' | 'uncertain';

export interface EndgameChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

export interface EndgameConfig {
  type: EndgameType;
  title: string;
  subtitle: string;
  goal: string;
  icon: string;
  metricsFocus: string;
  checklist: EndgameChecklistItem[];
  warningMessage?: string;
}

export const ENDGAME_CONFIGS: Record<EndgameType, EndgameConfig> = {
  trade_sale: {
    type: 'trade_sale',
    title: 'Trade Sale (M&A)',
    subtitle: 'Sell to a Strategic Player',
    goal: 'Built to Sell',
    icon: 'Building2',
    metricsFocus: 'Valuation & Strategic Fit',
    checklist: [
      { id: 'dhf', label: 'Design History File Complete', required: true },
      { id: 'fto', label: 'IP Freedom to Operate Analysis', required: true },
      { id: 'clinical', label: 'Clinical Evidence Package', required: true },
      { id: 'dataroom', label: 'Data Room Prepared', required: false },
    ],
  },
  independent: {
    type: 'independent',
    title: 'Independent Growth',
    subtitle: 'Build a Commercial Company',
    goal: 'Built to Last',
    icon: 'TrendingUp',
    metricsFocus: 'Gross Margin & EBITDA',
    checklist: [
      { id: 'salesforce', label: 'Sales Force Structure Defined', required: true },
      { id: 'distributors', label: 'Distributor Contracts', required: true },
      { id: 'logistics', label: 'Post-Market Logistics Plan', required: true },
      { id: 'qms_dist', label: 'QMS for Distribution', required: false },
    ],
    warningMessage: 'Strategy Gap: Independent growth requires 3x more capital than an M&A exit. Review your Funding Phase.',
  },
  ipo: {
    type: 'ipo',
    title: 'IPO',
    subtitle: 'Public Market Listing',
    goal: 'Built to Scale',
    icon: 'Landmark',
    metricsFocus: 'Revenue Growth & Market Cap',
    checklist: [
      { id: 'audit', label: 'Audit-Grade Financials', required: true },
      { id: 'sox', label: 'SOX Compliance Readiness', required: true },
      { id: 'governance', label: 'Board Governance Structure', required: true },
      { id: 'ir', label: 'Investor Relations Plan', required: false },
    ],
  },
  licensing: {
    type: 'licensing',
    title: 'Licensing / Alliance',
    subtitle: 'Strategic Partnership',
    goal: 'Built to Partner',
    icon: 'Handshake',
    metricsFocus: 'Royalty Terms & Territory Coverage',
    checklist: [
      { id: 'royalty', label: 'Royalty Agreement Terms', required: true },
      { id: 'techpack', label: 'Tech Transfer Package', required: true },
      { id: 'reference', label: 'Reference Design Documented', required: true },
      { id: 'ip_carve', label: 'IP Rights Carve-outs', required: false },
    ],
  },
  private_equity: {
    type: 'private_equity',
    title: 'Private Equity',
    subtitle: 'Majority Buyout / Scale-Up',
    goal: 'Built to Optimize',
    icon: 'Briefcase',
    metricsFocus: 'EBITDA & Operational Efficiency',
    checklist: [
      { id: 'ebitda', label: 'EBITDA Optimization Plan', required: true },
      { id: 'costs', label: 'Cost Reduction Roadmap', required: true },
      { id: 'mgmt', label: 'Management Team Assessment', required: true },
      { id: 'ops', label: 'Operational KPIs Defined', required: false },
    ],
  },
  uncertain: {
    type: 'uncertain',
    title: 'Uncertain',
    subtitle: 'Exit Path Not Yet Defined',
    goal: 'Exploring Options',
    icon: 'HelpCircle',
    metricsFocus: 'Optionality & Flexibility',
    checklist: [
      { id: 'explore', label: 'Document Key Strategic Questions', required: false },
      { id: 'milestones', label: 'Define Decision Milestones', required: false },
      { id: 'options', label: 'Map Potential Exit Paths', required: false },
    ],
  },
};

export const ENDGAME_ORDER: EndgameType[] = [
  'trade_sale',
  'independent',
  'ipo',
  'licensing',
  'private_equity',
  'uncertain',
];
