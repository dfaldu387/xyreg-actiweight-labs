// RCA (Root Cause Analysis) Visual Tool Data Types

// Problem Complexity Classification (for RCA guidance)
export type ProblemComplexity = 
  | 'simple'      // Linear cause-effect (human error, missed step)
  | 'multi'       // Multiple variables (yield drop, supplier issue)  
  | 'complex'     // System failure (SW/HW interaction)
  | 'recurring';  // Pattern of multiple different issues

// Problem Complexity Labels
export const PROBLEM_COMPLEXITY_LABELS: Record<ProblemComplexity, string> = {
  simple: 'Simple / Linear',
  multi: 'Multi-Variable',
  complex: 'Complex System Failure',
  recurring: 'Recurring Pattern'
};

// Problem Complexity Descriptions
export const PROBLEM_COMPLEXITY_DESCRIPTIONS: Record<ProblemComplexity, string> = {
  simple: 'Human error, missed step, single point of failure',
  multi: 'Yield drop, supplier issue, multiple contributing factors',
  complex: 'Software/Hardware interaction, system-level failure',
  recurring: 'Multiple similar complaints, pattern of issues'
};

// Ishikawa (Fishbone) Diagram Data Structure
export interface IshikawaData {
  methodology: 'fishbone';
  categories: {
    man: string[];        // People-related causes
    machine: string[];    // Equipment/machinery causes
    method: string[];     // Process/procedure causes
    material: string[];   // Material/supply causes
    measurement: string[]; // Measurement/data causes
    environment: string[]; // Environmental causes
  };
  rootCause: string;      // Final identified root cause
  createdAt: string;
  updatedAt: string;
}

// 5-Whys Analysis Data Structure
export interface FiveWhysData {
  methodology: '5_whys';
  problemStatement: string;
  whyChain: Array<{
    level: number;        // 1-5
    question: string;     // "Why did X happen?"
    answer: string;
    branches?: Array<{    // Optional branching for multiple causes
      question: string;
      answer: string;
    }>;
  }>;
  rootCause: string;      // Final identified root cause
  createdAt: string;
  updatedAt: string;
}

// Fault Tree Analysis (FTA) Data Structure
export interface FaultTreeData {
  methodology: 'fta';
  topEvent: string;               // The failure/hazard being analyzed
  gates: Array<{                  // Boolean logic gates
    id: string;
    type: 'AND' | 'OR';
    description: string;
    parentId: string | null;
  }>;
  basicEvents: Array<{            // Leaf nodes - root causes
    id: string;
    description: string;
    parentGateId: string;
    probability?: number;         // Optional for quantitative FTA
  }>;
  cutSets?: Array<string[]>;      // Minimal cut sets (auto-calculated)
  rootCause: string;
  createdAt: string;
  updatedAt: string;
}

// Pareto Analysis Data Structure  
export interface ParetoData {
  methodology: 'pareto';
  problemCategory: string;        // What are we counting?
  items: Array<{
    id: string;
    category: string;             // e.g., "Supplier A defects"
    count: number;
    percentage?: number;          // Auto-calculated
    cumulativePercentage?: number;
  }>;
  vitalFew: string[];             // Top 20% causes (auto-identified)
  rootCause: string;
  createdAt: string;
  updatedAt: string;
}

// Union type for RCA Data
export type RCAData = IshikawaData | FiveWhysData | FaultTreeData | ParetoData;

// Combined RCA Data - stores multiple methodology results
export interface CombinedRCAData {
  methodologies: string[]; // Array of RCAMethodology values
  fishbone?: IshikawaData;
  five_whys?: FiveWhysData;
  fta?: FaultTreeData;
  pareto?: ParetoData;
  combinedRootCause: string;
  createdAt: string;
  updatedAt: string;
}

// Type guard for combined RCA data
export function isCombinedRCAData(data: unknown): data is CombinedRCAData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'methodologies' in data &&
    Array.isArray((data as CombinedRCAData).methodologies)
  );
}

// Ishikawa Category Labels (6M's)
export const ISHIKAWA_CATEGORY_LABELS: Record<keyof IshikawaData['categories'], string> = {
  man: 'Man (People)',
  machine: 'Machine (Equipment)',
  method: 'Method (Process)',
  material: 'Material',
  measurement: 'Measurement',
  environment: 'Environment'
};

// Ishikawa Category Colors
export const ISHIKAWA_CATEGORY_COLORS: Record<keyof IshikawaData['categories'], string> = {
  man: 'hsl(var(--chart-1))',
  machine: 'hsl(var(--chart-2))',
  method: 'hsl(var(--chart-3))',
  material: 'hsl(var(--chart-4))',
  measurement: 'hsl(var(--chart-5))',
  environment: 'hsl(var(--primary))'
};

// Default empty Ishikawa structure
export function createEmptyIshikawaData(): IshikawaData {
  return {
    methodology: 'fishbone',
    categories: {
      man: [],
      machine: [],
      method: [],
      material: [],
      measurement: [],
      environment: []
    },
    rootCause: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Default empty 5-Whys structure
export function createEmptyFiveWhysData(problemStatement: string = ''): FiveWhysData {
  return {
    methodology: '5_whys',
    problemStatement,
    whyChain: [],
    rootCause: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Default empty FTA structure
export function createEmptyFaultTreeData(topEvent: string = ''): FaultTreeData {
  return {
    methodology: 'fta',
    topEvent,
    gates: [],
    basicEvents: [],
    rootCause: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Default empty Pareto structure
export function createEmptyParetoData(problemCategory: string = ''): ParetoData {
  return {
    methodology: 'pareto',
    problemCategory,
    items: [],
    vitalFew: [],
    rootCause: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Type guard for Ishikawa data
export function isIshikawaData(data: RCAData | null): data is IshikawaData {
  return data?.methodology === 'fishbone';
}

// Type guard for 5-Whys data
export function isFiveWhysData(data: RCAData | null): data is FiveWhysData {
  return data?.methodology === '5_whys';
}

// Type guard for FTA data
export function isFaultTreeData(data: RCAData | null): data is FaultTreeData {
  return data?.methodology === 'fta';
}

// Type guard for Pareto data
export function isParetoData(data: RCAData | null): data is ParetoData {
  return data?.methodology === 'pareto';
}
