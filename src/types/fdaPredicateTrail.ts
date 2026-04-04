// Types for FDA 510(k) predicate device trail system

export interface PredicateDevice {
  kNumber: string;
  deviceName?: string;
  applicant?: string;
  productCode?: string;
  deviceClass?: string;
  decisionDate?: string;
  statementOrSummary?: string;
  documentUrl?: string;
}

export interface PredicateReference {
  sourceKNumber: string;
  predicateKNumber: string;
  confidence: number;
  extractedText: string;
  referenceType: 'explicit' | 'similar' | 'technology';
}

export interface PredicateTrail {
  deviceKNumber: string;
  targetDevice: PredicateDevice | null;
  upstreamPredicates: PredicateDevice[];
  downstreamReferences: PredicateDevice[];
  predicateChain: PredicateDevice[];
  relatedEudamedDevices: any[];
  trailDepth: number;
  searchDirection: 'both' | 'upstream' | 'downstream';
  hasUpstream: boolean;
  hasDownstream: boolean;
}

export interface DocumentSearchParams {
  query?: string;
  deviceClass?: string;
  productCode?: string;
  applicant?: string;
  dateFrom?: string;
  dateTo?: string;
  searchType: 'fulltext' | 'predicate' | 'similarity';
  kNumber?: string;
  limit?: number;
  skip?: number;
}

export interface DocumentSearchResult {
  device: PredicateDevice;
  relevanceScore: number;
  matchedContent: string;
  documentUrl?: string;
  predicateReferences: PredicateReference[];
}

export interface DocumentIntelligence {
  commonPredicates: Array<{ kNumber: string; count: number; deviceName: string }>;
  regulatoryPatterns: Array<{ pattern: string; frequency: number; examples: string[] }>;
  predicateRecommendations: Array<{ kNumber: string; confidence: number; reasoning: string }>;
  timelineAnalysis: Array<{ year: number; approvals: number; avgProcessingTime: number }>;
}

export interface EUUSBridge {
  eudamedDevice: any;
  suggestedUSPredicates: Array<{ kNumber: string; similarity: number; reasoning: string }>;
  regulatoryGaps: string[];
  marketEntryStrategy: {
    recommendedPathway: string;
    estimatedTimeline: string;
    keyConsiderations: string[];
  };
}