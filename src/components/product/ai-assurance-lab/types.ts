export interface Dataset {
  id: string;
  name: string;
  size: string;
  type: 'TRAINING' | 'TESTING';
  isLocked: boolean;
  hash?: string;
}

export interface AIModel {
  id: string;
  name: string;
  version: string;
  hash: string;
  status: 'trained' | 'frozen' | 'validated';
}

export interface BiasMetric {
  demographic: string;
  precision: number;
  recall: number;
  f1Score: number;
}

export interface VerificationResult {
  isComplete: boolean;
  metrics: BiasMetric[];
  globalStatus: 'PASS' | 'FAIL';
  logs: string[];
}
