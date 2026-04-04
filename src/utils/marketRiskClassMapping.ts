
// Market data with relevant information for each market
export interface RiskClassOption {
  value: string;
  label: string;
}

export interface MarketRiskClass {
  code: string;
  name: string;
  regulatoryStatuses: {
    value: string;
    label: string;
  }[];
  riskClasses: RiskClassOption[]; // Keep for backwards compatibility
  mdrRiskClasses: RiskClassOption[]; // Medical Device classes
  ivdRiskClasses: RiskClassOption[]; // IVD classes
}

export const marketData: MarketRiskClass[] = [
  {
    code: "EU",
    name: "European Union",
    regulatoryStatuses: [
      { value: "CE_MARKED", label: "CE Marked" },
      { value: "CE_MARKING_IN_PROGRESS", label: "CE Marking in Progress" },
      { value: "MARKET_WITHDRAWN", label: "Market Withdrawn" },
      { value: "MARKET_RECALL", label: "Market Recall" },
      { value: "PENDING_APPROVAL", label: "Pending Approval" },
      { value: "UNDER_REVIEW", label: "Under Review" }
    ],
    riskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "IIa", label: "Class IIa" },
      { value: "IIb", label: "Class IIb" },
      { value: "III", label: "Class III" }
    ],
    mdrRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "IIa", label: "Class IIa" },
      { value: "IIb", label: "Class IIb" },
      { value: "III", label: "Class III" }
    ],
    ivdRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "A", label: "Class A" },
      { value: "B", label: "Class B" },
      { value: "C", label: "Class C" },
      { value: "D", label: "Class D" }
    ]
  },
  {
    code: "USA",
    name: "United States",
    regulatoryStatuses: [
      { value: "FDA_APPROVED", label: "FDA Approved" },
      { value: "FDA_CLEARED", label: "FDA Cleared" },
      { value: "FDA_DENIED", label: "FDA Denied" },
      { value: "FDA_PENDING", label: "FDA Pending" },
      { value: "MARKET_WITHDRAWN", label: "Market Withdrawn" },
      { value: "MARKET_RECALL", label: "Market Recall" }
    ],
    riskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" }
    ],
    mdrRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" }
    ],
    ivdRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" }
    ]
  },
  {
    code: "CA",
    name: "Canada",
    regulatoryStatuses: [
      { value: "HEALTH_CANADA_LICENSED", label: "Health Canada Licensed" },
      { value: "HEALTH_CANADA_REVIEW", label: "Health Canada Review in Progress" },
      { value: "MARKET_WITHDRAWN", label: "Market Withdrawn" },
      { value: "MARKET_RECALL", label: "Market Recall" },
      { value: "PENDING_APPROVAL", label: "Pending Approval" }
    ],
    riskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" },
      { value: "IV", label: "Class IV" }
    ],
    mdrRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" },
      { value: "IV", label: "Class IV" }
    ],
    ivdRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" },
      { value: "IV", label: "Class IV" }
    ]
  },
  {
    code: "BR",
    name: "Brazil",
    regulatoryStatuses: [
      { value: "ANVISA_APPROVED", label: "ANVISA Approved" },
      { value: "ANVISA_PENDING", label: "ANVISA Pending" },
      { value: "MARKET_WITHDRAWN", label: "Market Withdrawn" },
      { value: "MARKET_RECALL", label: "Market Recall" },
      { value: "INACTIVE", label: "Inactive" }
    ],
    riskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" },
      { value: "IV", label: "Class IV" }
    ],
    mdrRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" },
      { value: "IV", label: "Class IV" }
    ],
    ivdRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" },
      { value: "IV", label: "Class IV" }
    ]
  },
  {
    code: "AU",
    name: "Australia",
    regulatoryStatuses: [
      { value: "TGA_REGISTERED", label: "TGA Registered" },
      { value: "TGA_PENDING", label: "TGA Pending" },
      { value: "MARKET_WITHDRAWN", label: "Market Withdrawn" },
      { value: "MARKET_RECALL", label: "Market Recall" }
    ],
    riskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "IIa", label: "Class IIa" },
      { value: "IIb", label: "Class IIb" },
      { value: "III", label: "Class III" }
    ],
    mdrRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "IIa", label: "Class IIa" },
      { value: "IIb", label: "Class IIb" },
      { value: "III", label: "Class III" }
    ],
    ivdRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "1", label: "Class 1" },
      { value: "2", label: "Class 2" },
      { value: "3", label: "Class 3" },
      { value: "4", label: "Class 4" }
    ]
  },
  {
    code: "JP",
    name: "Japan",
    regulatoryStatuses: [
      { value: "PMDA_APPROVED", label: "PMDA Approved" },
      { value: "PMDA_PENDING", label: "PMDA Pending" },
      { value: "MARKET_WITHDRAWN", label: "Market Withdrawn" },
      { value: "MARKET_RECALL", label: "Market Recall" },
      { value: "UNDER_REVIEW", label: "Under Review" }
    ],
    riskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" },
      { value: "IV", label: "Class IV" }
    ],
    mdrRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" },
      { value: "IV", label: "Class IV" }
    ],
    ivdRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" },
      { value: "IV", label: "Class IV" }
    ]
  },
  {
    code: "CN",
    name: "China",
    regulatoryStatuses: [
      { value: "NMPA_APPROVED", label: "NMPA Approved" },
      { value: "NMPA_PENDING", label: "NMPA Pending" },
      { value: "MARKET_WITHDRAWN", label: "Market Withdrawn" },
      { value: "MARKET_RECALL", label: "Market Recall" }
    ],
    riskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" }
    ],
    mdrRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" }
    ],
    ivdRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" }
    ]
  },
  {
    code: "IN",
    name: "India",
    regulatoryStatuses: [
      { value: "CDSCO_APPROVED", label: "CDSCO Approved" },
      { value: "CDSCO_PENDING", label: "CDSCO Pending" },
      { value: "MARKET_WITHDRAWN", label: "Market Withdrawn" },
      { value: "MARKET_RECALL", label: "Market Recall" }
    ],
    riskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "A", label: "Class A" },
      { value: "B", label: "Class B" },
      { value: "C", label: "Class C" },
      { value: "D", label: "Class D" }
    ],
    mdrRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "A", label: "Class A" },
      { value: "B", label: "Class B" },
      { value: "C", label: "Class C" },
      { value: "D", label: "Class D" }
    ],
    ivdRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "A", label: "Class A" },
      { value: "B", label: "Class B" },
      { value: "C", label: "Class C" },
      { value: "D", label: "Class D" }
    ]
  },
  {
    code: "KR",
    name: "South Korea",
    regulatoryStatuses: [
      { value: "KFDA_APPROVED", label: "KFDA Approved" },
      { value: "KFDA_PENDING", label: "KFDA Pending" },
      { value: "MARKET_WITHDRAWN", label: "Market Withdrawn" },
      { value: "MARKET_RECALL", label: "Market Recall" }
    ],
    riskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" },
      { value: "IV", label: "Class IV" }
    ],
    mdrRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" },
      { value: "IV", label: "Class IV" }
    ],
    ivdRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "II", label: "Class II" },
      { value: "III", label: "Class III" },
      { value: "IV", label: "Class IV" }
    ]
  },
  {
    code: "UK",
    name: "United Kingdom",
    regulatoryStatuses: [
      { value: "UKCA_MARKED", label: "UKCA Marked" },
      { value: "UKCA_MARKING_IN_PROGRESS", label: "UKCA Marking in Progress" },
      { value: "MARKET_WITHDRAWN", label: "Market Withdrawn" },
      { value: "MARKET_RECALL", label: "Market Recall" },
      { value: "PENDING_APPROVAL", label: "Pending Approval" },
      { value: "UNDER_REVIEW", label: "Under Review" }
    ],
    riskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "IIa", label: "Class IIa" },
      { value: "IIb", label: "Class IIb" },
      { value: "III", label: "Class III" }
    ],
    mdrRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "IIa", label: "Class IIa" },
      { value: "IIb", label: "Class IIb" },
      { value: "III", label: "Class III" }
    ],
    ivdRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "A", label: "Class A" },
      { value: "B", label: "Class B" },
      { value: "C", label: "Class C" },
      { value: "D", label: "Class D" }
    ]
  },
  {
    code: "CH",
    name: "Switzerland",
    regulatoryStatuses: [
      { value: "SWISSMEDIC_APPROVED", label: "Swissmedic Approved" },
      { value: "SWISSMEDIC_PENDING", label: "Swissmedic Pending" },
      { value: "MARKET_WITHDRAWN", label: "Market Withdrawn" },
      { value: "MARKET_RECALL", label: "Market Recall" },
      { value: "PENDING_APPROVAL", label: "Pending Approval" }
    ],
    riskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "Is", label: "Class Is (Sterile)" },
      { value: "Im", label: "Class Im (Measuring)" },
      { value: "Ir", label: "Class Ir (Reusable surgical)" },
      { value: "IIa", label: "Class IIa" },
      { value: "IIb", label: "Class IIb" },
      { value: "III", label: "Class III" }
    ],
    mdrRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "I", label: "Class I" },
      { value: "Is", label: "Class Is (Sterile)" },
      { value: "Im", label: "Class Im (Measuring)" },
      { value: "Ir", label: "Class Ir (Reusable surgical)" },
      { value: "IIa", label: "Class IIa" },
      { value: "IIb", label: "Class IIb" },
      { value: "III", label: "Class III" }
    ],
    ivdRiskClasses: [
      { value: "TBD", label: "Not yet determined" },
      { value: "A", label: "Class A" },
      { value: "B", label: "Class B" },
      { value: "C", label: "Class C" },
      { value: "D", label: "Class D" }
    ]
  }
];

// Helper function to get market data by code
export const getMarketByCode = (code: string): MarketRiskClass | undefined => {
  return marketData.find(market => market.code === code);
};

// Helper function to get appropriate risk classes based on regulatory type
export const getRiskClassesForMarket = (
  marketCode: string,
  isIVD: boolean
): RiskClassOption[] => {
  const market = getMarketByCode(marketCode);
  if (!market) return [];
  
  if (isIVD) {
    return market.ivdRiskClasses;
  }
  return market.mdrRiskClasses;
};

// Define the interface for market selection in the product
export interface ProductMarket {
  code: string;
  selected: boolean;
  riskClass?: string;  
  regulatoryStatus?: string; // Added regulatory status field
  reauditTimeline?: Date | string; // Added reaudit timeline field
  customReauditTimeline?: boolean; // Flag for custom timeline
}

// Helper function to get the label for a regulatory status
export const getRegulatoryStatusLabel = (marketCode: string, statusValue: string): string => {
  const market = getMarketByCode(marketCode);
  if (!market) return statusValue;
  
  const statusObj = market.regulatoryStatuses.find(s => s.value === statusValue);
  return statusObj ? statusObj.label : statusValue;
};

// Define standard reaudit timeline options
export const REAUDIT_TIMELINE_OPTIONS = [
  { value: "1_year", label: "1 year", days: 365 },
  { value: "3_years", label: "3 years", days: 1095 },
  { value: "5_years", label: "5 years", days: 1825 },
  { value: "custom", label: "Custom", days: 0 }
];

// Helper function to calculate a future date based on days
export const getFutureDate = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};
